export type GlobalRoleName = 'SUPERADMIN' | 'USER';

export type BuildingRoleName = 'Admin' | 'Owner' | 'Roomer';

export type UnitRelationName = 'OWNER' | 'ROOMER';

export type BuildingAccessLevel = 'admin' | 'member';

/** One membership row as it comes from the user query. */
export type BuildingMembership = {
  buildingId: string;
  role: {name: string};
  building?: {active: boolean; deleted: boolean};
};

/** Loaded user before `toBuildingMember`. Routes pass this through. */
export type MembershipUser = {
  globalRole: string;
  buildingUsers: BuildingMembership[];
};

/** Unit id plus the building it belongs to. */
export type LinkedUnit = {
  id: string;
  buildingId: string;
};

/** Unit link as stored: relation and the unit's building. */
export type UnitLink = {
  unitId: string;
  relationType: UnitRelationName;
  unit: {buildingId: string};
};

export type BuildingMember = {
  globalRole: GlobalRoleName;
  buildings: {id: string; role: BuildingRoleName}[];
};

export type ListedBuildings =
  | {kind: 'all'}
  | {kind: 'ids'; ids: string[]}
  | {kind: 'none'};
