import {
  AmenityReservationStatus,
  PaymentStatus,
  ReservationDraftStatus,
} from '@prisma/client';
import {prisma} from '../prismaClient.js';
import {getBuildingAmenities} from './amenityService.js';
import {listReservations} from './reservationService.js';
import {
  canAccessBuilding,
  expensesForActor,
  expenseScope,
  expenseStandingForActor,
  myReservationScope,
  type ChatActor,
  type ExpenseView,
  type StandingUnit,
} from '../lib/chatAccess.js';
import {
  formatHm,
  parseHm,
  zonedClock,
  zonedDateTime,
} from '../lib/zonedTime.js';
import {moneyCents, paidAmount, toMoneyNumber} from '../lib/money.js';
import {reservationWindow, validateReservationSlot} from '../lib/reservationRules.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

type AmenityRow = Awaited<ReturnType<typeof getBuildingAmenities>>[number];

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function matchAmenities(
  rows: AmenityRow[],
  query: string,
): AmenityRow[] {
  const q = normalize(query);
  if (!q) return [];
  return rows.filter(row => {
    const name = normalize(row.amenity.name);
    const key = normalize(row.amenity.key ?? '');
    if (name.includes(q) || q.includes(name)) return true;
    if (key && (key === q || q.includes(key))) return true;
    if (q.includes('zoom') && name.includes('zoom')) return true;
    return false;
  });
}

function money(value: unknown) {
  return toMoneyNumber(value);
}

function remainingOf(expense: {
  amount: unknown;
  payments: {amount: unknown; status: PaymentStatus}[];
}) {
  const remaining = toMoneyNumber(expense.amount) - paidAmount(expense.payments);
  return money(Math.max(remaining, 0));
}

async function requireBuilding(buildingId: string) {
  return prisma.building.findFirst({
    where: {id: buildingId, deleted: false, active: true},
    select: {id: true, name: true},
  });
}

export async function getMyContext(actor: ChatActor) {
  if (actor.globalRole !== 'SUPERADMIN') {
    return {
      globalRole: actor.globalRole,
      buildings: actor.buildings,
      units: actor.units,
    };
  }

  const buildings = await prisma.building.findMany({
    where: {deleted: false, active: true},
    select: {id: true, name: true},
    orderBy: {name: 'asc'},
    take: 50,
  });
  const roleById = new Map(
    actor.buildings.map(building => [building.id, building.role]),
  );
  return {
    globalRole: actor.globalRole,
    buildings: buildings.map(building => ({
      id: building.id,
      name: building.name,
      role: roleById.get(building.id) ?? ('SUPERADMIN' as const),
    })),
    units: actor.units,
  };
}

export async function listAmenitiesForActor(
  actor: ChatActor,
  buildingId: string,
) {
  if (!canAccessBuilding(actor, buildingId, 'member')) {
    return {error: 'INSUFFICIENT_PERMISSIONS' as const};
  }
  const building = await requireBuilding(buildingId);
  if (!building) return {error: 'BUILDING_NOT_FOUND' as const};

  const rows = await getBuildingAmenities(buildingId);
  return {
    buildingId: building.id,
    buildingName: building.name,
    amenities: rows.map(row => ({
      id: row.id,
      name: row.amenity.name,
      key: row.amenity.key,
      isEnabled: row.isEnabled,
      slotMinutes: row.slotMinutes,
      openTime: row.openTime,
      closeTime: row.closeTime,
    })),
  };
}

export async function listMyReservationsForActor(
  actor: ChatActor,
  input: {buildingId?: string} = {},
) {
  const scope = myReservationScope(actor, input.buildingId);
  if (!scope.ok) return {error: scope.error};
  if (scope.buildingIds && scope.buildingIds.length === 0) {
    return {reservations: []};
  }

  const rows = await prisma.amenityReservation.findMany({
    where: {
      status: AmenityReservationStatus.CONFIRMED,
      endsAt: {gt: new Date()},
      OR: [
        {userId: actor.userId},
        ...(scope.unitIds.length > 0 ? [{unitId: {in: scope.unitIds}}] : []),
      ],
      buildingAmenity: {
        ...(scope.buildingIds ? {buildingId: {in: scope.buildingIds}} : {}),
        building: {deleted: false, active: true},
      },
    },
    select: {
      userId: true,
      notes: true,
      startsAt: true,
      endsAt: true,
      unit: {select: {name: true}},
      buildingAmenity: {
        select: {
          amenity: {select: {name: true}},
          building: {select: {name: true}},
        },
      },
    },
    orderBy: {startsAt: 'asc'},
    take: 30,
  });

  return {
    reservations: rows.map(row => {
      const start = zonedClock(row.startsAt);
      const end = zonedClock(row.endsAt);
      return {
        buildingName: row.buildingAmenity.building.name,
        amenityName: row.buildingAmenity.amenity.name,
        unitName: row.unit.name,
        date: start.day,
        time: formatHm(start.minutes),
        endsAtTime: formatHm(end.minutes),
        ...(row.userId === actor.userId && row.notes ? {notes: row.notes} : {}),
      };
    }),
  };
}

export async function checkAmenityAvailabilityForActor(
  actor: ChatActor,
  input: {buildingId: string; amenityQuery: string; date: string},
) {
  if (!canAccessBuilding(actor, input.buildingId, 'member')) {
    return {error: 'INSUFFICIENT_PERMISSIONS' as const};
  }
  if (!DATE_RE.test(input.date)) return {error: 'INVALID_DATE' as const};

  const building = await requireBuilding(input.buildingId);
  if (!building) return {error: 'BUILDING_NOT_FOUND' as const};

  const rows = await getBuildingAmenities(input.buildingId);
  const matches = matchAmenities(rows, input.amenityQuery);
  if (matches.length === 0) return {error: 'AMENITY_NOT_FOUND' as const};
  if (matches.length > 1) {
    return {
      error: 'AMENITY_AMBIGUOUS' as const,
      candidates: matches.map(row => ({id: row.id, name: row.amenity.name})),
    };
  }

  const amenity = matches[0];
  if (!amenity) return {error: 'AMENITY_NOT_FOUND' as const};
  if (!amenity.isEnabled) return {error: 'AMENITY_DISABLED' as const};

  const open = parseHm(amenity.openTime);
  const close = parseHm(amenity.closeTime);
  if (open === null || close === null) return {error: 'INVALID_HOURS' as const};

  const from = zonedDateTime(input.date, '00:00');
  const to = zonedDateTime(input.date, '23:59');
  let reservations: {startsAt: Date; endsAt: Date}[] = [];
  try {
    reservations = await listReservations({
      viewerId: actor.userId,
      buildingId: input.buildingId,
      from,
      to,
      buildingAmenityId: amenity.id,
    });
  } catch (err) {
    const code = err instanceof Error ? err.message : 'RESERVATION_FAILED';
    return {error: code};
  }

  const slots = [];
  for (
    let minute = open;
    minute + amenity.slotMinutes <= close;
    minute += amenity.slotMinutes
  ) {
    const startsAt = zonedDateTime(input.date, formatHm(minute));
    const endsAt = new Date(startsAt.getTime() + amenity.slotMinutes * 60_000);
    const taken = reservations.filter(
      row => row.startsAt < endsAt && row.endsAt > startsAt,
    ).length;
    slots.push({
      time: formatHm(zonedClock(startsAt).minutes),
      available: taken < amenity.maxConcurrent,
    });
  }

  return {
    buildingName: building.name,
    amenityName: amenity.amenity.name,
    date: input.date,
    slots,
  };
}

async function resolveUnit(
  actor: ChatActor,
  buildingId: string,
  unitId: string | undefined,
) {
  const buildingUnits = await prisma.unit.findMany({
    where: {buildingId},
    select: {id: true, name: true},
    orderBy: {name: 'asc'},
  });
  const own = actor.units.filter(unit => unit.buildingId === buildingId);
  const manager = canAccessBuilding(actor, buildingId, 'admin');

  if (unitId) {
    const unit = buildingUnits.find(row => row.id === unitId);
    if (!unit) return {error: 'UNIT_NOT_FOUND' as const};
    if (!manager && !own.some(row => row.id === unitId)) {
      return {error: 'UNIT_NOT_LINKED' as const};
    }
    return {unit};
  }

  if (own.length === 1 && own[0]) {
    return {unit: {id: own[0].id, name: own[0].name}};
  }
  if (manager && buildingUnits.length === 1 && buildingUnits[0]) {
    return {unit: buildingUnits[0]};
  }

  const choices = (own.length > 0 ? own : buildingUnits).map(unit => ({
    id: unit.id,
    name: unit.name,
  }));
  return {error: 'UNIT_AMBIGUOUS' as const, units: choices};
}

export async function draftAmenityReservationForActor(
  actor: ChatActor,
  threadId: string,
  input: {
    buildingId: string;
    amenityQuery: string;
    date: string;
    time: string;
    unitId?: string;
    notes?: string;
  },
) {
  if (!canAccessBuilding(actor, input.buildingId, 'member')) {
    return {error: 'INSUFFICIENT_PERMISSIONS' as const};
  }
  if (!DATE_RE.test(input.date) || !TIME_RE.test(input.time)) {
    return {error: 'INVALID_START' as const};
  }

  const notes = input.notes?.trim() || null;
  const building = await requireBuilding(input.buildingId);
  if (!building) return {error: 'BUILDING_NOT_FOUND' as const};

  const rows = await getBuildingAmenities(input.buildingId);
  const matches = matchAmenities(rows, input.amenityQuery);
  if (matches.length === 0) return {error: 'AMENITY_NOT_FOUND' as const};
  if (matches.length > 1) {
    return {
      error: 'AMENITY_AMBIGUOUS' as const,
      candidates: matches.map(row => ({id: row.id, name: row.amenity.name})),
    };
  }
  const amenity = matches[0];
  if (!amenity) return {error: 'AMENITY_NOT_FOUND' as const};

  const unitResult = await resolveUnit(actor, input.buildingId, input.unitId);
  if ('error' in unitResult && unitResult.error) {
    return unitResult;
  }
  if (!('unit' in unitResult)) return {error: 'UNIT_NOT_FOUND' as const};

  const startsAt = zonedDateTime(input.date, input.time);
  if (Number.isNaN(startsAt.getTime()))
    return {error: 'INVALID_START' as const};
  const windowCode = reservationWindow({startsAt, notes});
  if (windowCode) return {error: windowCode};

  const endsAt = new Date(startsAt.getTime() + amenity.slotMinutes * 60_000);
  const slotCode = validateReservationSlot(amenity, startsAt, endsAt);
  if (slotCode) return {error: slotCode};

  const draft = await prisma.reservationDraft.create({
    data: {
      threadId,
      userId: actor.userId,
      buildingId: building.id,
      buildingAmenityId: amenity.id,
      unitId: unitResult.unit.id,
      startsAt,
      notes,
      amenityName: amenity.amenity.name,
      unitName: unitResult.unit.name,
      buildingName: building.name,
      status: ReservationDraftStatus.PENDING,
    },
  });

  return {
    needsConfirmation: true,
    draftId: draft.id,
    amenityName: draft.amenityName,
    unitName: draft.unitName,
    buildingName: draft.buildingName,
    startsAt: draft.startsAt.toISOString(),
    date: input.date,
    time: input.time,
  };
}

export async function describeDraftConfirmation(
  actor: ChatActor,
  draftId: string,
) {
  const draft = await prisma.reservationDraft.findFirst({
    where: {
      id: draftId,
      userId: actor.userId,
      status: ReservationDraftStatus.PENDING,
    },
  });
  if (!draft) return {error: 'DRAFT_NOT_FOUND' as const};
  return {
    error: 'CONFIRMATION_REQUIRED' as const,
    draftId: draft.id,
    amenityName: draft.amenityName,
    unitName: draft.unitName,
    buildingName: draft.buildingName,
    startsAt: draft.startsAt.toISOString(),
  };
}

export async function getExpensesForActor(
  actor: ChatActor,
  buildingId: string,
) {
  const building = await requireBuilding(buildingId);
  if (!building) {
    if (!canAccessBuilding(actor, buildingId, 'member')) {
      return {error: 'INSUFFICIENT_PERMISSIONS' as const};
    }
    return {error: 'BUILDING_NOT_FOUND' as const};
  }

  const scope = expenseScope(actor, buildingId);
  if (!scope.ok) return {error: scope.error};

  const expenses = await prisma.expense.findMany({
    where: {
      buildingId,
      ...(scope.unitIds ? {unitId: {in: scope.unitIds}} : {}),
    },
    include: {
      unit: {select: {id: true, name: true}},
      period: {select: {period: true}},
      payments: {select: {amount: true, status: true}},
    },
    orderBy: {createdAt: 'desc'},
    take: 80,
  });

  const rows: ExpenseView[] = expenses.map(expense => ({
    unitId: expense.unitId,
    unitName: expense.unit.name,
    period: expense.period.period,
    amount: money(expense.amount),
    status: expense.status,
    balance: remainingOf(expense),
  }));

  const visible = expensesForActor(actor, buildingId, rows);
  if (!visible.ok) return {error: visible.error};
  return {
    buildingName: building.name,
    expenses: visible.expenses.slice(0, 30),
  };
}

export async function listExpenseStandingForActor(
  actor: ChatActor,
  buildingId: string,
) {
  if (!canAccessBuilding(actor, buildingId, 'admin')) {
    return expenseStandingForActor(actor, buildingId, []);
  }

  const building = await requireBuilding(buildingId);
  if (!building) return {error: 'BUILDING_NOT_FOUND' as const};

  const expenses = await prisma.expense.findMany({
    where: {buildingId},
    include: {
      unit: {select: {id: true, name: true}},
      payments: {select: {amount: true, status: true}},
    },
  });

  const byUnit = new Map<string, StandingUnit>();
  for (const expense of expenses) {
    const current = byUnit.get(expense.unitId) ?? {
      unitId: expense.unitId,
      unitName: expense.unit.name,
      status: 'CURRENT' as const,
      balance: 0,
    };
    current.balance = money(current.balance + remainingOf(expense));
    current.status = moneyCents(current.balance) > 0 ? 'IN_DEBT' : 'CURRENT';
    byUnit.set(expense.unitId, current);
  }

  const rows = [...byUnit.values()].sort((a, b) =>
    a.unitName.localeCompare(b.unitName),
  );
  const visible = expenseStandingForActor(actor, buildingId, rows);
  if (!visible.ok) return visible;
  return {
    buildingId: visible.buildingId,
    buildingName: building.name,
    units: visible.units,
  };
}
