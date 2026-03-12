import {prisma} from '../prismaClient.js';
import bcrypt from 'bcrypt';
import {GlobalRole, UnitRelationType} from '@prisma/client';

const userInclude = {
  buildingUsers: {
    include: {role: true, building: true},
  },
  userUnits: {
    include: {
      unit: true,
    },
  },
};

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: {email},
    include: userInclude,
  });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: {id},
    include: userInclude,
  });
}

export async function createUserWithRole(
  data: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    passwordPlain: string;
  },
  buildingId: string,
  roleId: string,
  unitIds?: string[],
  unitRelationType?: UnitRelationType,
) {
  const passwordHash = await bcrypt.hash(data.passwordPlain, 10);

  return prisma.$transaction(async tx => {
    const user = await tx.user.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone ?? null,
        passwordHash,
      },
    });

    const buildingUser = await tx.buildingUser.create({
      data: {
        userId: user.id,
        buildingId,
        roleId,
      },
      include: {
        role: true,
      },
    });

    if (unitIds?.length && unitRelationType) {
      await tx.userUnit.createMany({
        data: unitIds.map(unitId => ({
          userId: user.id,
          unitId,
          relationType: unitRelationType,
        })),
      });
    }

    return {user, buildingUser};
  });
}

export async function createGlobalUser(data: {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  passwordPlain: string;
  globalRole: GlobalRole;
}) {
  const passwordHash = await bcrypt.hash(data.passwordPlain, 10);
  return prisma.user.create({
    data: {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone ?? null,
      passwordHash,
      globalRole: data.globalRole,
    },
    include: userInclude,
  });
}
export async function getAllUsers() {
  return prisma.user.findMany({
    include: userInclude,
  });
}

export async function getUsersByBuildings(buildingIds: string[]) {
  return prisma.user.findMany({
    where: {
      buildingUsers: {
        some: {
          buildingId: {
            in: buildingIds,
          },
        },
      },
    },
    include: userInclude,
  });
}

/** Users with role Roomer in the given buildings (for Owner visibility). */
export async function getRoomersByBuildings(buildingIds: string[]) {
  return prisma.user.findMany({
    where: {
      buildingUsers: {
        some: {
          buildingId: {in: buildingIds},
          role: {name: 'Roomer'},
        },
      },
    },
    include: userInclude,
  });
}

export async function updateUser(
  id: string,
  data: {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    isActive?: boolean;
    passwordPlain?: string;
  },
) {
  const updateData: any = {...data};
  delete updateData.passwordPlain;

  if (data.passwordPlain) {
    updateData.passwordHash = await bcrypt.hash(data.passwordPlain, 10);
  }

  return prisma.user.update({
    where: {id},
    data: updateData,
    include: userInclude,
  });
}

export async function updateUserBuildingAssignment(
  userId: string,
  buildingId: string,
  roleName: string,
  unitIds: string[],
) {
  const role = await prisma.role.findFirst({
    where: {name: roleName},
  });
  if (!role) {
    throw new Error('INVALID_ROLE_NAME');
  }

  const unitRelationType =
    roleName === 'Owner'
      ? UnitRelationType.OWNER
      : roleName === 'Roomer'
        ? UnitRelationType.ROOMER
        : undefined;

  return prisma.$transaction(async tx => {
    const existing = await tx.buildingUser.findFirst({
      where: {userId, buildingId},
    });

    if (existing) {
      await tx.buildingUser.update({
        where: {id: existing.id},
        data: {roleId: role.id},
      });
    } else {
      await tx.buildingUser.create({
        data: {
          userId,
          buildingId,
          roleId: role.id,
        },
      });
    }

    const unitsInBuilding = await tx.unit.findMany({
      where: {buildingId},
      select: {id: true},
    });
    const unitIdsInBuilding = new Set(unitsInBuilding.map(u => u.id));

    await tx.userUnit.deleteMany({
      where: {
        userId,
        unitId: {in: Array.from(unitIdsInBuilding)},
      },
    });

    if (unitIds.length > 0 && unitRelationType) {
      await tx.userUnit.createMany({
        data: unitIds.map(unitId => ({
          userId,
          unitId,
          relationType: unitRelationType,
        })),
      });
    }
  });

  return findUserById(userId);
}

export async function deleteUser(id: string) {
  // We might want to do a soft delete or just remove associated building relations
  // For now, let's do a complete delete (Prisma will handle relations if set to cascade,
  // but buildingUser usually doesn't cascade delete the User)
  return prisma.user.delete({
    where: {id},
  });
}
