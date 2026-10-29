export type BuildingRoleName = 'Admin' | 'Owner' | 'Roomer';

export type BuildingAccessLevel = 'admin' | 'member';

export type BuildingMember = {
  globalRole: 'SUPERADMIN' | 'USER';
  buildings: {id: string; role: BuildingRoleName}[];
};

export function asBuildingRole(name: string): BuildingRoleName | null {
  if (name === 'Admin' || name === 'Owner' || name === 'Roomer') return name;
  return null;
}

export function toBuildingMember(user: {
  globalRole: string;
  buildingUsers: {buildingId: string; role: {name: string}}[];
}): BuildingMember {
  return {
    globalRole: user.globalRole === 'SUPERADMIN' ? 'SUPERADMIN' : 'USER',
    buildings: user.buildingUsers.flatMap(membership => {
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
  const membership = actor.buildings.find(building => building.id === buildingId);
  if (!membership) return false;
  if (level === 'member') return true;
  return membership.role === 'Admin';
}
