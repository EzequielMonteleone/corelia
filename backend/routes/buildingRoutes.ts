import {Router} from 'express';
import type {Response, NextFunction} from 'express';
import {
  authMiddleware,
  superAdminOnly,
  type AuthenticatedRequest,
} from '../middleware/authMiddleware.js';
import {
  getAllBuildings,
  getBuildingsByIds,
  getBuildingById,
  createBuilding,
  updateBuilding,
  deleteBuilding,
} from '../services/buildingService.js';
import {findUserById} from '../services/userService.js';
import userRoutes from './userRoutes.js';
import {createUnit, getUnitsByBuildingId} from '../services/unitService.js';
import {
  createBuildingAmenity,
  getAmenityCatalog,
  getBuildingAmenities,
} from '../services/amenityService.js';
import {
  canAccessBuilding,
  canDeleteBuilding,
  canOpenBuilding,
  listedBuildingIds,
  toBuildingMember,
} from '../lib/buildingAccess.js';
import type {MembershipUser} from '../types/member.js';
import {unitAccess} from '../lib/householdRules.js';
import {assignableRoles, roleCatalog} from '../lib/userAccess.js';
import {buildingPeriodRouter} from './expenseRoutes.js';

const router = Router();

function presentBuilding<T extends {id: string}>(
  building: T,
  user: MembershipUser,
) {
  const actor = toBuildingMember(user);
  const buildingRole =
    actor.buildings.find(membership => membership.id === building.id)?.role ??
    null;
  return {
    ...building,
    canManage: canAccessBuilding(actor, building.id, 'admin'),
    canDelete: canDeleteBuilding(actor),
    roleCatalog: roleCatalog(),
    assignableRoles: assignableRoles({
      globalRole: user.globalRole,
      buildingRole,
    }),
  };
}

function hasRoleForBuilding(
  user: MembershipUser,
  buildingId: string,
  level: 'admin' | 'member',
) {
  return canAccessBuilding(toBuildingMember(user), buildingId, level);
}

// GET /
router.get(
  '/',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({error: 'UNAUTHENTICATED'});
      }

      const user = await findUserById(req.user.id);
      if (!user) return res.status(404).json({error: 'USER_NOT_FOUND'});

      const present = <T extends {id: string}>(buildings: T[]) =>
        buildings.map(building => presentBuilding(building, user));

      const scope = listedBuildingIds(toBuildingMember(user));
      if (scope.kind === 'none') {
        return res.status(403).json({error: 'INSUFFICIENT_PERMISSIONS'});
      }

      const buildings =
        scope.kind === 'all'
          ? await getAllBuildings()
          : await getBuildingsByIds(scope.ids);
      return res.json(present(buildings));
    } catch (err) {
      next(err);
    }
  },
);

// GET /:id
router.get(
  '/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({error: 'UNAUTHENTICATED'});
      }

      const user = await findUserById(req.user.id);
      if (!user) return res.status(404).json({error: 'USER_NOT_FOUND'});

      const buildingId = req.params.id as string;
      const building = await getBuildingById(buildingId);
      if (!building) {
        return res.status(404).json({error: 'BUILDING_NOT_FOUND'});
      }

      if (!canOpenBuilding(toBuildingMember(user), buildingId)) {
        return res.status(403).json({error: 'INSUFFICIENT_PERMISSIONS'});
      }

      res.json(presentBuilding(building, user));
    } catch (err) {
      next(err);
    }
  },
);

// POST / — Solo superadmin puede registrar un edificio
router.post(
  '/',
  authMiddleware,
  superAdminOnly,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const {name, address, city, country, taxId, logo, planType} = req.body;
      if (!name || !address || !city || !country) {
        return res.status(400).json({error: 'MISSING_REQUIRED_FIELDS'});
      }
      const building = await createBuilding({
        name,
        address,
        city,
        country,
        taxId,
        logo,
        planType,
      });
      res.status(201).json(building);
    } catch (err) {
      next(err);
    }
  },
);

// PUT /:id — Super admin o Admin de ese edificio pueden actualizar
router.put(
  '/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({error: 'UNAUTHENTICATED'});
      }
      const user = await findUserById(req.user.id);
      if (!user) return res.status(404).json({error: 'USER_NOT_FOUND'});
      const buildingId = req.params.id as string;
      const canUpdate = hasRoleForBuilding(user, buildingId, 'admin');
      if (!canUpdate) {
        return res.status(403).json({error: 'INSUFFICIENT_PERMISSIONS'});
      }
      const building = await updateBuilding(buildingId, req.body);
      res.json(building);
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /:id
router.delete(
  '/:id',
  authMiddleware,
  superAdminOnly,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await deleteBuilding(req.params.id as string);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

// GET /:buildingId/units
router.get(
  '/:buildingId/units',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({error: 'UNAUTHENTICATED'});
      }
      const buildingId = req.params.buildingId as string;
      const user = await findUserById(req.user.id);
      if (!user) {
        return res.status(404).json({error: 'USER_NOT_FOUND'});
      }
      const isMember = hasRoleForBuilding(user, buildingId, 'member');
      if (!isMember) {
        return res.status(403).json({error: 'INSUFFICIENT_PERMISSIONS'});
      }

      const units = await getUnitsByBuildingId(buildingId);
      const viewer = {
        globalRole:
          user.globalRole === 'SUPERADMIN'
            ? ('SUPERADMIN' as const)
            : ('USER' as const),
        buildingUsers: user.buildingUsers,
        userUnits: user.userUnits.flatMap(link =>
          link.relationType === 'OWNER' || link.relationType === 'ROOMER'
            ? [
                {
                  unitId: link.unitId,
                  relationType: link.relationType,
                  unit: {buildingId: link.unit.buildingId},
                },
              ]
            : [],
        ),
      };
      return res.json(
        units.filter(
          unit => unitAccess(viewer, {id: unit.id, buildingId}) === 'OK',
        ),
      );
    } catch (err) {
      return next(err);
    }
  },
);

// POST /:buildingId/units
router.post(
  '/:buildingId/units',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({error: 'UNAUTHENTICATED'});
      }
      const buildingId = req.params.buildingId as string;
      const user = await findUserById(req.user.id);
      if (!user) {
        return res.status(404).json({error: 'USER_NOT_FOUND'});
      }
      const canManage = hasRoleForBuilding(user, buildingId, 'admin');
      if (!canManage) {
        return res.status(403).json({error: 'INSUFFICIENT_PERMISSIONS'});
      }

      const name = req.body?.name as string | undefined;
      if (!name) {
        return res.status(400).json({error: 'UNIT_NAME_REQUIRED'});
      }

      const unit = await createUnit({
        buildingId,
        name,
        ...((req.body?.floor as string | undefined)
          ? {floor: req.body.floor as string}
          : {}),
        ...(typeof req.body?.coefficient === 'number'
          ? {coefficient: req.body.coefficient as number}
          : {}),
      });
      return res.status(201).json(unit);
    } catch (err) {
      return next(err);
    }
  },
);

// GET /:buildingId/amenities
router.get(
  '/:buildingId/amenities',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({error: 'UNAUTHENTICATED'});
      }
      const buildingId = req.params.buildingId as string;
      const user = await findUserById(req.user.id);
      if (!user) {
        return res.status(404).json({error: 'USER_NOT_FOUND'});
      }
      const isMember = hasRoleForBuilding(user, buildingId, 'member');
      if (!isMember) {
        return res.status(403).json({error: 'INSUFFICIENT_PERMISSIONS'});
      }

      const canManage = hasRoleForBuilding(user, buildingId, 'admin');
      const [catalog, amenities] = await Promise.all([
        canManage ? getAmenityCatalog() : Promise.resolve([]),
        getBuildingAmenities(buildingId),
      ]);
      return res.json({
        catalog,
        amenities: canManage
          ? amenities
          : amenities.filter(item => item.isEnabled),
      });
    } catch (err) {
      return next(err);
    }
  },
);

// POST /:buildingId/amenities
router.post(
  '/:buildingId/amenities',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({error: 'UNAUTHENTICATED'});
      }
      const buildingId = req.params.buildingId as string;
      const user = await findUserById(req.user.id);
      if (!user) {
        return res.status(404).json({error: 'USER_NOT_FOUND'});
      }
      const canManage = hasRoleForBuilding(user, buildingId, 'admin');
      if (!canManage) {
        return res.status(403).json({error: 'INSUFFICIENT_PERMISSIONS'});
      }

      const amenity = await createBuildingAmenity({
        buildingId,
        ...((req.body?.amenityId as string | undefined)
          ? {amenityId: req.body.amenityId as string}
          : {}),
        ...((req.body?.customAmenityName as string | undefined)
          ? {customAmenityName: req.body.customAmenityName as string}
          : {}),
      });
      return res.status(201).json(amenity);
    } catch (err) {
      if (err instanceof Error && err.message === 'AMENITY_OR_NAME_REQUIRED') {
        return res.status(400).json({error: 'AMENITY_OR_NAME_REQUIRED'});
      }
      return next(err);
    }
  },
);

// Mount nested routes
router.use('/:buildingId/users', userRoutes);
router.use('/:buildingId/expense-periods', buildingPeriodRouter);

export default router;
