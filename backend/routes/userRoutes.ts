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
} from '../services/userService.js';
import {prisma} from '../prismaClient.js';
import {canCreateRole} from '../utils/rbacHelper.js';
import {GlobalRole, UnitRelationType} from '@prisma/client';

const router = Router();

async function canEditUser(
  actorId: string,
  targetUserId: string,
): Promise<boolean> {
  const actor = await findUserById(actorId);
  if (!actor || !actor.isActive) {
    return false;
  }

  if (actor.globalRole === GlobalRole.SUPERADMIN) {
    return true;
  }

  if (actor.id === targetUserId) {
    return true;
  }

  const targetUser = await findUserById(targetUserId);
  if (!targetUser) {
    return false;
  }

  const actorBuildingIds = actor.buildingUsers.map(bu => bu.buildingId);
  const targetBuildingIds = targetUser.buildingUsers.map(bu => bu.buildingId);
  return targetBuildingIds.some(id => actorBuildingIds.includes(id));
}

async function validateUnitsForRole(
  buildingId: string,
  creatorId: string,
  targetRoleName: string,
  unitIds: string[],
) {
  if (targetRoleName === 'Admin') {
    if (unitIds.length > 0) {
      throw new Error('ADMIN_CANNOT_HAVE_UNITS');
    }
    return;
  }

  if (targetRoleName === 'Owner' && unitIds.length === 0) {
    throw new Error('OWNER_UNITS_REQUIRED');
  }

  if (targetRoleName === 'Roomer' && unitIds.length !== 1) {
    throw new Error('ROOMER_SINGLE_UNIT_REQUIRED');
  }

  if (unitIds.length === 0) {
    return;
  }

  const units = await prisma.unit.findMany({
    where: {
      id: {in: unitIds},
      buildingId,
    },
  });

  if (units.length !== unitIds.length) {
    throw new Error('UNITS_NOT_IN_BUILDING');
  }

  const creator = await findUserById(creatorId);
  if (!creator) {
    throw new Error('CREATOR_NOT_FOUND');
  }

  const creatorBuildingRole = creator.buildingUsers.find(
    bu => bu.buildingId === buildingId,
  )?.role.name;

  if (creatorBuildingRole === 'Owner') {
    const creatorOwnedUnitIds = creator.userUnits
      .filter(userUnit => userUnit.relationType === 'OWNER')
      .map(userUnit => userUnit.unitId);

    const allOwned = unitIds.every(unitId => creatorOwnedUnitIds.includes(unitId));
    if (!allOwned) {
      throw new Error('OWNER_CAN_ASSIGN_ONLY_OWN_UNITS');
    }
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

      const filtered = visibleUsers.filter(u => u.id !== req.user!.id);
      return res.json(filtered);
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

      res.json(targetUser);
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

      const allowed = await canEditUser(req.user.id, req.params.id as string);
      if (!allowed) {
        return res.status(403).json({error: 'INSUFFICIENT_PERMISSIONS'});
      }

      const targetUserId = req.params.id as string;
      const {
        email,
        firstName,
        lastName,
        phone,
        isActive,
        password,
        passwordPlain,
        buildingId,
        roleName,
        unitIds: rawUnitIds,
      } = req.body ?? {};

      const profilePayload: Record<string, unknown> = {};
      if (email !== undefined) profilePayload.email = email;
      if (firstName !== undefined) profilePayload.firstName = firstName;
      if (lastName !== undefined) profilePayload.lastName = lastName;
      if (phone !== undefined) profilePayload.phone = phone;
      if (isActive !== undefined) profilePayload.isActive = isActive;
      if (password !== undefined || passwordPlain !== undefined) {
        profilePayload.passwordPlain = password ?? passwordPlain;
      }

      let user = await updateUser(targetUserId, profilePayload as any);

      const unitIds = Array.isArray(rawUnitIds) ? (rawUnitIds as string[]) : [];

      if (
        buildingId &&
        roleName &&
        user.globalRole !== GlobalRole.SUPERADMIN
      ) {
        await validateUnitsForRole(
          buildingId as string,
          req.user.id,
          roleName as string,
          unitIds,
        );
        const updated = await updateUserBuildingAssignment(
          targetUserId,
          buildingId as string,
          roleName as string,
          unitIds,
        );
        user = updated ?? user;
      }

      res.json(user);
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
          m === 'INVALID_ROLE_NAME'
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

      return res.status(201).json(created);
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

      await validateUnitsForRole(
        buildingId as string,
        req.user.id,
        roleName as string,
        normalizedUnitIds,
      );

      const unitRelationType =
        roleName === 'Owner'
          ? UnitRelationType.OWNER
          : roleName === 'Roomer'
            ? UnitRelationType.ROOMER
            : undefined;

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
          m === 'CREATOR_NOT_FOUND'
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
