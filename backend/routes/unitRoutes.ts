import {Router} from 'express';
import type {Response, NextFunction} from 'express';
import {
  authMiddleware,
  type AuthenticatedRequest,
} from '../middleware/authMiddleware.js';
import {GlobalRole} from '@prisma/client';
import {findUserById} from '../services/userService.js';
import {
  createUnit,
  deleteUnit,
  getUnitById,
  updateUnit,
} from '../services/unitService.js';

const router = Router();

async function canManageBuildingUnits(userId: string, buildingId: string) {
  const user = await findUserById(userId);
  if (!user || !user.isActive) {
    return {allowed: false, user: null};
  }

  if (user.globalRole === GlobalRole.SUPERADMIN) {
    return {allowed: true, user};
  }

  const buildingRole = user.buildingUsers.find(bu => bu.buildingId === buildingId);
  const roleName = buildingRole?.role.name;
  const allowed = roleName === 'Admin';

  return {allowed, user};
}

router.put(
  '/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({error: 'UNAUTHENTICATED'});
      }

      const unit = await getUnitById(req.params.id as string);
      if (!unit) {
        return res.status(404).json({error: 'UNIT_NOT_FOUND'});
      }

      const {allowed} = await canManageBuildingUnits(req.user.id, unit.buildingId);
      if (!allowed) {
        return res.status(403).json({error: 'INSUFFICIENT_PERMISSIONS'});
      }

      const updated = await updateUnit(req.params.id as string, {
        ...((req.body?.name as string | undefined) ? {name: req.body.name as string} : {}),
        ...(typeof req.body?.floor !== 'undefined'
          ? {floor: req.body.floor as string}
          : {}),
        ...(typeof req.body?.coefficient === 'number'
          ? {coefficient: req.body.coefficient as number}
          : {}),
      });

      return res.json(updated);
    } catch (err) {
      return next(err);
    }
  },
);

router.delete(
  '/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({error: 'UNAUTHENTICATED'});
      }

      const unit = await getUnitById(req.params.id as string);
      if (!unit) {
        return res.status(404).json({error: 'UNIT_NOT_FOUND'});
      }

      const {allowed} = await canManageBuildingUnits(req.user.id, unit.buildingId);
      if (!allowed) {
        return res.status(403).json({error: 'INSUFFICIENT_PERMISSIONS'});
      }

      await deleteUnit(req.params.id as string);
      return res.status(204).send();
    } catch (err) {
      return next(err);
    }
  },
);

router.post(
  '/building/:buildingId',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({error: 'UNAUTHENTICATED'});
      }
      const buildingId = req.params.buildingId as string;
      const {allowed} = await canManageBuildingUnits(req.user.id, buildingId);
      if (!allowed) {
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

export default router;
