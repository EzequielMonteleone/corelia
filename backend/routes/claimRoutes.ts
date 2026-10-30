import {Router} from 'express';
import type {Response, NextFunction} from 'express';
import {
  authMiddleware,
  type AuthenticatedRequest,
} from '../middleware/authMiddleware.js';
import {
  ClaimError,
  createClaimForActor,
  listClaimsForActor,
  loadClaimActor,
  updateClaimForActor,
} from '../services/claimService.js';

function sendClaimError(err: unknown, res: Response, next: NextFunction) {
  if (err instanceof ClaimError) {
    return res.status(err.status).json({error: err.message});
  }
  return next(err);
}

async function actorOf(req: AuthenticatedRequest, res: Response) {
  if (!req.user?.id) {
    res.status(401).json({error: 'UNAUTHENTICATED'});
    return null;
  }
  return loadClaimActor(req.user.id);
}

export const buildingClaimRouter = Router({mergeParams: true});

buildingClaimRouter.get(
  '/:buildingId/claims',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const actor = await actorOf(req, res);
      if (!actor) return;
      const unitQuery = req.query.unitId;
      const amenityQuery = req.query.buildingAmenityId;
      if (
        (unitQuery !== undefined && typeof unitQuery !== 'string') ||
        (amenityQuery !== undefined && typeof amenityQuery !== 'string') ||
        (typeof unitQuery === 'string' && typeof amenityQuery === 'string')
      ) {
        return res.status(400).json({error: 'INVALID_CLAIM'});
      }
      const buildingId = req.params.buildingId as string;
      const list = await listClaimsForActor(actor, buildingId, {
        ...(typeof unitQuery === 'string' ? {unitId: unitQuery} : {}),
        ...(typeof amenityQuery === 'string'
          ? {buildingAmenityId: amenityQuery}
          : {}),
      });
      return res.json(list);
    } catch (err) {
      return sendClaimError(err, res, next);
    }
  },
);

buildingClaimRouter.post(
  '/:buildingId/claims',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const actor = await actorOf(req, res);
      if (!actor) return;
      const created = await createClaimForActor(
        actor,
        req.body ?? {},
        req.params.buildingId as string,
      );
      return res.status(201).json(created);
    } catch (err) {
      return sendClaimError(err, res, next);
    }
  },
);

export const unitClaimRouter = Router();

unitClaimRouter.post(
  '/:unitId/claims',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const actor = await actorOf(req, res);
      if (!actor) return;
      const body = req.body ?? {};
      const created = await createClaimForActor(actor, {
        title: body.title,
        body: body.body,
        unitId: req.params.unitId,
      });
      return res.status(201).json(created);
    } catch (err) {
      return sendClaimError(err, res, next);
    }
  },
);

export const claimRouter = Router();

claimRouter.patch(
  '/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const actor = await actorOf(req, res);
      if (!actor) return;
      const updated = await updateClaimForActor(
        actor,
        req.params.id as string,
        req.body ?? {},
      );
      return res.json(updated);
    } catch (err) {
      return sendClaimError(err, res, next);
    }
  },
);
