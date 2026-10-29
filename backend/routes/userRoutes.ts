import {Router} from 'express';
import type {Response, NextFunction} from 'express';
import {
  authMiddleware,
  superAdminOnly,
  type AuthenticatedRequest,
} from '../middleware/authMiddleware.js';
import {
  findUserById,
  createGlobalUser,
  createUserWithRole,
  getAllUsers,
  getUsersByBuildings,
  getRoomersByBuildings,
  updateUser,
  updateUserBuildingAssignment,
  deleteUser,
  passwordMatches,
  toPublicUser,
} from '../services/userService.js';
import {prisma} from '../prismaClient.js';
import {
  canCreateRole,
  canDeleteUser,
  canEditUser,
  decideUserEdit,
  relationForRole,
  userAuditEvents,
  validateUnitAssignment,
  asBuildingRole,
  type AccessPerson,
} from '../lib/userAccess.js';
import {createAuditLog, getAuditLogsByUser} from '../services/auditService.js';
import {GlobalRole, UnitRelationType} from '@prisma/client';

const router = Router();

function toAccessPerson(user: {
  id: string;
  globalRole: GlobalRole;
  buildingUsers: {buildingId: string; role: {name: string}}[];
  userUnits: {
    unitId: string;
    relationType: string;
    unit: {buildingId: string};
  }[];
}): AccessPerson {
  return {
    id: user.id,
    globalRole: user.globalRole,
    buildings: user.buildingUsers.flatMap(membership => {
      const role = asBuildingRole(membership.role.name);
      return role ? [{id: membership.buildingId, role}] : [];
    }),
    units: user.userUnits.map(link => ({
      id: link.unitId,
      buildingId: link.unit.buildingId,
    })),
    ownedUnitIds: user.userUnits
      .filter(link => link.relationType === 'OWNER')
      .map(link => link.unitId),
  };
}

async function assertUnitAssignment(
  actor: {
    buildingUsers: {buildingId: string; role: {name: string}}[];
    userUnits: {unitId: string; relationType: string}[];
  },
  buildingId: string,
  roleName: string,
  unitIds: string[],
) {
  const creatorRole =
    actor.buildingUsers.find(membership => membership.buildingId === buildingId)
      ?.role.name ?? null;
  const error = validateUnitAssignment({
    roleName,
    unitIds,
    actorIsOwner: creatorRole === 'Owner',
    ownedUnitIds: actor.userUnits
      .filter(link => link.relationType === 'OWNER')
      .map(link => link.unitId),
  });
  if (error) throw new Error(error);
  await assertUnitsInBuilding(buildingId, unitIds);
}

async function assertUnitsInBuilding(buildingId: string, unitIds: string[]) {
  if (unitIds.length === 0) return;
  const units = await prisma.unit.findMany({
    where: {id: {in: unitIds}, buildingId},
  });
  if (units.length !== unitIds.length) {
    throw new Error('UNITS_NOT_IN_BUILDING');
  }
}

router.get(
  '/',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({error: 'UNAUTHENTICATED'});
      }

      const actor = await findUserById(req.user.id);
      if (!actor) return res.status(404).json({error: 'USER_NOT_FOUND'});

      const visibleUsers = await getVisibleUsersForActor(req.user.id);
      if (visibleUsers.length === 0) {
        return res.status(403).json({error: 'INSUFFICIENT_PERMISSIONS'});
      }

      const actorPerson = toAccessPerson(actor);
      const filtered = visibleUsers.filter(u => u.id !== req.user!.id);
      return res.json(
        filtered.map(user => ({
          ...toPublicUser(user),
          canEdit: canEditUser(actorPerson, toAccessPerson(user)),
          canDelete: canDeleteUser(actor),
        })),
      );
    } catch (err) {
      next(err);
    }
  },
);

async function getVisibleUsersForActor(actorId: string) {
  const user = await findUserById(actorId);
  if (!user) return [];

  const adminBuildingIds = user.buildingUsers
    .filter(bu => bu.role.name === 'Admin')
    .map(bu => bu.buildingId);

  if (adminBuildingIds.length > 0) {
    return getUsersByBuildings(adminBuildingIds);
  }

  if (user.globalRole === GlobalRole.SUPERADMIN) {
    return getAllUsers();
  }

  const ownerBuildingIds = user.buildingUsers
    .filter(bu => bu.role.name === 'Owner')
    .map(bu => bu.buildingId);

  if (ownerBuildingIds.length > 0) {
    return getRoomersByBuildings(ownerBuildingIds);
  }

  return [];
}

router.get(
  '/:id/audit-logs',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({error: 'UNAUTHENTICATED'});
      }

      const targetUser = await findUserById(req.params.id as string);
      if (!targetUser) return res.status(404).json({error: 'USER_NOT_FOUND'});

      const visibleUsers = await getVisibleUsersForActor(req.user.id);
      const canView = visibleUsers.some(user => user.id === targetUser.id);
      if (!canView) {
        return res.status(404).json({error: 'USER_NOT_FOUND'});
      }

      const logs = await getAuditLogsByUser(targetUser.id);
      return res.json(logs);
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({error: 'UNAUTHENTICATED'});
      }

      const targetUser = await findUserById(req.params.id as string);
      if (!targetUser) return res.status(404).json({error: 'USER_NOT_FOUND'});

      const visibleUsers = await getVisibleUsersForActor(req.user.id);
      const canView = visibleUsers.some(u => u.id === req.params.id);
      if (!canView) {
        return res.status(404).json({error: 'USER_NOT_FOUND'});
      }

      res.json(toPublicUser(targetUser));
    } catch (err) {
      next(err);
    }
  },
);

router.put(
  '/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({error: 'UNAUTHENTICATED'});
      }

      const actor = await findUserById(req.user.id);
      if (!actor || !actor.isActive) {
        return res.status(404).json({error: 'USER_NOT_FOUND'});
      }

      const targetUserId = req.params.id as string;
      const target = await findUserById(targetUserId);
      if (!target) return res.status(404).json({error: 'USER_NOT_FOUND'});

      const body = req.body ?? {};
      const decision = decideUserEdit(
        toAccessPerson(actor),
        toAccessPerson(target),
        {
          email: body.email,
          firstName: body.firstName,
          lastName: body.lastName,
          phone: body.phone,
          password: body.password ?? body.passwordPlain,
          currentPassword: body.currentPassword,
          isActive: body.isActive,
          buildingId: body.buildingId,
          roleName: body.roleName,
          unitIds: body.unitIds,
        },
      );
      if (!decision.ok) {
        return res.status(decision.status).json({error: decision.error});
      }

      if (decision.currentPassword) {
        const matches = await passwordMatches(
          target.passwordHash,
          decision.currentPassword,
        );
        if (!matches) {
          return res.status(400).json({error: 'INVALID_CURRENT_PASSWORD'});
        }
      }

      if (decision.assignment) {
        await assertUnitAssignment(
          actor,
          decision.assignment.buildingId,
          decision.assignment.roleName,
          decision.assignment.unitIds,
        );
      }

      let user = await updateUser(targetUserId, decision.profile);
      if (decision.assignment) {
        const updated = await updateUserBuildingAssignment(
          targetUserId,
          decision.assignment.buildingId,
          decision.assignment.roleName,
          decision.assignment.unitIds,
        );
        user = updated ?? user;
      }

      const access = toAccessPerson(target);
      const membership = decision.assignment
        ? access.buildings.find(
            building => building.id === decision.assignment?.buildingId,
          )
        : access.buildings[0];
      const events = userAuditEvents({
        actorId: actor.id,
        targetId: target.id,
        previous: {
          isActive: target.isActive,
          buildingId: decision.assignment?.buildingId ?? membership?.id ?? null,
          role: membership?.role ?? null,
          unitIds: membership
            ? access.units
                .filter(unit => unit.buildingId === membership.id)
                .map(unit => unit.id)
            : [],
        },
        decision,
      });
      for (const event of events) {
        await createAuditLog({
          action: event.action,
          entityType: 'USER',
          entityId: target.id,
          buildingId: event.buildingId,
          actorUserId: actor.id,
          ...(Object.keys(event.metadata).length > 0
            ? {metadata: event.metadata}
            : {}),
        });
      }

      res.json(toPublicUser(user));
    } catch (err) {
      if (err instanceof Error) {
        const m = err.message;
        if (
          m === 'OWNER_UNITS_REQUIRED' ||
          m === 'ROOMER_SINGLE_UNIT_REQUIRED' ||
          m === 'UNITS_NOT_IN_BUILDING' ||
          m === 'OWNER_CAN_ASSIGN_ONLY_OWN_UNITS' ||
          m === 'ADMIN_CANNOT_HAVE_UNITS' ||
          m === 'CREATOR_NOT_FOUND' ||
          m === 'INVALID_ROLE_NAME' ||
          m === 'PASSWORD_TOO_SHORT'
        ) {
          return res.status(400).json({error: m});
        }
      }
      next(err);
    }
  },
);

router.delete(
  '/:id',
  authMiddleware,
  superAdminOnly,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await deleteUser(req.params.id as string);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({error: 'UNAUTHENTICATED'});
      }

      const actor = await findUserById(req.user.id);
      if (!actor || actor.globalRole !== GlobalRole.SUPERADMIN) {
        return res.status(403).json({error: 'SUPER_ADMIN_ONLY'});
      }

      const {email, firstName, lastName, phone, password, globalRole} =
        req.body ?? {};

      if (!email || !firstName || !lastName || !password || !globalRole) {
        return res.status(400).json({error: 'MISSING_REQUIRED_FIELDS'});
      }

      if (globalRole !== GlobalRole.SUPERADMIN) {
        return res.status(400).json({error: 'INVALID_GLOBAL_ROLE'});
      }

      const created = await createGlobalUser({
        email,
        firstName,
        lastName,
        phone,
        passwordPlain: password,
        globalRole,
      });

      return res.status(201).json(toPublicUser(created));
    } catch (err) {
      if (
        err instanceof Error &&
        err.message.includes(
          'Unique constraint failed on the fields: (`email`)',
        )
      ) {
        return res.status(400).json({error: 'EMAIL_ALREADY_EXISTS'});
      }
      return next(err);
    }
  },
);

router.post(
  '/building/:buildingId',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const {buildingId} = req.params;
      const {email, firstName, lastName, phone, password, roleName, unitIds} =
        req.body ?? {};
      const normalizedUnitIds = Array.isArray(unitIds)
        ? (unitIds as string[])
        : [];

      if (!buildingId) {
        return res.status(400).json({error: 'BUILDING_ID_REQUIRED'});
      }

      if (!email || !firstName || !lastName || !password || !roleName) {
        return res.status(400).json({error: 'MISSING_REQUIRED_FIELDS'});
      }

      if (!req.user?.id) {
        return res.status(401).json({error: 'UNAUTHENTICATED'});
      }

      const creator = await findUserById(req.user.id);
      if (!creator || !creator.isActive) {
        return res.status(404).json({error: 'CREATOR_NOT_FOUND'});
      }

      const creatorBuildingUser = creator.buildingUsers.find(
        (bu: {buildingId: string}) => bu.buildingId === buildingId,
      );

      const creatorBuildingRoleName = creatorBuildingUser?.role?.name || null;

      const isAllowed = canCreateRole(
        creator.globalRole,
        creatorBuildingRoleName,
        roleName,
      );

      if (!isAllowed) {
        return res.status(403).json({error: 'INSUFFICIENT_PERMISSIONS'});
      }

      const targetRole = await prisma.role.findFirst({
        where: {name: roleName},
      });

      if (!targetRole) {
        return res.status(400).json({error: 'INVALID_ROLE_NAME'});
      }

      if (roleName === 'SUPERADMIN') {
        return res.status(400).json({error: 'INVALID_ROLE_FOR_BUILDING'});
      }

      await assertUnitAssignment(
        creator,
        buildingId as string,
        roleName as string,
        normalizedUnitIds,
      );

      const relation = relationForRole(roleName as string);
      const unitRelationType = relation ? UnitRelationType[relation] : undefined;

      const {user, buildingUser} = await createUserWithRole(
        {email, firstName, lastName, phone, passwordPlain: password},
        buildingId as string,
        targetRole.id,
        normalizedUnitIds,
        unitRelationType,
      );

      return res.status(201).json({
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: buildingUser.role.name,
          unitIds: normalizedUnitIds,
        },
      });
    } catch (err) {
      if (err instanceof Error) {
        const m = err.message;
        if (
          m === 'OWNER_UNITS_REQUIRED' ||
          m === 'ROOMER_SINGLE_UNIT_REQUIRED' ||
          m === 'UNITS_NOT_IN_BUILDING' ||
          m === 'OWNER_CAN_ASSIGN_ONLY_OWN_UNITS' ||
          m === 'ADMIN_CANNOT_HAVE_UNITS' ||
          m === 'CREATOR_NOT_FOUND' ||
          m === 'PASSWORD_TOO_SHORT'
        ) {
          return res.status(400).json({error: m});
        }
      }
      if (
        err instanceof Error &&
        err.message.includes(
          'Unique constraint failed on the fields: (`email`)',
        )
      ) {
        return res.status(400).json({error: 'EMAIL_ALREADY_EXISTS'});
      }
      return next(err);
    }
  },
);

export default router;
