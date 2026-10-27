export const HOUSEHOLD_RELATIONS = ['SPOUSE', 'CHILD', 'PARENT', 'OTHER'] as const;
export const PET_SPECIES = ['DOG', 'CAT', 'OTHER'] as const;

export type HouseholdRelation = (typeof HOUSEHOLD_RELATIONS)[number];
export type PetSpecies = (typeof PET_SPECIES)[number];

const MAX_NAME = 80;
const MAX_DOCUMENT = 32;
const MAX_PHONE = 32;
const MAX_PLATE = 12;
const MAX_VEHICLE_LABEL = 40;
const MAX_NOTES = 300;

export type HouseholdViewer = {
  globalRole: 'SUPERADMIN' | 'USER';
  buildingUsers: {buildingId: string; role: {name: string}}[];
  userUnits: {
    unitId: string;
    relationType: 'OWNER' | 'ROOMER';
    unit: {buildingId: string};
  }[];
};

export type UnitAccess = 'OK' | 'INSUFFICIENT_PERMISSIONS' | 'UNIT_NOT_LINKED';

export type MemberDraft = {
  firstName: string;
  lastName: string;
  relation: HouseholdRelation;
  documentNumber: string | null;
  phone: string | null;
};

export type VehicleDraft = {
  plate: string;
  make: string | null;
  model: string | null;
  color: string | null;
};

export type PetDraft = {
  name: string;
  species: PetSpecies;
  notes: string | null;
};

type OptionalString = string | null | 'INVALID_HOUSEHOLD';

function requiredName(value: unknown): string | 'INVALID_HOUSEHOLD' {
  if (typeof value !== 'string') return 'INVALID_HOUSEHOLD';
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_NAME) return 'INVALID_HOUSEHOLD';
  return trimmed;
}

function optionalText(value: unknown, max: number): OptionalString {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') return 'INVALID_HOUSEHOLD';
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > max) return 'INVALID_HOUSEHOLD';
  return trimmed;
}

/** Uppercase plate without spaces or hyphens, or null when it cannot be stored. */
export function normalizePlate(plate: string): string | null {
  const compact = plate.trim().replace(/[\s-]+/g, '').toUpperCase();
  if (!compact || compact.length > MAX_PLATE) return null;
  if (!/^[A-Z0-9]+$/.test(compact)) return null;
  return compact;
}

export function unitAccess(
  viewer: HouseholdViewer,
  unit: {id: string; buildingId: string},
): UnitAccess {
  if (viewer.globalRole === 'SUPERADMIN') return 'OK';

  const roleName = viewer.buildingUsers.find(
    membership => membership.buildingId === unit.buildingId,
  )?.role.name;

  if (roleName === 'Admin') return 'OK';
  if (roleName !== 'Owner' && roleName !== 'Roomer') {
    return 'INSUFFICIENT_PERMISSIONS';
  }

  const relation = roleName === 'Roomer' ? 'ROOMER' : 'OWNER';
  const linked = viewer.userUnits.some(
    link =>
      link.unitId === unit.id &&
      link.relationType === relation &&
      link.unit.buildingId === unit.buildingId,
  );
  return linked ? 'OK' : 'UNIT_NOT_LINKED';
}

export function parseHouseholdMember(input: {
  firstName?: unknown;
  lastName?: unknown;
  relation?: unknown;
  documentNumber?: unknown;
  phone?: unknown;
}): MemberDraft | 'INVALID_HOUSEHOLD' {
  const firstName = requiredName(input.firstName);
  const lastName = requiredName(input.lastName);
  if (firstName === 'INVALID_HOUSEHOLD' || lastName === 'INVALID_HOUSEHOLD') {
    return 'INVALID_HOUSEHOLD';
  }
  if (
    typeof input.relation !== 'string' ||
    !HOUSEHOLD_RELATIONS.includes(input.relation as HouseholdRelation)
  ) {
    return 'INVALID_HOUSEHOLD';
  }
  const documentNumber = optionalText(input.documentNumber, MAX_DOCUMENT);
  const phone = optionalText(input.phone, MAX_PHONE);
  if (documentNumber === 'INVALID_HOUSEHOLD' || phone === 'INVALID_HOUSEHOLD') {
    return 'INVALID_HOUSEHOLD';
  }
  return {
    firstName,
    lastName,
    relation: input.relation as HouseholdRelation,
    documentNumber,
    phone,
  };
}

export function parseVehicle(input: {
  plate?: unknown;
  make?: unknown;
  model?: unknown;
  color?: unknown;
}): VehicleDraft | 'INVALID_HOUSEHOLD' {
  if (typeof input.plate !== 'string') return 'INVALID_HOUSEHOLD';
  const plate = normalizePlate(input.plate);
  if (!plate) return 'INVALID_HOUSEHOLD';
  const make = optionalText(input.make, MAX_VEHICLE_LABEL);
  const model = optionalText(input.model, MAX_VEHICLE_LABEL);
  const color = optionalText(input.color, MAX_VEHICLE_LABEL);
  if (
    make === 'INVALID_HOUSEHOLD' ||
    model === 'INVALID_HOUSEHOLD' ||
    color === 'INVALID_HOUSEHOLD'
  ) {
    return 'INVALID_HOUSEHOLD';
  }
  return {plate, make, model, color};
}

export function parsePet(input: {
  name?: unknown;
  species?: unknown;
  notes?: unknown;
}): PetDraft | 'INVALID_HOUSEHOLD' {
  const name = requiredName(input.name);
  if (name === 'INVALID_HOUSEHOLD') return 'INVALID_HOUSEHOLD';
  if (
    typeof input.species !== 'string' ||
    !PET_SPECIES.includes(input.species as PetSpecies)
  ) {
    return 'INVALID_HOUSEHOLD';
  }
  const notes = optionalText(input.notes, MAX_NOTES);
  if (notes === 'INVALID_HOUSEHOLD') return 'INVALID_HOUSEHOLD';
  return {name, species: input.species as PetSpecies, notes};
}
