import {prisma} from '../prismaClient.js';
import {isUsingNeonPoolerInEnv} from '../lib/databaseUrl.js';

const rolesData = [
  {
    name: 'Admin',
    description:
      'El administrador del edificio. Tiene control total sobre el edificio y sus usuarios.',
  },
  {
    name: 'Owner',
    description: 'El propietario de una o varias unidades en el edificio.',
  },
  {
    name: 'Roomer',
    description: 'El inquilino que habita una unidad en el edificio.',
  },
];

const permissionsData = [
  {key: 'BUILDING_UPDATE', name: 'Actualizar información del edificio'},
  {key: 'USER_CREATE', name: 'Crear usuarios en el edificio'},
  {key: 'USER_DELETE', name: 'Eliminar usuarios del edificio'},
  {key: 'USER_READ', name: 'Ver usuarios del edificio'},
  {key: 'UNIT_CREATE', name: 'Crear unidades'},
  {key: 'UNIT_UPDATE', name: 'Actualizar unidades'},
  {key: 'UNIT_DELETE', name: 'Eliminar unidades'},
  {key: 'UNIT_READ', name: 'Ver unidades'},
  {key: 'EXPENSE_CREATE', name: 'Crear expensas'},
  {key: 'EXPENSE_UPDATE', name: 'Actualizar expensas'},
  {key: 'EXPENSE_DELETE', name: 'Eliminar expensas'},
  {key: 'EXPENSE_READ', name: 'Ver expensas'},
  {key: 'PAYMENT_CREATE', name: 'Registrar pagos'},
  {key: 'PAYMENT_UPDATE', name: 'Actualizar pagos'},
  {key: 'PAYMENT_READ', name: 'Ver pagos'},
];

const rolePermissionMap: Record<string, string[]> = {
  Admin: permissionsData.map(p => p.key),
  Owner: ['UNIT_READ', 'EXPENSE_READ', 'PAYMENT_CREATE', 'PAYMENT_READ'],
  Roomer: ['EXPENSE_READ', 'PAYMENT_CREATE', 'PAYMENT_READ'],
};

/** Recrea Role, Permission y RolePermission desde cero. */
async function seedFresh() {
  await prisma.$transaction(async tx => {
    await tx.rolePermission.deleteMany();
    await tx.permission.deleteMany();
    await tx.role.deleteMany();

    await tx.role.createMany({data: rolesData});
    await tx.permission.createMany({data: permissionsData});

    const roles = await tx.role.findMany({
      where: {name: {in: rolesData.map(r => r.name)}},
    });
    const permissions = await tx.permission.findMany();
    const roleByName = new Map(roles.map(r => [r.name, r]));
    const permByKey = new Map(permissions.map(p => [p.key, p]));

    const links: {roleId: string; permissionId: string}[] = [];
    for (const [roleName, keys] of Object.entries(rolePermissionMap)) {
      const role = roleByName.get(roleName);
      if (!role) {
        throw new Error(`Rol no encontrado tras createMany: ${roleName}`);
      }
      for (const key of keys) {
        const perm = permByKey.get(key);
        if (!perm) {
          throw new Error(`Permiso no encontrado tras createMany: ${key}`);
        }
        links.push({roleId: role.id, permissionId: perm.id});
      }
    }

    await tx.rolePermission.createMany({data: links});

    console.log(
      `Seeded fresh: ${rolesData.length} roles, ${permissionsData.length} permissions, ${links.length} RolePermission rows.`,
    );
  });
}

/** Idempotente: no borra datos si ya hay BuildingUser. */
async function seedIncremental() {
  for (const role of rolesData) {
    const existing = await prisma.role.findFirst({where: {name: role.name}});
    if (!existing) {
      await prisma.role.create({data: role});
    }
  }

  const existingRoles = await prisma.role.findMany({
    where: {name: {in: rolesData.map(r => r.name)}},
  });
  const rolesByName = new Map(existingRoles.map(r => [r.name, r]));

  const permissions = await Promise.all(
    permissionsData.map(p =>
      prisma.permission.upsert({
        where: {key: p.key},
        update: {name: p.name},
        create: p,
      }),
    ),
  );
  const permsByKey = new Map(permissions.map(p => [p.key, p]));

  let assignedCount = 0;
  for (const [roleName, keys] of Object.entries(rolePermissionMap)) {
    const role = rolesByName.get(roleName);
    if (!role) continue;
    for (const key of keys) {
      const perm = permsByKey.get(key);
      if (!perm) continue;
      await prisma.rolePermission.upsert({
        where: {roleId_permissionId: {roleId: role.id, permissionId: perm.id}},
        update: {},
        create: {roleId: role.id, permissionId: perm.id},
      });
      assignedCount++;
    }
  }

  console.log(
    `Seeded incremental: ${existingRoles.length} roles, ${permissions.length} permissions, ${assignedCount} role-permission rows.`,
  );
}

async function main() {
  console.log('Start seeding...');
  if (isUsingNeonPoolerInEnv()) {
    console.log(
      '(Neon) URL con pooler en .env: se usa el host directo automáticamente.',
    );
  }

  const [roleCount, permCount, buCount] = await Promise.all([
    prisma.role.count(),
    prisma.permission.count(),
    prisma.buildingUser.count(),
  ]);
  console.log(
    `Estado: Role=${roleCount}, Permission=${permCount}, BuildingUser=${buCount}`,
  );

  if (roleCount === 0 && permCount === 0 && buCount > 0) {
    throw new Error(
      'Inconsistencia: hay BuildingUser pero Role/Permission están vacíos. ' +
        'Revisá FKs o borrá datos de prueba y volvé a correr migrate reset.',
    );
  }

  if (roleCount === 0 && permCount === 0) {
    await seedFresh();
  } else if (buCount === 0) {
    await seedFresh();
  } else {
    console.log(
      'Hay BuildingUser: seed incremental (no se borran roles/permisos existentes).',
    );
    await seedIncremental();
  }

  const [rc, pc, rpc] = await Promise.all([
    prisma.role.count(),
    prisma.permission.count(),
    prisma.rolePermission.count(),
  ]);
  console.log(`Listo: Role=${rc}, Permission=${pc}, RolePermission=${rpc}`);
  console.log('Seeding finished.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
