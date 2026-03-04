import {prisma} from '../prismaClient.js';
import bcrypt from 'bcrypt';

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: {email},
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
