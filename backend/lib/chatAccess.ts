export type {BuildingRoleName} from '../types/member.js';
import type {
  BuildingMember,
  BuildingRoleName,
  GlobalRoleName,
  LinkedUnit,
  UnitRelationName,
} from '../types/member.js';
export {asBuildingRole, canAccessBuilding} from './buildingAccess.js';
import {canAccessBuilding} from './buildingAccess.js';

export type ChatToolName =
  | 'getMyContext'
  | 'listAmenities'
  | 'listMyReservations'
  | 'checkAmenityAvailability'
  | 'draftAmenityReservation'
  | 'confirmAmenityReservation'
  | 'getMyExpenses'
  | 'listExpenseStanding'
  | 'searchBuildingDocs'
  | 'listClaims'
  | 'draftClaim'
  | 'draftClaimResolution'
  | 'confirmClaimDraft';

export type ChatActor = {
  userId: string;
  firstName: string;
  lastName: string;
  globalRole: GlobalRoleName;
  buildings: {
    id: string;
    name: string;
    role: BuildingRoleName;
  }[];
  units: {
    id: string;
    name: string;
    buildingId: string;
    relationType: UnitRelationName;
  }[];
};

export type StandingUnit = {
  unitId: string;
  unitName: string;
  status: 'CURRENT' | 'IN_DEBT';
  balance: number;
};

export type ExpenseView = {
  unitId: string;
  unitName: string;
  period: string;
  amount: number;
  status: string;
  balance: number;
};

export type ReservationDraftInput = {
  userId: string;
  buildingId: string;
  buildingAmenityId: string;
  unitId: string;
  startsAt: Date;
  notes: string | null;
};

const MEMBER_TOOLS: ChatToolName[] = [
  'getMyContext',
  'listAmenities',
  'listMyReservations',
  'checkAmenityAvailability',
  'draftAmenityReservation',
  'confirmAmenityReservation',
  'getMyExpenses',
  'searchBuildingDocs',
  'listClaims',
  'draftClaim',
  'confirmClaimDraft',
];

export function toolsForActor(actor: ChatActor): ChatToolName[] {
  const tools = [...MEMBER_TOOLS];
  const managesABuilding =
    actor.globalRole === 'SUPERADMIN' ||
    actor.buildings.some(building => building.role === 'Admin');
  if (managesABuilding) {
    tools.push('draftClaimResolution');
    tools.push('listExpenseStanding');
  }
  return tools;
}

export type ExpenseScopeActor = BuildingMember & {
  units: LinkedUnit[];
};

export function expenseScope(
  actor: ExpenseScopeActor,
  buildingId: string,
):
  | {ok: false; error: 'INSUFFICIENT_PERMISSIONS'}
  | {ok: true; unitIds: string[] | null} {
  if (!canAccessBuilding(actor, buildingId, 'member')) {
    return {ok: false, error: 'INSUFFICIENT_PERMISSIONS'};
  }
  if (canAccessBuilding(actor, buildingId, 'admin')) {
    return {ok: true, unitIds: null};
  }
  return {
    ok: true,
    unitIds: actor.units
      .filter(unit => unit.buildingId === buildingId)
      .map(unit => unit.id),
  };
}

export function expensesForActor(
  actor: ChatActor,
  buildingId: string,
  rows: ExpenseView[],
):
  | {ok: false; error: 'INSUFFICIENT_PERMISSIONS'}
  | {ok: true; expenses: ExpenseView[]} {
  const scope = expenseScope(actor, buildingId);
  if (!scope.ok) return scope;
  if (scope.unitIds === null) return {ok: true, expenses: rows};
  const allowed = new Set(scope.unitIds);
  return {ok: true, expenses: rows.filter(row => allowed.has(row.unitId))};
}

/** Admin and superadmin only. A denial carries no unit names or balances. */
export function expenseStandingForActor(
  actor: ChatActor,
  buildingId: string,
  rows: StandingUnit[],
):
  | {ok: false; error: 'INSUFFICIENT_PERMISSIONS'}
  | {ok: true; buildingId: string; units: StandingUnit[]} {
  if (!canAccessBuilding(actor, buildingId, 'admin')) {
    return {ok: false, error: 'INSUFFICIENT_PERMISSIONS'};
  }
  return {
    ok: true,
    buildingId,
    units: rows.map(row => ({
      unitId: row.unitId,
      unitName: row.unitName,
      status: row.status,
      balance: row.balance,
    })),
  };
}

export function canSearchBuildingDocs(
  actor: ChatActor,
  buildingId: string,
): boolean {
  return canAccessBuilding(actor, buildingId, 'member');
}

/** Reservations this person can call "mine": ones they made, or ones on their units. */
export function myReservationScope(
  actor: ChatActor,
  buildingId?: string,
):
  | {ok: false; error: 'INSUFFICIENT_PERMISSIONS'}
  | {ok: true; buildingIds: string[] | null; unitIds: string[]} {
  const requested = buildingId?.trim() || undefined;
  if (requested && !canAccessBuilding(actor, requested, 'member')) {
    return {ok: false, error: 'INSUFFICIENT_PERMISSIONS'};
  }

  const buildings = requested
    ? [requested]
    : actor.buildings.map(building => building.id);
  const unitIds = actor.units
    .filter(unit => !requested || unit.buildingId === requested)
    .map(unit => unit.id);

  if (!requested && actor.globalRole === 'SUPERADMIN') {
    return {ok: true, buildingIds: null, unitIds};
  }
  return {ok: true, buildingIds: buildings, unitIds};
}

type CreateReservation = (params: {
  viewerId: string;
  buildingId: string;
  buildingAmenityId: string;
  unitId: string;
  startsAt: Date;
  notes?: string;
}) => Promise<{id: string}>;

export async function confirmReservationDraft(args: {
  actor: ChatActor;
  draft: ReservationDraftInput;
  userConfirmed: boolean;
  createReservation: CreateReservation;
}): Promise<
  | {ok: true; reservation: {id: string}}
  | {ok: false; error: string; status: number}
> {
  if (args.draft.userId !== args.actor.userId) {
    return {ok: false, error: 'DRAFT_NOT_FOUND', status: 404};
  }
  if (!canAccessBuilding(args.actor, args.draft.buildingId, 'member')) {
    return {ok: false, error: 'INSUFFICIENT_PERMISSIONS', status: 403};
  }
  const manager = canAccessBuilding(args.actor, args.draft.buildingId, 'admin');
  const linked = args.actor.units.some(unit => unit.id === args.draft.unitId);
  if (!manager && !linked) {
    return {ok: false, error: 'UNIT_NOT_LINKED', status: 403};
  }
  if (!args.userConfirmed) {
    return {ok: false, error: 'CONFIRMATION_REQUIRED', status: 409};
  }

  try {
    const reservation = await args.createReservation({
      viewerId: args.actor.userId,
      buildingId: args.draft.buildingId,
      buildingAmenityId: args.draft.buildingAmenityId,
      unitId: args.draft.unitId,
      startsAt: args.draft.startsAt,
      ...(args.draft.notes ? {notes: args.draft.notes} : {}),
    });
    return {ok: true, reservation};
  } catch (err) {
    const code = err instanceof Error ? err.message : 'RESERVATION_FAILED';
    const statusValue =
      typeof err === 'object' &&
      err !== null &&
      'status' in err &&
      typeof err.status === 'number'
        ? err.status
        : 400;
    return {ok: false, error: code, status: statusValue};
  }
}
