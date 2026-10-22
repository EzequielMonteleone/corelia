import {prisma} from '../prismaClient.js';
import {parseHm} from '../lib/zonedTime.js';

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

function assertBookingRules(input: {
  slotMinutes: number;
  maxConcurrent: number;
  openTime: string;
  closeTime: string;
}) {
  if (
    !Number.isInteger(input.slotMinutes) ||
    input.slotMinutes < 15 ||
    input.slotMinutes > 480
  ) {
    throw new Error('INVALID_SLOT_MINUTES');
  }
  if (
    !Number.isInteger(input.maxConcurrent) ||
    input.maxConcurrent < 1 ||
    input.maxConcurrent > 50
  ) {
    throw new Error('INVALID_MAX_CONCURRENT');
  }
  const open = parseHm(input.openTime);
  const close = parseHm(input.closeTime);
  if (open === null) throw new Error('INVALID_OPEN_TIME');
  if (close === null) throw new Error('INVALID_CLOSE_TIME');
  if (open >= close || close - open < input.slotMinutes) {
    throw new Error('INVALID_HOURS');
  }
}

export async function updateBuildingAmenity(
  id: string,
  data: {
    isEnabled?: boolean;
    customName?: string;
    slotMinutes?: number;
    maxConcurrent?: number;
    openTime?: string;
    closeTime?: string;
    rules?: string | null;
  },
) {
  const current = await prisma.buildingAmenity.findUnique({where: {id}});
  if (!current) throw new Error('BUILDING_AMENITY_NOT_FOUND');

  const nextRules = {
    slotMinutes: data.slotMinutes ?? current.slotMinutes,
    maxConcurrent: data.maxConcurrent ?? current.maxConcurrent,
    openTime: data.openTime ?? current.openTime,
    closeTime: data.closeTime ?? current.closeTime,
  };
  if (
    data.slotMinutes !== undefined ||
    data.maxConcurrent !== undefined ||
    data.openTime !== undefined ||
    data.closeTime !== undefined
  ) {
    assertBookingRules(nextRules);
  }

  const updateData: {
    isEnabled?: boolean;
    slotMinutes?: number;
    maxConcurrent?: number;
    openTime?: string;
    closeTime?: string;
    rules?: string | null;
  } = {};
  if (typeof data.isEnabled !== 'undefined') updateData.isEnabled = data.isEnabled;
  if (typeof data.slotMinutes !== 'undefined') updateData.slotMinutes = data.slotMinutes;
  if (typeof data.maxConcurrent !== 'undefined') {
    updateData.maxConcurrent = data.maxConcurrent;
  }
  if (typeof data.openTime !== 'undefined') updateData.openTime = data.openTime;
  if (typeof data.closeTime !== 'undefined') updateData.closeTime = data.closeTime;
  if (typeof data.rules !== 'undefined') {
    const trimmed = data.rules?.trim() ?? '';
    if (trimmed.length > 1000) throw new Error('RULES_TOO_LONG');
    updateData.rules = trimmed || null;
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
