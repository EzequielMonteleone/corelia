import {prisma} from '../prismaClient.js';

const DEFAULT_AMENITIES = [
  {key: 'POOL', name: 'Pileta'},
  {key: 'SUM', name: 'SUM / Zoom'},
  {key: 'GYM', name: 'Gimnasio'},
  {key: 'LAUNDRY', name: 'Laundry'},
  {key: 'BBQ', name: 'Parrilla'},
] as const;

async function ensureDefaultAmenities() {
  await Promise.all(
    DEFAULT_AMENITIES.map(item =>
      prisma.amenity.upsert({
        where: {key: item.key},
        update: {name: item.name, isSystem: true},
        create: {key: item.key, name: item.name, isSystem: true},
      }),
    ),
  );
}

export async function getAmenityCatalog() {
  await ensureDefaultAmenities();
  return prisma.amenity.findMany({
    orderBy: [{isSystem: 'desc'}, {name: 'asc'}],
  });
}

export async function getBuildingAmenities(buildingId: string) {
  await ensureDefaultAmenities();
  return prisma.buildingAmenity.findMany({
    where: {buildingId},
    include: {amenity: true},
    orderBy: [{isEnabled: 'desc'}, {createdAt: 'asc'}],
  });
}

export async function createBuildingAmenity(data: {
  buildingId: string;
  amenityId?: string;
  customAmenityName?: string;
}) {
  let amenityId = data.amenityId;

  if (!amenityId) {
    const customName = data.customAmenityName?.trim();
    if (!customName) {
      throw new Error('AMENITY_OR_NAME_REQUIRED');
    }

    const amenity = await prisma.amenity.create({
      data: {
        name: customName,
        isSystem: false,
      },
    });
    amenityId = amenity.id;
  }

  return prisma.buildingAmenity.upsert({
    where: {
      buildingId_amenityId: {
        buildingId: data.buildingId,
        amenityId,
      },
    },
    update: {
      isEnabled: true,
    },
    create: {
      buildingId: data.buildingId,
      amenityId,
      isEnabled: true,
    },
    include: {
      amenity: true,
    },
  });
}

export async function updateBuildingAmenity(
  id: string,
  data: {
    isEnabled?: boolean;
    customName?: string;
  },
) {
  const updateData: {isEnabled?: boolean} = {};
  if (typeof data.isEnabled !== 'undefined') {
    updateData.isEnabled = data.isEnabled;
  }

  const updated = await prisma.buildingAmenity.update({
    where: {id},
    data: updateData,
    include: {
      amenity: true,
    },
  });

  if (!updated.amenity.isSystem && data.customName?.trim()) {
    await prisma.amenity.update({
      where: {id: updated.amenity.id},
      data: {name: data.customName.trim()},
    });
  }

  return prisma.buildingAmenity.findUnique({
    where: {id},
    include: {amenity: true},
  });
}

export async function deleteBuildingAmenity(id: string) {
  return prisma.buildingAmenity.delete({
    where: {id},
  });
}
