import {prisma} from '../prismaClient.js';
import bcrypt from 'bcrypt';
import {GlobalRole, UnitRelationType} from '@prisma/client';
import {MIN_PASSWORD_LENGTH, relationForRole} from '../lib/userAccess.js';

function assertPassword(passwordPlain: string) {
  if (passwordPlain.length < MIN_PASSWORD_LENGTH) {
    throw new Error('PASSWORD_TOO_SHORT');
  }
}

export function toPublicUser<T extends {passwordHash?: string}>(user: T) {
  const {passwordHash: _passwordHash, ...publicUser} = user;
  return publicUser;
}

export async function passwordMatches(passwordHash: string, plain: string) {
  return bcrypt.compare(plain, passwordHash);
}

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
  return prisma.user.findFirst({
    where: {email, deleted: false},
    include: userInclude,
  });
}

export async function findUserById(id: string) {
  return prisma.user.findFirst({
    where: {id, deleted: false},
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
  assertPassword(data.passwordPlain);
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
  assertPassword(data.passwordPlain);
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
    where: {deleted: false},
    include: userInclude,
  });
}

export async function getUsersByBuildings(buildingIds: string[]) {
  return prisma.user.findMany({
    where: {
      deleted: false,
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

export async function updateUser(
  id: string,
  data: {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string | null;
    isActive?: boolean;
    passwordPlain?: string;
  },
) {
  const updateData: {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string | null;
    isActive?: boolean;
    passwordHash?: string;
  } = {};
  if (data.email !== undefined) updateData.email = data.email;
  if (data.firstName !== undefined) updateData.firstName = data.firstName;
  if (data.lastName !== undefined) updateData.lastName = data.lastName;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.passwordPlain) {
    assertPassword(data.passwordPlain);
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

  const relation = relationForRole(roleName);
  const unitRelationType = relation ? UnitRelationType[relation] : undefined;

  await prisma.$transaction(async tx => {
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
  return prisma.user.update({
    where: {id},
    data: {deleted: true},
  });
}
