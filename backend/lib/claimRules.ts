import {canAccessBuilding} from './buildingAccess.js';
import type {BuildingMember, UnitRelationName} from '../types/member.js';

export const CLAIM_STATUSES = ['OPEN', 'IN_PROGRESS', 'CLOSED'] as const;

export type ClaimStatusName = (typeof CLAIM_STATUSES)[number];

const MAX_TITLE = 120;
const MAX_TEXT = 2000;

export type ClaimActor = BuildingMember & {
  userId: string;
  units: {
    id: string;
    buildingId: string;
    relationType: UnitRelationName;
  }[];
};

export type ClaimCreateInput = {
  title: string;
  body: string;
};

export type ClaimUpdateInput = {
  status?: ClaimStatusName;
  reply?: string | null;
};

export type ClaimTarget =
  {kind: 'unit'; unitId: string} | {kind: 'amenity'; buildingAmenityId: string};

export type ClaimListScope =
  | {ok: false; error: 'INSUFFICIENT_PERMISSIONS' | 'UNIT_NOT_LINKED'}
  | {
      ok: true;
      unitIds: string[] | null;
      includeAmenityClaims: boolean;
      buildingAmenityId: string | null;
      canCreate: boolean;
      canCreateAmenity: boolean;
    };

export type ClaimDraftSnapshot = {
  userId: string;
  kind: 'CREATE' | 'RESOLVE';
  buildingId: string;
  unitId: string | null;
  buildingAmenityId: string | null;
};

type ClaimAccess = 'OK' | 'INSUFFICIENT_PERMISSIONS' | 'UNIT_NOT_LINKED';

function residentRole(actor: ClaimActor, buildingId: string) {
  const role = actor.buildings.find(
    building => building.id === buildingId,
  )?.role;
  if (role === 'Owner' || role === 'Roomer') return role;
  return null;
}

function relationFor(role: 'Owner' | 'Roomer'): UnitRelationName {
  return role === 'Owner' ? 'OWNER' : 'ROOMER';
}

/** Units whose link matches the resident role. An admin link does not count. */
export function residentUnitIds(
  actor: ClaimActor,
  buildingId: string,
): string[] {
  const role = residentRole(actor, buildingId);
  if (!role) return [];
  const relation = relationFor(role);
  return actor.units
    .filter(
      unit => unit.buildingId === buildingId && unit.relationType === relation,
    )
    .map(unit => unit.id);
}

/**
 * Creating a claim is the resident link, not unitAccess.
 * unitAccess lets the building admin through. expenseScope accepts any unit link.
 */
export function claimCreateAccess(
  actor: ClaimActor,
  unit: {id: string; buildingId: string},
): ClaimAccess {
  const role = residentRole(actor, unit.buildingId);
  if (!role) return 'INSUFFICIENT_PERMISSIONS';
  const relation = relationFor(role);
  const linked = actor.units.some(
    link =>
      link.id === unit.id &&
      link.buildingId === unit.buildingId &&
      link.relationType === relation,
  );
  return linked ? 'OK' : 'UNIT_NOT_LINKED';
}

export function canManageClaim(actor: ClaimActor, buildingId: string): boolean {
  return canAccessBuilding(actor, buildingId, 'admin');
}

/** An amenity belongs to the building, so any resident of that building can file it. */
export function claimAmenityAccess(
  actor: ClaimActor,
  buildingId: string,
): 'OK' | 'INSUFFICIENT_PERMISSIONS' {
  return residentRole(actor, buildingId) ? 'OK' : 'INSUFFICIENT_PERMISSIONS';
}

export function claimListScope(
  actor: ClaimActor,
  buildingId: string,
  filter: {unitId?: string; buildingAmenityId?: string} = {},
): ClaimListScope {
  const unitId = filter.unitId;
  const buildingAmenityId = filter.buildingAmenityId;
  const canCreateAmenity = claimAmenityAccess(actor, buildingId) === 'OK';

  if (canManageClaim(actor, buildingId)) {
    if (buildingAmenityId) {
      return {
        ok: true,
        unitIds: [],
        includeAmenityClaims: true,
        buildingAmenityId,
        canCreate: false,
        canCreateAmenity: false,
      };
    }
    return {
      ok: true,
      unitIds: unitId ? [unitId] : null,
      includeAmenityClaims: !unitId,
      buildingAmenityId: null,
      canCreate: unitId
        ? claimCreateAccess(actor, {id: unitId, buildingId}) === 'OK'
        : false,
      canCreateAmenity: false,
    };
  }
  if (!canAccessBuilding(actor, buildingId, 'member')) {
    return {ok: false, error: 'INSUFFICIENT_PERMISSIONS'};
  }
  const own = residentUnitIds(actor, buildingId);
  if (buildingAmenityId) {
    return {
      ok: true,
      unitIds: [],
      includeAmenityClaims: true,
      buildingAmenityId,
      canCreate: canCreateAmenity,
      canCreateAmenity,
    };
  }
  if (unitId && !own.includes(unitId)) {
    return {ok: false, error: 'UNIT_NOT_LINKED'};
  }
  return {
    ok: true,
    unitIds: unitId ? [unitId] : own,
    includeAmenityClaims: !unitId,
    buildingAmenityId: null,
    canCreate: Boolean(unitId && own.includes(unitId)),
    canCreateAmenity,
  };
}

export function claimDraftConfirmAccess(
  actor: ClaimActor,
  draft: ClaimDraftSnapshot,
): ClaimAccess | 'DRAFT_NOT_FOUND' {
  if (draft.userId !== actor.userId) return 'DRAFT_NOT_FOUND';
  if (draft.kind === 'RESOLVE') {
    return canManageClaim(actor, draft.buildingId)
      ? 'OK'
      : 'INSUFFICIENT_PERMISSIONS';
  }
  if (draft.buildingAmenityId) {
    return claimAmenityAccess(actor, draft.buildingId);
  }
  if (!draft.unitId) return 'UNIT_NOT_LINKED';
  return claimCreateAccess(actor, {
    id: draft.unitId,
    buildingId: draft.buildingId,
  });
}

export function parseClaimTarget(input: {
  unitId?: unknown;
  buildingAmenityId?: unknown;
}): ClaimTarget | 'INVALID_CLAIM' {
  const unitId = optionalId(input.unitId);
  const buildingAmenityId = optionalId(input.buildingAmenityId);
  if (unitId === 'INVALID_CLAIM' || buildingAmenityId === 'INVALID_CLAIM') {
    return 'INVALID_CLAIM';
  }
  if (unitId && buildingAmenityId) return 'INVALID_CLAIM';
  if (unitId) return {kind: 'unit', unitId};
  if (buildingAmenityId) return {kind: 'amenity', buildingAmenityId};
  return 'INVALID_CLAIM';
}

function optionalId(value: unknown): string | null | 'INVALID_CLAIM' {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') return 'INVALID_CLAIM';
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed;
}

function requiredText(value: unknown, max: number): string | 'INVALID_CLAIM' {
  if (typeof value !== 'string') return 'INVALID_CLAIM';
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) return 'INVALID_CLAIM';
  return trimmed;
}

function optionalReply(value: unknown): string | null | 'INVALID_CLAIM' {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') return 'INVALID_CLAIM';
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > MAX_TEXT) return 'INVALID_CLAIM';
  return trimmed;
}

export function parseClaimCreate(input: {
  title?: unknown;
  body?: unknown;
}): ClaimCreateInput | 'INVALID_CLAIM' {
  const title = requiredText(input.title, MAX_TITLE);
  const body = requiredText(input.body, MAX_TEXT);
  if (title === 'INVALID_CLAIM' || body === 'INVALID_CLAIM')
    return 'INVALID_CLAIM';
  return {title, body};
}

export function parseClaimUpdate(input: {
  status?: unknown;
  reply?: unknown;
}): ClaimUpdateInput | 'INVALID_CLAIM' {
  const hasStatus = input.status !== undefined;
  const hasReply = input.reply !== undefined;
  if (!hasStatus && !hasReply) return 'INVALID_CLAIM';

  const update: ClaimUpdateInput = {};
  if (hasStatus) {
    if (
      typeof input.status !== 'string' ||
      !CLAIM_STATUSES.includes(input.status as ClaimStatusName)
    ) {
      return 'INVALID_CLAIM';
    }
    update.status = input.status as ClaimStatusName;
  }
  if (hasReply) {
    const reply = optionalReply(input.reply);
    if (reply === 'INVALID_CLAIM') return 'INVALID_CLAIM';
    update.reply = reply;
  }
  return update;
}
