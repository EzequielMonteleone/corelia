import type {
  BuildingAccessLevel,
  BuildingMember,
  BuildingRoleName,
  ListedBuildings,
  MembershipUser,
} from '../types/member.js';

export function asBuildingRole(name: string): BuildingRoleName | null {
  if (name === 'Admin' || name === 'Owner' || name === 'Roomer') return name;
  return null;
}

export function buildingIsOpen(building: {
  active: boolean;
  deleted: boolean;
}): boolean {
  return building.active && !building.deleted;
}

export function toBuildingMember(user: MembershipUser): BuildingMember {
  return {
    globalRole: user.globalRole === 'SUPERADMIN' ? 'SUPERADMIN' : 'USER',
    buildings: user.buildingUsers.flatMap(membership => {
      if (membership.building && !buildingIsOpen(membership.building))
        return [];
      const role = asBuildingRole(membership.role.name);
      return role ? [{id: membership.buildingId, role}] : [];
    }),
  };
}

/** Superadmin, or a membership at the requested level. Admin implies member. */
export function canAccessBuilding(
  actor: BuildingMember,
  buildingId: string,
  level: BuildingAccessLevel,
): boolean {
  if (actor.globalRole === 'SUPERADMIN') return true;
  const membership = actor.buildings.find(
    building => building.id === buildingId,
  );
  if (!membership) return false;
  if (level === 'member') return true;
  return membership.role === 'Admin';
}

/**
 * Buildings this person sees in the list. A superadmin sees every building,
 * even when they are also an Admin. Otherwise the first role that has
 * memberships wins: Admin, then Owner, then Roomer.
 */
export function listedBuildingIds(actor: BuildingMember): ListedBuildings {
  if (actor.globalRole === 'SUPERADMIN') return {kind: 'all'};
  const idsFor = (role: BuildingRoleName) =>
    actor.buildings
      .filter(building => building.role === role)
      .map(building => building.id);
  const adminIds = idsFor('Admin');
  if (adminIds.length > 0) return {kind: 'ids', ids: adminIds};
  const ownerIds = idsFor('Owner');
  if (ownerIds.length > 0) return {kind: 'ids', ids: ownerIds};
  const roomerIds = idsFor('Roomer');
  if (roomerIds.length > 0) return {kind: 'ids', ids: roomerIds};
  return {kind: 'none'};
}

/** Detail page. A roomer can appear in the list and still be refused here. */
export function canOpenBuilding(
  actor: BuildingMember,
  buildingId: string,
): boolean {
  if (actor.globalRole === 'SUPERADMIN') return true;
  const role = actor.buildings.find(
    building => building.id === buildingId,
  )?.role;
  return role === 'Admin' || role === 'Owner';
}

export function canDeleteBuilding(actor: BuildingMember): boolean {
  return actor.globalRole === 'SUPERADMIN';
}
