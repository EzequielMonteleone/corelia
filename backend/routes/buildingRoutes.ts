import {Router} from 'express';
import type {Response, NextFunction} from 'express';
import {
  authMiddleware,
  superAdminOnly,
  type AuthenticatedRequest,
} from '../middleware/authMiddleware.js';
import {
  getAllBuildings,
  getBuildingById,
  createBuilding,
  updateBuilding,
  deleteBuilding,
} from '../services/buildingService.js';
import userRoutes from './userRoutes.js';

const router = Router();

// GET /
router.get(
  '/',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const buildings = await getAllBuildings();
      res.json(buildings);
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
      const building = await getBuildingById(req.params.id as string);
      if (!building) {
        return res.status(404).json({error: 'BUILDING_NOT_FOUND'});
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
