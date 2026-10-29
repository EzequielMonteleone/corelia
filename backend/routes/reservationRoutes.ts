import {Router} from 'express';
import type {Response, NextFunction} from 'express';
import {
  authMiddleware,
  type AuthenticatedRequest,
} from '../middleware/authMiddleware.js';
import {
  ReservationError,
  cancelReservation,
  createReservation,
  listReservations,
  slotsForAmenityDay,
} from '../services/reservationService.js';

function sendReservationError(
  err: unknown,
  res: Response,
  next: NextFunction,
) {
  if (err instanceof ReservationError) {
    return res.status(err.status).json({error: err.message});
  }
  return next(err);
}

export const buildingReservationRouter = Router();

buildingReservationRouter.get(
  '/:buildingId/reservations',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) return res.status(401).json({error: 'UNAUTHENTICATED'});
      const from = new Date(String(req.query.from ?? ''));
      const to = new Date(String(req.query.to ?? ''));
      const buildingAmenityId =
        typeof req.query.amenityId === 'string' ? req.query.amenityId : undefined;
      const buildingId = req.params.buildingId as string;
      const rows = await listReservations({
        viewerId: req.user.id,
        buildingId,
        from,
        to,
        ...(buildingAmenityId ? {buildingAmenityId} : {}),
      });
      const slots = buildingAmenityId
        ? await slotsForAmenityDay({
            buildingId,
            buildingAmenityId,
            from,
            takenStarts: rows.map(row => new Date(row.startsAt)),
          })
        : [];
      return res.json({reservations: rows, slots});
    } catch (err) {
      return sendReservationError(err, res, next);
    }
  },
);

buildingReservationRouter.post(
  '/:buildingId/reservations',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) return res.status(401).json({error: 'UNAUTHENTICATED'});
      const buildingAmenityId = req.body?.buildingAmenityId as string | undefined;
      const unitId = req.body?.unitId as string | undefined;
      const startsAtRaw = req.body?.startsAt as string | undefined;
      if (!buildingAmenityId || !unitId || !startsAtRaw) {
        return res.status(400).json({error: 'MISSING_REQUIRED_FIELDS'});
      }
      const created = await createReservation({
        viewerId: req.user.id,
        buildingId: req.params.buildingId as string,
        buildingAmenityId,
        unitId,
        startsAt: new Date(startsAtRaw),
        ...(typeof req.body?.notes === 'string' ? {notes: req.body.notes} : {}),
      });
      return res.status(201).json(created);
    } catch (err) {
      return sendReservationError(err, res, next);
    }
  },
);

const reservationRouter = Router();

reservationRouter.post(
  '/:id/cancel',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) return res.status(401).json({error: 'UNAUTHENTICATED'});
      const updated = await cancelReservation({
        viewerId: req.user.id,
        reservationId: req.params.id as string,
      });
      return res.json(updated);
    } catch (err) {
      return sendReservationError(err, res, next);
    }
  },
);

export default reservationRouter;
