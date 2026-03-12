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

      const updated = await updateBuildingAmenity(req.params.id as string, {
        ...(typeof req.body?.isEnabled === 'boolean'
          ? {isEnabled: req.body.isEnabled as boolean}
          : {}),
        ...((req.body?.customName as string | undefined)
          ? {customName: req.body.customName as string}
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
