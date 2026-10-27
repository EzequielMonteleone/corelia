export type HouseholdRelation = 'SPOUSE' | 'CHILD' | 'PARENT' | 'OTHER';
export type PetSpecies = 'DOG' | 'CAT' | 'OTHER';

export type HouseholdMember = {
  id: string;
  unitId: string;
  firstName: string;
  lastName: string;
  relation: HouseholdRelation;
  documentNumber: string | null;
  phone: string | null;
};

export type HouseholdMemberInput = {
  firstName: string;
  lastName: string;
  relation: HouseholdRelation;
  documentNumber?: string;
  phone?: string;
};

export type Vehicle = {
  id: string;
  unitId: string;
  plate: string;
  make: string | null;
  model: string | null;
  color: string | null;
};

export type VehicleInput = {
  plate: string;
  make?: string;
  model?: string;
  color?: string;
};

export type Pet = {
  id: string;
  unitId: string;
  name: string;
  species: PetSpecies;
  notes: string | null;
};

export type PetInput = {
  name: string;
  species: PetSpecies;
  notes?: string;
};

export type Household = {
  members: HouseholdMember[];
  vehicles: Vehicle[];
  pets: Pet[];
};

export type HouseholdEditor =
  | {kind: 'member'; record: HouseholdMember | null}
  | {kind: 'vehicle'; record: Vehicle | null}
  | {kind: 'pet'; record: Pet | null};

export type HouseholdDeleteTarget = {
  kind: HouseholdEditor['kind'];
  id: string;
  label: string;
};
