import {prisma} from '../prismaClient.js';

export async function getAllBuildings() {
  return await prisma.building.findMany({
    where: {active: true},
    orderBy: {createdAt: 'desc'},
  });
}

export async function getBuildingsByIds(buildingIds: string[]) {
  if (buildingIds.length === 0) return [];
  return await prisma.building.findMany({
    where: {
      id: {in: buildingIds},
      active: true,
    },
    orderBy: {createdAt: 'desc'},
  });
}

export async function getBuildingById(id: string) {
  return await prisma.building.findUnique({
    where: {id},
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

export async function updateBuilding(
  id: string,
  data: {
    name?: string;
    address?: string;
    city?: string;
    country?: string;
    taxId?: string;
    logo?: string;
    planType?: string;
    active?: boolean;
  },
) {
  return await prisma.building.update({
    where: {id},
    data,
  });
}

export async function deleteBuilding(id: string) {
  return await prisma.building.delete({
    where: {id},
  });
}
