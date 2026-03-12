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
import {GlobalRole} from '@prisma/client';
import {createUnit, getUnitsByBuildingId} from '../services/unitService.js';
import {
  createBuildingAmenity,
  getAmenityCatalog,
  getBuildingAmenities,
} from '../services/amenityService.js';

const router = Router();

function getAssignedBuildingIds(buildingUsers: {buildingId: string; role: {name: string}}[]) {
  const adminIds = buildingUsers
    .filter(bu => bu.role.name === 'Admin')
    .map(bu => bu.buildingId);
  const ownerIds = buildingUsers
    .filter(bu => bu.role.name === 'Owner')
    .map(bu => bu.buildingId);
  return {adminIds, ownerIds};
}

function hasRoleForBuilding(
  user: {
    globalRole: GlobalRole;
    buildingUsers: {buildingId: string; role: {name: string}}[];
  },
  buildingId: string,
  allowedRoles: string[],
) {
  if (user.globalRole === GlobalRole.SUPERADMIN) {
    return true;
  }

  return user.buildingUsers.some(
    bu => bu.buildingId === buildingId && allowedRoles.includes(bu.role.name),
  );
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

      if (user.globalRole === GlobalRole.SUPERADMIN) {
        const buildings = await getAllBuildings();
        return res.json(buildings);
      }

      const {adminIds, ownerIds} = getAssignedBuildingIds(user.buildingUsers);

      if (adminIds.length > 0) {
        const buildings = await getBuildingsByIds(adminIds);
        return res.json(buildings);
      }

      if (ownerIds.length > 0) {
        const buildings = await getBuildingsByIds(ownerIds);
        return res.json(buildings);
      }

      return res.status(403).json({error: 'INSUFFICIENT_PERMISSIONS'});
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

      if (user.globalRole !== GlobalRole.SUPERADMIN) {
        const {adminIds, ownerIds} = getAssignedBuildingIds(user.buildingUsers);
        const allowedIds = [...adminIds, ...ownerIds];
        if (!allowedIds.includes(buildingId)) {
          return res.status(403).json({error: 'INSUFFICIENT_PERMISSIONS'});
        }
      }

      res.json(building);
    } catch (err) {
      next(err);
    }
  },
);

// POST /
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

// PUT /:id
router.put(
  '/:id',
  authMiddleware,
  superAdminOnly,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const building = await updateBuilding(req.params.id as string, req.body);
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
      const isMember = hasRoleForBuilding(user, buildingId, ['Admin', 'Owner']);
      if (!isMember) {
        return res.status(403).json({error: 'INSUFFICIENT_PERMISSIONS'});
      }

      const units = await getUnitsByBuildingId(buildingId);
      if (user.globalRole === GlobalRole.SUPERADMIN) {
        return res.json(units);
      }

      const buildingRole = user.buildingUsers.find(bu => bu.buildingId === buildingId)?.role
        .name;

      if (buildingRole === 'Admin') {
        return res.json(units);
      }

      // Owner can only see units they own (to assign roomers).
      const ownedUnitIds = user.userUnits
        .filter(userUnit => userUnit.relationType === 'OWNER')
        .map(userUnit => userUnit.unitId);
      return res.json(units.filter(unit => ownedUnitIds.includes(unit.id)));
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
      const canManage = hasRoleForBuilding(user, buildingId, ['Admin']);
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
        ...((req.body?.floor as string | undefined) ? {floor: req.body.floor as string} : {}),
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
      const isMember = hasRoleForBuilding(user, buildingId, ['Admin', 'Owner']);
      if (!isMember) {
        return res.status(403).json({error: 'INSUFFICIENT_PERMISSIONS'});
      }

      const [catalog, amenities] = await Promise.all([
        getAmenityCatalog(),
        getBuildingAmenities(buildingId),
      ]);
      return res.json({catalog, amenities});
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
      const canManage = hasRoleForBuilding(user, buildingId, ['Admin']);
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

export default router;
