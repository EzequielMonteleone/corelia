import {asBuildingRole} from './buildingAccess.js';
import type {
  BuildingMember,
  BuildingRoleName,
  GlobalRoleName,
  LinkedUnit,
  UnitRelationName,
} from '../types/member.js';

export const MIN_PASSWORD_LENGTH = 8;

export type {BuildingRoleName} from '../types/member.js';
export {asBuildingRole} from './buildingAccess.js';

export type AccessPerson = {
  id: string;
  globalRole: GlobalRoleName;
  buildings: BuildingMember['buildings'];
  units: LinkedUnit[];
  ownedUnitIds: string[];
};

export type UserEditBody = {
  email?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  phone?: unknown;
  password?: unknown;
  currentPassword?: unknown;
  isActive?: unknown;
  buildingId?: unknown;
  roleName?: unknown;
  unitIds?: unknown;
};

export type UserProfileUpdate = {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  passwordPlain?: string;
  isActive?: boolean;
};

export type UserAssignmentUpdate = {
  buildingId: string;
  roleName: BuildingRoleName;
  unitIds: string[];
};

export type UserEditError =
  | 'INSUFFICIENT_PERMISSIONS'
  | 'CURRENT_PASSWORD_REQUIRED'
  | 'PASSWORD_TOO_SHORT'
  | 'INVALID_ROLE_NAME'
  | 'INVALID_PAYLOAD';

export type UserEditDecision =
  | {ok: false; error: UserEditError; status: number}
  | {
      ok: true;
      profile: UserProfileUpdate;
      assignment?: UserAssignmentUpdate;
      currentPassword?: string;
    };

const ROLE_RANK: Record<BuildingRoleName, number> = {
  Admin: 3,
  Owner: 2,
  Roomer: 1,
};

function deny(error: UserEditError, status: number): UserEditDecision {
  return {ok: false, error, status};
}

function unitsInBuilding(person: AccessPerson, buildingId: string): string[] {
  return person.units
    .filter(unit => unit.buildingId === buildingId)
    .map(unit => unit.id);
}

function sameIds(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  const a = [...left].sort();
  const b = [...right].sort();
  return a.every((id, index) => id === b[index]);
}

/** Someone else, strictly below you. Superadmin can manage every account. */
export function canManageUser(
  actor: AccessPerson,
  target: AccessPerson,
  buildingId: string,
): boolean {
  if (actor.id === target.id) return false;
  if (target.globalRole === 'SUPERADMIN' && actor.globalRole !== 'SUPERADMIN') {
    return false;
  }
  if (actor.globalRole === 'SUPERADMIN') return true;

  const actorMembership = actor.buildings.find(
    building => building.id === buildingId,
  );
  const targetMembership = target.buildings.find(
    building => building.id === buildingId,
  );
  if (!actorMembership || !targetMembership) return false;
  if (ROLE_RANK[actorMembership.role] <= ROLE_RANK[targetMembership.role]) {
    return false;
  }

  if (actorMembership.role === 'Owner') {
    const targetUnits = unitsInBuilding(target, buildingId);
    return targetUnits.some(unitId => actor.ownedUnitIds.includes(unitId));
  }

  return true;
}

/** Own profile, or someone canManageUser allows in a shared building. */
export function canEditUser(
  actor: AccessPerson,
  target: AccessPerson,
): boolean {
  if (actor.id === target.id) return true;

  const buildingIds = [
    ...new Set([
      ...actor.buildings.map(building => building.id),
      ...target.buildings.map(building => building.id),
    ]),
  ];
  if (buildingIds.length === 0) return canManageUser(actor, target, '');

  return buildingIds.some(buildingId =>
    canManageUser(actor, target, buildingId),
  );
}

export type UnitSelection = 'none' | 'one' | 'many';

export type UnitAssignmentError =
  | 'ADMIN_CANNOT_HAVE_UNITS'
  | 'OWNER_UNITS_REQUIRED'
  | 'ROOMER_SINGLE_UNIT_REQUIRED'
  | 'OWNER_CAN_ASSIGN_ONLY_OWN_UNITS'
  | 'INVALID_ROLE_NAME';

/** Superadmin creates Admin, Admin creates Owner, Owner creates Roomer. */
export function canCreateRole(
  creatorGlobalRole: string,
  creatorBuildingRoleName: string | null,
  targetRoleName: string,
): boolean {
  if (creatorGlobalRole === 'SUPERADMIN') return targetRoleName === 'Admin';
  if (creatorBuildingRoleName === 'Admin') return targetRoleName === 'Owner';
  if (creatorBuildingRoleName === 'Owner') return targetRoleName === 'Roomer';
  return false;
}

export function unitSelectionForRole(roleName: string): UnitSelection | null {
  if (roleName === 'Admin') return 'none';
  if (roleName === 'Owner') return 'many';
  if (roleName === 'Roomer') return 'one';
  return null;
}

export function roleCatalog(): {
  name: BuildingRoleName;
  unitSelection: UnitSelection;
  relation: UnitRelationName | null;
}[] {
  const names: BuildingRoleName[] = ['Admin', 'Owner', 'Roomer'];
  return names.flatMap(name => {
    const unitSelection = unitSelectionForRole(name);
    if (!unitSelection) return [];
    return [{name, unitSelection, relation: relationForRole(name)}];
  });
}

export function assignableRoles(input: {
  globalRole: string;
  buildingRole: string | null;
}): {
  name: BuildingRoleName;
  unitSelection: UnitSelection;
  relation: UnitRelationName | null;
}[] {
  const names: BuildingRoleName[] = ['Admin', 'Owner', 'Roomer'];
  return names.flatMap(name => {
    if (!canCreateRole(input.globalRole, input.buildingRole, name)) return [];
    const unitSelection = unitSelectionForRole(name);
    if (!unitSelection) return [];
    return [{name, unitSelection, relation: relationForRole(name)}];
  });
}

export function relationForRole(roleName: string): UnitRelationName | null {
  if (roleName === 'Owner') return 'OWNER';
  if (roleName === 'Roomer') return 'ROOMER';
  return null;
}

export function canDeleteUser(actor: {globalRole: string}): boolean {
  return actor.globalRole === 'SUPERADMIN';
}

export type VisibleUserScope =
  | {kind: 'admin-buildings'; buildingIds: string[]}
  | {kind: 'all'}
  | {kind: 'none'};

/**
 * Users this person can list. A superadmin sees every account.
 * An admin sees the users of the buildings they administer.
 */
export function visibleUserScope(actor: BuildingMember): VisibleUserScope {
  if (actor.globalRole === 'SUPERADMIN') return {kind: 'all'};
  const adminIds = actor.buildings
    .filter(building => building.role === 'Admin')
    .map(building => building.id);
  if (adminIds.length > 0) {
    return {kind: 'admin-buildings', buildingIds: adminIds};
  }
  return {kind: 'none'};
}

/** Cardinality and owner-owned units. Building membership of the ids stays in the route. */
export function validateUnitAssignment(input: {
  roleName: string;
  unitIds: string[];
  actorIsOwner: boolean;
  ownedUnitIds: string[];
}): UnitAssignmentError | null {
  const selection = unitSelectionForRole(input.roleName);
  if (!selection) return 'INVALID_ROLE_NAME';
  if (selection === 'none' && input.unitIds.length > 0) {
    return 'ADMIN_CANNOT_HAVE_UNITS';
  }
  if (selection === 'many' && input.unitIds.length === 0) {
    return 'OWNER_UNITS_REQUIRED';
  }
  if (selection === 'one' && input.unitIds.length !== 1) {
    return 'ROOMER_SINGLE_UNIT_REQUIRED';
  }
  if (
    input.actorIsOwner &&
    input.unitIds.some(unitId => !input.ownedUnitIds.includes(unitId))
  ) {
    return 'OWNER_CAN_ASSIGN_ONLY_OWN_UNITS';
  }
  return null;
}

function canChangeRole(
  actor: AccessPerson,
  buildingId: string,
  currentRole: BuildingRoleName,
  nextRole: BuildingRoleName,
): boolean {
  const actorBuildingRole =
    actor.globalRole === 'SUPERADMIN'
      ? null
      : (actor.buildings.find(building => building.id === buildingId)?.role ??
        null);

  return (
    canCreateRole(actor.globalRole, actorBuildingRole, nextRole) &&
    canCreateRole(actor.globalRole, actorBuildingRole, currentRole)
  );
}

function readString(value: unknown): string | undefined | 'INVALID_PAYLOAD' {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') return 'INVALID_PAYLOAD';
  return value;
}

export function decideUserEdit(
  actor: AccessPerson,
  target: AccessPerson,
  body: UserEditBody,
): UserEditDecision {
  const email = readString(body.email);
  const firstName = readString(body.firstName);
  const lastName = readString(body.lastName);
  const phone = readString(body.phone);
  if (
    email === 'INVALID_PAYLOAD' ||
    firstName === 'INVALID_PAYLOAD' ||
    lastName === 'INVALID_PAYLOAD' ||
    phone === 'INVALID_PAYLOAD'
  ) {
    return deny('INVALID_PAYLOAD', 400);
  }

  const profile: UserProfileUpdate = {};
  if (email !== undefined) profile.email = email.trim();
  if (firstName !== undefined) profile.firstName = firstName.trim();
  if (lastName !== undefined) profile.lastName = lastName.trim();
  if (phone !== undefined) profile.phone = phone.trim() || null;

  const password =
    typeof body.password === 'string' ? body.password : undefined;
  if (password) {
    if (password.length < MIN_PASSWORD_LENGTH)
      return deny('PASSWORD_TOO_SHORT', 400);
    profile.passwordPlain = password;
  }

  if (actor.id === target.id) {
    if (profile.passwordPlain) {
      if (typeof body.currentPassword !== 'string' || !body.currentPassword) {
        return deny('CURRENT_PASSWORD_REQUIRED', 400);
      }
      return {ok: true, profile, currentPassword: body.currentPassword};
    }
    return {ok: true, profile};
  }

  const buildingId =
    typeof body.buildingId === 'string' && body.buildingId.trim()
      ? body.buildingId.trim()
      : undefined;

  if (actor.globalRole !== 'SUPERADMIN' && !buildingId) {
    return deny('INSUFFICIENT_PERMISSIONS', 403);
  }
  if (buildingId && !canManageUser(actor, target, buildingId)) {
    return deny('INSUFFICIENT_PERMISSIONS', 403);
  }
  if (!buildingId && actor.globalRole === 'SUPERADMIN') {
    if (body.isActive !== undefined) {
      if (typeof body.isActive !== 'boolean')
        return deny('INVALID_PAYLOAD', 400);
      profile.isActive = body.isActive;
    }
    return {ok: true, profile};
  }
  if (!buildingId) return deny('INSUFFICIENT_PERMISSIONS', 403);

  if (body.isActive !== undefined) {
    if (typeof body.isActive !== 'boolean') return deny('INVALID_PAYLOAD', 400);
    profile.isActive = body.isActive;
  }

  const rawRole = typeof body.roleName === 'string' ? body.roleName.trim() : '';
  if (!rawRole || target.globalRole === 'SUPERADMIN') {
    return {ok: true, profile};
  }
  const roleName = asBuildingRole(rawRole);
  if (!roleName) return deny('INVALID_ROLE_NAME', 400);

  const current = target.buildings.find(building => building.id === buildingId);
  const nextUnits = Array.isArray(body.unitIds)
    ? body.unitIds.filter((id): id is string => typeof id === 'string')
    : unitsInBuilding(target, buildingId);

  if (!current) {
    const actorBuildingRole =
      actor.globalRole === 'SUPERADMIN'
        ? null
        : (actor.buildings.find(building => building.id === buildingId)?.role ??
          null);
    if (!canCreateRole(actor.globalRole, actorBuildingRole, roleName)) {
      return deny('INSUFFICIENT_PERMISSIONS', 403);
    }
    return {
      ok: true,
      profile,
      assignment: {buildingId, roleName, unitIds: nextUnits},
    };
  }

  if (
    current.role !== roleName &&
    !canChangeRole(actor, buildingId, current.role, roleName)
  ) {
    return deny('INSUFFICIENT_PERMISSIONS', 403);
  }

  const currentUnits = unitsInBuilding(target, buildingId);
  if (current.role === roleName && sameIds(currentUnits, nextUnits)) {
    return {ok: true, profile};
  }

  return {
    ok: true,
    profile,
    assignment: {buildingId, roleName, unitIds: nextUnits},
  };
}

export type UserAuditAction =
  | 'USER_PASSWORD_CHANGED'
  | 'USER_PASSWORD_RESET'
  | 'USER_ROLE_CHANGED'
  | 'USER_ACTIVE_CHANGED';

export type UserAuditEvent = {
  action: UserAuditAction;
  buildingId: string | null;
  metadata: Record<string, unknown>;
};

type PreviousUserAccess = {
  isActive: boolean;
  buildingId: string | null;
  role: BuildingRoleName | null;
  unitIds: string[];
};

/** Access changes worth an audit row. Name, phone, and email are not included. */
export function userAuditEvents(input: {
  actorId: string;
  targetId: string;
  previous: PreviousUserAccess;
  decision: Extract<UserEditDecision, {ok: true}>;
}): UserAuditEvent[] {
  const {actorId, targetId, previous, decision} = input;
  const events: UserAuditEvent[] = [];
  const buildingId = decision.assignment?.buildingId ?? previous.buildingId;

  if (decision.profile.passwordPlain) {
    events.push({
      action:
        actorId === targetId ? 'USER_PASSWORD_CHANGED' : 'USER_PASSWORD_RESET',
      buildingId,
      metadata: {},
    });
  }

  if (
    decision.profile.isActive !== undefined &&
    decision.profile.isActive !== previous.isActive
  ) {
    events.push({
      action: 'USER_ACTIVE_CHANGED',
      buildingId,
      metadata: {isActive: decision.profile.isActive},
    });
  }

  if (decision.assignment) {
    events.push({
      action: 'USER_ROLE_CHANGED',
      buildingId: decision.assignment.buildingId,
      metadata: {
        previousRole: previous.role,
        nextRole: decision.assignment.roleName,
        previousUnitIds: previous.unitIds,
        unitIds: decision.assignment.unitIds,
      },
    });
  }

  return events;
}
