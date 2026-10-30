import {prisma} from '../prismaClient.js';

export async function getAllBuildings() {
  return await prisma.building.findMany({
    where: {active: true, deleted: false},
    orderBy: {createdAt: 'desc'},
  });
}

export async function getBuildingsByIds(buildingIds: string[]) {
  if (buildingIds.length === 0) return [];
  return await prisma.building.findMany({
    where: {
      id: {in: buildingIds},
      active: true,
      deleted: false,
    },
    orderBy: {createdAt: 'desc'},
  });
}

export async function getBuildingById(id: string) {
  return await prisma.building.findFirst({
    where: {id, deleted: false},
    include: {
      units: {
        orderBy: [{floor: 'asc'}, {name: 'asc'}],
      },
      buildingAmenities: {
        include: {
          amenity: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });
}

export async function createBuilding(data: {
  name: string;
  address: string;
  city: string;
  country: string;
  taxId?: string;
  logo?: string;
  planType?: string;
}) {
  return await prisma.building.create({
    data,
  });
}

const BUILDING_PATCH_FIELDS = [
  'name',
  'address',
  'city',
  'country',
  'taxId',
  'logo',
  'planType',
] as const;

function buildingPatch(input: unknown) {
  const data: {
    name?: string;
    address?: string;
    city?: string;
    country?: string;
    taxId?: string | null;
    logo?: string | null;
    planType?: string | null;
  } = {};
  if (!input || typeof input !== 'object') return data;

  const source = input as Record<string, unknown>;
  for (const key of BUILDING_PATCH_FIELDS) {
    if (!(key in source)) continue;
    const value = source[key];
    if (typeof value === 'string') {
      data[key] = value;
      continue;
    }
    if (
      value === null &&
      (key === 'taxId' || key === 'logo' || key === 'planType')
    ) {
      data[key] = null;
    }
  }
  return data;
}

export async function updateBuilding(id: string, input: unknown) {
  return await prisma.building.update({
    where: {id},
    data: buildingPatch(input),
  });
}

export async function deleteBuilding(id: string) {
  return await prisma.building.update({
    where: {id},
    data: {deleted: true},
  });
}
