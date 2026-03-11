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

// Mount nested routes
router.use('/:buildingId/users', userRoutes);

export default router;
