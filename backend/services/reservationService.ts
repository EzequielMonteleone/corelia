import {AmenityReservationStatus, GlobalRole, Prisma} from '@prisma/client';
import {prisma} from '../prismaClient.js';
import {findUserById} from './userService.js';
import {APP_TIMEZONE, parseHm, zonedClock} from '../lib/zonedTime.js';

const MAX_NOTES = 500;
const MAX_DAYS_AHEAD = 60;

export class ReservationError extends Error {
  status: number;

  constructor(code: string, status = 400) {
    super(code);
    this.status = status;
  }
}

const reservationInclude = {
  unit: {select: {id: true, name: true, buildingId: true}},
  user: {select: {id: true, firstName: true, lastName: true}},
  buildingAmenity: {
    select: {
      id: true,
      buildingId: true,
      amenity: {select: {name: true}},
    },
  },
} satisfies Prisma.AmenityReservationInclude;

type ReservationRow = Prisma.AmenityReservationGetPayload<{
  include: typeof reservationInclude;
}>;

function present(row: ReservationRow, viewerId: string, isManager: boolean) {
  const mine = row.userId === viewerId;
  const showDetails = mine || isManager;
  return {
    id: row.id,
    buildingAmenityId: row.buildingAmenityId,
    unitId: row.unitId,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    status: row.status,
    notes: showDetails ? row.notes : null,
    mine,
    unit: {id: row.unit.id, name: row.unit.name},
    amenityName: row.buildingAmenity.amenity.name,
    user: showDetails ? row.user : null,
  };
}

function isManagerOf(
  user: {globalRole: GlobalRole; buildingUsers: {buildingId: string; role: {name: string}}[]},
  buildingId: string,
) {
  if (user.globalRole === GlobalRole.SUPERADMIN) return true;
  return user.buildingUsers.some(
    bu => bu.buildingId === buildingId && bu.role.name === 'Admin',
  );
}

function isMemberOf(
  user: {globalRole: GlobalRole; buildingUsers: {buildingId: string; role: {name: string}}[]},
  buildingId: string,
) {
  if (user.globalRole === GlobalRole.SUPERADMIN) return true;
  return user.buildingUsers.some(
    bu =>
      bu.buildingId === buildingId &&
      ['Admin', 'Owner', 'Roomer'].includes(bu.role.name),
  );
}

export async function listReservations(params: {
  viewerId: string;
  buildingId: string;
  from: Date;
  to: Date;
  buildingAmenityId?: string;
}) {
  const user = await findUserById(params.viewerId);
  if (!user || !user.isActive) throw new ReservationError('USER_NOT_FOUND', 404);
  if (!isMemberOf(user, params.buildingId)) {
    throw new ReservationError('INSUFFICIENT_PERMISSIONS', 403);
  }
  if (Number.isNaN(params.from.getTime()) || Number.isNaN(params.to.getTime())) {
    throw new ReservationError('INVALID_RANGE');
  }
  if (params.to <= params.from) throw new ReservationError('INVALID_RANGE');

  const rows = await prisma.amenityReservation.findMany({
    where: {
      status: AmenityReservationStatus.CONFIRMED,
      startsAt: {lt: params.to},
      endsAt: {gt: params.from},
      buildingAmenity: {
        buildingId: params.buildingId,
        ...(params.buildingAmenityId ? {id: params.buildingAmenityId} : {}),
      },
    },
    include: reservationInclude,
    orderBy: {startsAt: 'asc'},
  });

  const manager = isManagerOf(user, params.buildingId);
  return rows.map(row => present(row, params.viewerId, manager));
}

function assertSlot(amenity: {
  isEnabled: boolean;
  slotMinutes: number;
  openTime: string;
  closeTime: string;
}, startsAt: Date, endsAt: Date) {
  if (!amenity.isEnabled) throw new ReservationError('AMENITY_DISABLED');

  const open = parseHm(amenity.openTime);
  const close = parseHm(amenity.closeTime);
  if (open === null || close === null || open >= close) {
    throw new ReservationError('INVALID_HOURS');
  }

  const startClock = zonedClock(startsAt);
  const endClock = zonedClock(endsAt);
  if (startClock.day !== endClock.day) throw new ReservationError('SLOT_OUTSIDE_HOURS');
  if (startClock.minutes < open || endClock.minutes > close) {
    throw new ReservationError('SLOT_OUTSIDE_HOURS');
  }
  if ((startClock.minutes - open) % amenity.slotMinutes !== 0) {
    throw new ReservationError('SLOT_OUTSIDE_HOURS');
  }
  if (endClock.minutes - startClock.minutes !== amenity.slotMinutes) {
    throw new ReservationError('SLOT_OUTSIDE_HOURS');
  }
}

export async function createReservation(params: {
  viewerId: string;
  buildingId: string;
  buildingAmenityId: string;
  unitId: string;
  startsAt: Date;
  notes?: string;
}) {
  const user = await findUserById(params.viewerId);
  if (!user || !user.isActive) throw new ReservationError('USER_NOT_FOUND', 404);
  if (!isMemberOf(user, params.buildingId)) {
    throw new ReservationError('INSUFFICIENT_PERMISSIONS', 403);
  }
  if (Number.isNaN(params.startsAt.getTime())) {
    throw new ReservationError('INVALID_START');
  }

  const now = Date.now();
  if (params.startsAt.getTime() < now - 60_000) {
    throw new ReservationError('SLOT_IN_PAST');
  }
  if (params.startsAt.getTime() > now + MAX_DAYS_AHEAD * 24 * 60 * 60 * 1000) {
    throw new ReservationError('SLOT_TOO_FAR');
  }

  const notes = params.notes?.trim() || null;
  if (notes && notes.length > MAX_NOTES) throw new ReservationError('NOTES_TOO_LONG');

  const amenity = await prisma.buildingAmenity.findFirst({
    where: {id: params.buildingAmenityId, buildingId: params.buildingId},
  });
  if (!amenity) throw new ReservationError('BUILDING_AMENITY_NOT_FOUND', 404);

  const unit = await prisma.unit.findFirst({
    where: {id: params.unitId, buildingId: params.buildingId},
  });
  if (!unit) throw new ReservationError('UNIT_NOT_FOUND', 404);

  const manager = isManagerOf(user, params.buildingId);
  const linked = user.userUnits.some(link => link.unitId === params.unitId);
  if (!manager && !linked) throw new ReservationError('UNIT_NOT_LINKED', 403);

  const endsAt = new Date(params.startsAt.getTime() + amenity.slotMinutes * 60_000);
  assertSlot(amenity, params.startsAt, endsAt);

  try {
    const created = await prisma.$transaction(
      async tx => {
        const overlapping = await tx.amenityReservation.count({
          where: {
            buildingAmenityId: amenity.id,
            status: AmenityReservationStatus.CONFIRMED,
            startsAt: {lt: endsAt},
            endsAt: {gt: params.startsAt},
          },
        });
        if (overlapping >= amenity.maxConcurrent) {
          throw new ReservationError('SLOT_UNAVAILABLE', 409);
        }
        return tx.amenityReservation.create({
          data: {
            buildingAmenityId: amenity.id,
            unitId: unit.id,
            userId: params.viewerId,
            startsAt: params.startsAt,
            endsAt,
            notes,
          },
          include: reservationInclude,
        });
      },
      {isolationLevel: Prisma.TransactionIsolationLevel.Serializable},
    );
    return present(created, params.viewerId, manager);
  } catch (err) {
    if (err instanceof ReservationError) throw err;
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2034') {
      throw new ReservationError('SLOT_UNAVAILABLE', 409);
    }
    throw err;
  }
}

export async function cancelReservation(params: {viewerId: string; reservationId: string}) {
  const user = await findUserById(params.viewerId);
  if (!user || !user.isActive) throw new ReservationError('USER_NOT_FOUND', 404);

  const row = await prisma.amenityReservation.findUnique({
    where: {id: params.reservationId},
    include: reservationInclude,
  });
  if (!row) throw new ReservationError('RESERVATION_NOT_FOUND', 404);

  const buildingId = row.buildingAmenity.buildingId;
  const manager = isManagerOf(user, buildingId);
  if (row.userId !== params.viewerId && !manager) {
    throw new ReservationError('INSUFFICIENT_PERMISSIONS', 403);
  }
  if (row.status === AmenityReservationStatus.CANCELLED) {
    throw new ReservationError('ALREADY_CANCELLED');
  }

  const updated = await prisma.amenityReservation.update({
    where: {id: row.id},
    data: {status: AmenityReservationStatus.CANCELLED},
    include: reservationInclude,
  });
  return present(updated, params.viewerId, manager);
}

export {APP_TIMEZONE};
