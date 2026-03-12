import {prisma} from '../prismaClient.js';

export async function getUnitsByBuildingId(buildingId: string) {
  return prisma.unit.findMany({
    where: {buildingId},
    orderBy: [{floor: 'asc'}, {name: 'asc'}],
  });
}

export async function getUnitById(id: string) {
  return prisma.unit.findUnique({
    where: {id},
    include: {
      building: true,
    },
  });
}

export async function createUnit(data: {
  buildingId: string;
  name: string;
  floor?: string;
  coefficient?: number;
}) {
  return prisma.unit.create({
    data: {
      buildingId: data.buildingId,
      name: data.name,
      floor: data.floor ?? null,
      coefficient: data.coefficient ?? null,
    },
  });
}

export async function updateUnit(
  id: string,
  data: {
    name?: string;
    floor?: string;
    coefficient?: number;
  },
) {
  const updateData: {
    name?: string;
    floor?: string | null;
    coefficient?: number | null;
  } = {};

  if (typeof data.name === 'string') {
    updateData.name = data.name;
  }
  if (typeof data.floor !== 'undefined') {
    updateData.floor = data.floor ?? null;
  }
  if (typeof data.coefficient !== 'undefined') {
    updateData.coefficient = data.coefficient ?? null;
  }

  return prisma.unit.update({
    where: {id},
    data: updateData,
  });
}

export async function deleteUnit(id: string) {
  return prisma.unit.delete({
    where: {id},
  });
}
