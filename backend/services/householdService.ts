import {Prisma} from '@prisma/client';
import {prisma} from '../prismaClient.js';
import {findUserById} from './userService.js';
import {
  parseHouseholdMember,
  parsePet,
  parseVehicle,
  unitAccess,
  type MemberDraft,
  type PetDraft,
} from '../lib/householdRules.js';

export class HouseholdError extends Error {
  status: number;

  constructor(code: string, status = 400) {
    super(code);
    this.status = status;
  }
}

function isPlateTaken(err: unknown) {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
  );
}

async function assertUnitAccess(viewerId: string, unitId: string) {
  const user = await findUserById(viewerId);
  if (!user || !user.isActive) throw new HouseholdError('USER_NOT_FOUND', 404);

  const unit = await prisma.unit.findUnique({
    where: {id: unitId},
    select: {id: true, buildingId: true},
  });
  if (!unit) throw new HouseholdError('UNIT_NOT_FOUND', 404);

  const access = unitAccess(
    {
      globalRole: user.globalRole,
      buildingUsers: user.buildingUsers,
      userUnits: user.userUnits.map(link => ({
        unitId: link.unitId,
        relationType: link.relationType,
        unit: {buildingId: link.unit.buildingId},
      })),
    },
    unit,
  );
  if (access === 'OK') return unit;
  throw new HouseholdError(access, 403);
}

function presentMember(row: {
  id: string;
  unitId: string;
  firstName: string;
  lastName: string;
  relation: MemberDraft['relation'];
  documentNumber: string | null;
  phone: string | null;
}) {
  return {
    id: row.id,
    unitId: row.unitId,
    firstName: row.firstName,
    lastName: row.lastName,
    relation: row.relation,
    documentNumber: row.documentNumber,
    phone: row.phone,
  };
}

function presentVehicle(row: {
  id: string;
  unitId: string;
  plate: string;
  make: string | null;
  model: string | null;
  color: string | null;
}) {
  return {
    id: row.id,
    unitId: row.unitId,
    plate: row.plate,
    make: row.make,
    model: row.model,
    color: row.color,
  };
}

function presentPet(row: {
  id: string;
  unitId: string;
  name: string;
  species: PetDraft['species'];
  notes: string | null;
}) {
  return {
    id: row.id,
    unitId: row.unitId,
    name: row.name,
    species: row.species,
    notes: row.notes,
  };
}

export async function getHousehold(viewerId: string, unitId: string) {
  await assertUnitAccess(viewerId, unitId);
  const [members, vehicles, pets] = await Promise.all([
    prisma.householdMember.findMany({
      where: {unitId},
      orderBy: [{lastName: 'asc'}, {firstName: 'asc'}],
    }),
    prisma.vehicle.findMany({
      where: {unitId},
      orderBy: {plate: 'asc'},
    }),
    prisma.pet.findMany({
      where: {unitId},
      orderBy: {name: 'asc'},
    }),
  ]);
  return {
    members: members.map(presentMember),
    vehicles: vehicles.map(presentVehicle),
    pets: pets.map(presentPet),
  };
}

export async function createMember(
  viewerId: string,
  unitId: string,
  input: Parameters<typeof parseHouseholdMember>[0],
) {
  const draft = parseHouseholdMember(input);
  if (draft === 'INVALID_HOUSEHOLD') throw new HouseholdError('INVALID_HOUSEHOLD');
  await assertUnitAccess(viewerId, unitId);
  const row = await prisma.householdMember.create({
    data: {unitId, ...draft},
  });
  return presentMember(row);
}

export async function updateMember(
  viewerId: string,
  id: string,
  input: Parameters<typeof parseHouseholdMember>[0],
) {
  const draft = parseHouseholdMember(input);
  if (draft === 'INVALID_HOUSEHOLD') throw new HouseholdError('INVALID_HOUSEHOLD');
  const existing = await prisma.householdMember.findUnique({where: {id}});
  if (!existing) throw new HouseholdError('MEMBER_NOT_FOUND', 404);
  await assertUnitAccess(viewerId, existing.unitId);
  const row = await prisma.householdMember.update({
    where: {id},
    data: draft,
  });
  return presentMember(row);
}

export async function deleteMember(viewerId: string, id: string) {
  const existing = await prisma.householdMember.findUnique({where: {id}});
  if (!existing) throw new HouseholdError('MEMBER_NOT_FOUND', 404);
  await assertUnitAccess(viewerId, existing.unitId);
  await prisma.householdMember.delete({where: {id}});
}

export async function createVehicle(
  viewerId: string,
  unitId: string,
  input: Parameters<typeof parseVehicle>[0],
) {
  const draft = parseVehicle(input);
  if (draft === 'INVALID_HOUSEHOLD') throw new HouseholdError('INVALID_HOUSEHOLD');
  const unit = await assertUnitAccess(viewerId, unitId);
  try {
    const row = await prisma.vehicle.create({
      data: {unitId: unit.id, buildingId: unit.buildingId, ...draft},
    });
    return presentVehicle(row);
  } catch (err) {
    if (isPlateTaken(err)) throw new HouseholdError('PLATE_TAKEN', 409);
    throw err;
  }
}

export async function updateVehicle(
  viewerId: string,
  id: string,
  input: Parameters<typeof parseVehicle>[0],
) {
  const draft = parseVehicle(input);
  if (draft === 'INVALID_HOUSEHOLD') throw new HouseholdError('INVALID_HOUSEHOLD');
  const existing = await prisma.vehicle.findUnique({where: {id}});
  if (!existing) throw new HouseholdError('VEHICLE_NOT_FOUND', 404);
  await assertUnitAccess(viewerId, existing.unitId);
  try {
    const row = await prisma.vehicle.update({
      where: {id},
      data: draft,
    });
    return presentVehicle(row);
  } catch (err) {
    if (isPlateTaken(err)) throw new HouseholdError('PLATE_TAKEN', 409);
    throw err;
  }
}

export async function deleteVehicle(viewerId: string, id: string) {
  const existing = await prisma.vehicle.findUnique({where: {id}});
  if (!existing) throw new HouseholdError('VEHICLE_NOT_FOUND', 404);
  await assertUnitAccess(viewerId, existing.unitId);
  await prisma.vehicle.delete({where: {id}});
}

export async function createPet(
  viewerId: string,
  unitId: string,
  input: Parameters<typeof parsePet>[0],
) {
  const draft = parsePet(input);
  if (draft === 'INVALID_HOUSEHOLD') throw new HouseholdError('INVALID_HOUSEHOLD');
  await assertUnitAccess(viewerId, unitId);
  const row = await prisma.pet.create({
    data: {unitId, ...draft},
  });
  return presentPet(row);
}

export async function updatePet(
  viewerId: string,
  id: string,
  input: Parameters<typeof parsePet>[0],
) {
  const draft = parsePet(input);
  if (draft === 'INVALID_HOUSEHOLD') throw new HouseholdError('INVALID_HOUSEHOLD');
  const existing = await prisma.pet.findUnique({where: {id}});
  if (!existing) throw new HouseholdError('PET_NOT_FOUND', 404);
  await assertUnitAccess(viewerId, existing.unitId);
  const row = await prisma.pet.update({
    where: {id},
    data: draft,
  });
  return presentPet(row);
}

export async function deletePet(viewerId: string, id: string) {
  const existing = await prisma.pet.findUnique({where: {id}});
  if (!existing) throw new HouseholdError('PET_NOT_FOUND', 404);
  await assertUnitAccess(viewerId, existing.unitId);
  await prisma.pet.delete({where: {id}});
}
