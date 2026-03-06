import {Prisma} from '@prisma/client';
import {prisma} from '../prismaClient.js';

const roleInclude = {
  rolePermissions: {
    include: {
      permission: true,
    },
  },
};

export async function getAllRoles() {
  return prisma.role.findMany({include: roleInclude});
}

export async function getRoleById(id: string) {
  return prisma.role.findUnique({where: {id}, include: roleInclude});
}

export async function createRole(
  name: string,
  description?: string,
  permissionIds?: string[],
) {
  return prisma.$transaction(async tx => {
    const role = await tx.role.create({
      data: {
        name,
        description: description ?? null,
      },
    });

    if (permissionIds && permissionIds.length > 0) {
      await tx.rolePermission.createMany({
        data: permissionIds.map(permissionId => ({
          roleId: role.id,
          permissionId,
        })),
      });
    }

    return role;
  });
}

export async function updateRole(
  id: string,
  name?: string,
  description?: string,
  permissionIds?: string[],
) {
  return prisma.$transaction(async tx => {
    const data: Prisma.RoleUpdateInput = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description ?? null;

    const role = await tx.role.update({
      where: {id},
      data,
    });

    if (permissionIds) {
      await tx.rolePermission.deleteMany({
        where: {roleId: id},
      });

      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map(permissionId => ({
            roleId: id,
            permissionId,
          })),
        });
      }
    }

    return role;
  });
}

export async function deleteRole(id: string) {
  return prisma.role.delete({
    where: {id},
  });
}

export async function getAllPermissions() {
  return prisma.permission.findMany();
}

export async function createPermission(key: string, name: string) {
  return prisma.permission.create({
    data: {key, name},
  });
}
