import {Router} from 'express';
import type {Response, NextFunction} from 'express';
import {
  authMiddleware,
  type AuthenticatedRequest,
} from '../middleware/authMiddleware.js';
import {
  HouseholdError,
  createMember,
  createPet,
  createVehicle,
  deleteMember,
  deletePet,
  deleteVehicle,
  getHousehold,
  updateMember,
  updatePet,
  updateVehicle,
} from '../services/householdService.js';

function sendHouseholdError(err: unknown, res: Response, next: NextFunction) {
  if (err instanceof HouseholdError) {
    return res.status(err.status).json({error: err.message});
  }
  return next(err);
}

function viewerId(req: AuthenticatedRequest, res: Response) {
  if (!req.user?.id) {
    res.status(401).json({error: 'UNAUTHENTICATED'});
    return null;
  }
  return req.user.id;
}

export const unitHouseholdRouter = Router();

unitHouseholdRouter.get(
  '/:unitId/household',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = viewerId(req, res);
      if (!userId) return;
      const household = await getHousehold(userId, req.params.unitId as string);
      return res.json(household);
    } catch (err) {
      return sendHouseholdError(err, res, next);
    }
  },
);

unitHouseholdRouter.post(
  '/:unitId/members',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = viewerId(req, res);
      if (!userId) return;
      const created = await createMember(userId, req.params.unitId as string, req.body ?? {});
      return res.status(201).json(created);
    } catch (err) {
      return sendHouseholdError(err, res, next);
    }
  },
);

unitHouseholdRouter.post(
  '/:unitId/vehicles',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = viewerId(req, res);
      if (!userId) return;
      const created = await createVehicle(
        userId,
        req.params.unitId as string,
        req.body ?? {},
      );
      return res.status(201).json(created);
    } catch (err) {
      return sendHouseholdError(err, res, next);
    }
  },
);

unitHouseholdRouter.post(
  '/:unitId/pets',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = viewerId(req, res);
      if (!userId) return;
      const created = await createPet(userId, req.params.unitId as string, req.body ?? {});
      return res.status(201).json(created);
    } catch (err) {
      return sendHouseholdError(err, res, next);
    }
  },
);

export const memberRouter = Router();

memberRouter.put(
  '/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = viewerId(req, res);
      if (!userId) return;
      const updated = await updateMember(userId, req.params.id as string, req.body ?? {});
      return res.json(updated);
    } catch (err) {
      return sendHouseholdError(err, res, next);
    }
  },
);

memberRouter.delete(
  '/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = viewerId(req, res);
      if (!userId) return;
      await deleteMember(userId, req.params.id as string);
      return res.status(204).send();
    } catch (err) {
      return sendHouseholdError(err, res, next);
    }
  },
);

export const vehicleRouter = Router();

vehicleRouter.put(
  '/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = viewerId(req, res);
      if (!userId) return;
      const updated = await updateVehicle(userId, req.params.id as string, req.body ?? {});
      return res.json(updated);
    } catch (err) {
      return sendHouseholdError(err, res, next);
    }
  },
);

vehicleRouter.delete(
  '/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = viewerId(req, res);
      if (!userId) return;
      await deleteVehicle(userId, req.params.id as string);
      return res.status(204).send();
    } catch (err) {
      return sendHouseholdError(err, res, next);
    }
  },
);

export const petRouter = Router();

petRouter.put(
  '/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = viewerId(req, res);
      if (!userId) return;
      const updated = await updatePet(userId, req.params.id as string, req.body ?? {});
      return res.json(updated);
    } catch (err) {
      return sendHouseholdError(err, res, next);
    }
  },
);

petRouter.delete(
  '/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = viewerId(req, res);
      if (!userId) return;
      await deletePet(userId, req.params.id as string);
      return res.status(204).send();
    } catch (err) {
      return sendHouseholdError(err, res, next);
    }
  },
);
