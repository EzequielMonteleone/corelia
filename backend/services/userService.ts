import {prisma} from '../prismaClient.js';
import bcrypt from 'bcrypt';

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: {email},
    include: {
      buildingUsers: {
        include: {role: true},
      },
    },
  });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: {id},
    include: {
      buildingUsers: {
        include: {role: true},
      },
    },
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
) {
  const passwordHash = await bcrypt.hash(data.passwordPlain, 10);

  return prisma.$transaction(async tx => {
    // 1. Crear usuario
    const user = await tx.user.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone ?? null,
        passwordHash,
      },
    });

    // 2. Asociarle el rol en el edificio
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

    return {user, buildingUser};
  });
}
export async function getAllUsers() {
  return prisma.user.findMany({
    include: {
      buildingUsers: {
        include: {
          building: true,
          role: true,
        },
      },
    },
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
    include: {
      buildingUsers: {
        include: {
          building: true,
          role: true,
        },
      },
    },
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
    include: {
      buildingUsers: {
        include: {
          building: true,
          role: true,
        },
      },
    },
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
  });
}

export async function deleteUser(id: string) {
  // We might want to do a soft delete or just remove associated building relations
  // For now, let's do a complete delete (Prisma will handle relations if set to cascade,
  // but buildingUser usually doesn't cascade delete the User)
  return prisma.user.delete({
    where: {id},
  });
}
