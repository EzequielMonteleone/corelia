import {Router} from 'express';
import type {Response, NextFunction} from 'express';
import {
  authMiddleware,
  type AuthenticatedRequest,
} from '../middleware/authMiddleware.js';
import {GlobalRole} from '@prisma/client';
import {findUserById} from '../services/userService.js';
import {
  deleteBuildingAmenity,
  getAmenityCatalog,
  updateBuildingAmenity,
} from '../services/amenityService.js';
import {prisma} from '../prismaClient.js';

const router = Router();

async function canManageBuildingAmenities(userId: string, buildingId: string) {
  const user = await findUserById(userId);
  if (!user || !user.isActive) {
    return false;
  }
  if (user.globalRole === GlobalRole.SUPERADMIN) {
    return true;
  }
  const buildingRole = user.buildingUsers.find(bu => bu.buildingId === buildingId);
  return buildingRole?.role.name === 'Admin';
}

router.get(
  '/catalog',
  authMiddleware,
  async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const catalog = await getAmenityCatalog();
      return res.json(catalog);
    } catch (err) {
      return next(err);
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

      const buildingAmenity = await prisma.buildingAmenity.findUnique({
        where: {id: req.params.id as string},
      });
      if (!buildingAmenity) {
        return res.status(404).json({error: 'BUILDING_AMENITY_NOT_FOUND'});
      }

      const allowed = await canManageBuildingAmenities(
        req.user.id,
        buildingAmenity.buildingId,
      );
      if (!allowed) {
        return res.status(403).json({error: 'INSUFFICIENT_PERMISSIONS'});
      }

      const body = req.body ?? {};
      const updated = await updateBuildingAmenity(req.params.id as string, {
        ...(typeof body.isEnabled === 'boolean' ? {isEnabled: body.isEnabled} : {}),
        ...(typeof body.customName === 'string' ? {customName: body.customName} : {}),
        ...(typeof body.slotMinutes === 'number' ? {slotMinutes: body.slotMinutes} : {}),
        ...(typeof body.maxConcurrent === 'number'
          ? {maxConcurrent: body.maxConcurrent}
          : {}),
        ...(typeof body.openTime === 'string' ? {openTime: body.openTime} : {}),
        ...(typeof body.closeTime === 'string' ? {closeTime: body.closeTime} : {}),
        ...(typeof body.rules === 'string' || body.rules === null
          ? {rules: body.rules as string | null}
          : {}),
      });
      return res.json(updated);
    } catch (err) {
      if (err instanceof Error) {
        const known = [
          'INVALID_SLOT_MINUTES',
          'INVALID_MAX_CONCURRENT',
          'INVALID_OPEN_TIME',
          'INVALID_CLOSE_TIME',
          'INVALID_HOURS',
          'RULES_TOO_LONG',
          'BUILDING_AMENITY_NOT_FOUND',
        ];
        if (known.includes(err.message)) {
          const status = err.message === 'BUILDING_AMENITY_NOT_FOUND' ? 404 : 400;
          return res.status(status).json({error: err.message});
        }
      }
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

      const buildingAmenity = await prisma.buildingAmenity.findUnique({
        where: {id: req.params.id as string},
      });
      if (!buildingAmenity) {
        return res.status(404).json({error: 'BUILDING_AMENITY_NOT_FOUND'});
      }

      const allowed = await canManageBuildingAmenities(
        req.user.id,
        buildingAmenity.buildingId,
      );
      if (!allowed) {
        return res.status(403).json({error: 'INSUFFICIENT_PERMISSIONS'});
      }

      await deleteBuildingAmenity(req.params.id as string);
      return res.status(204).send();
    } catch (err) {
      return next(err);
    }
  },
);

export default router;
