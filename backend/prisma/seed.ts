import {prisma} from '../prismaClient.js';

async function main() {
  console.log('Start seeding...');

  // 1. Create Roles
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

  const roles = await Promise.all(
    rolesData.map(role =>
      prisma.role.create({
        data: role,
      }),
    ),
  );
  console.log(`Created ${roles.length} roles.`);

  // 2. Create Permissions
  // Aquí puedes agregar los permisos específicos que tu aplicación necesite
  const permissionsData = [
    // Permisos de Edificio
    {key: 'BUILDING_UPDATE', name: 'Actualizar información del edificio'},

    // Permisos de Usuarios
    {key: 'USER_CREATE', name: 'Crear usuarios en el edificio'},
    {key: 'USER_DELETE', name: 'Eliminar usuarios del edificio'},
    {key: 'USER_READ', name: 'Ver usuarios del edificio'},

    // Permisos de Unidades
    {key: 'UNIT_CREATE', name: 'Crear unidades'},
    {key: 'UNIT_UPDATE', name: 'Actualizar unidades'},
    {key: 'UNIT_DELETE', name: 'Eliminar unidades'},
    {key: 'UNIT_READ', name: 'Ver unidades'},

    // Permisos de Gastos/Expensas
    {key: 'EXPENSE_CREATE', name: 'Crear expensas'},
    {key: 'EXPENSE_UPDATE', name: 'Actualizar expensas'},
    {key: 'EXPENSE_DELETE', name: 'Eliminar expensas'},
    {key: 'EXPENSE_READ', name: 'Ver expensas'},

    // Permisos de Pagos
    {key: 'PAYMENT_CREATE', name: 'Registrar pagos'},
    {key: 'PAYMENT_UPDATE', name: 'Actualizar pagos'},
    {key: 'PAYMENT_READ', name: 'Ver pagos'},
  ];

  const permissions = await Promise.all(
    permissionsData.map(permission =>
      prisma.permission.create({
        data: permission,
      }),
    ),
  );
  console.log(`Created ${permissions.length} permissions.`);

  // 3. Assign Permissions to Roles (RolePermissions)

  // Buscar roles creados para referenciarlos
  const adminRole = roles.find(r => r.name === 'Admin');
  const ownerRole = roles.find(r => r.name === 'Owner');
  const roomerRole = roles.find(r => r.name === 'Roomer');

  if (!adminRole || !ownerRole || !roomerRole) {
    throw new Error('Roles no encontrados después de su creación');
  }

  // Admin tiene todos los permisos
  const adminPermissions = permissions.map(p => ({
    roleId: adminRole.id,
    permissionId: p.id,
  }));

  // Owner puede ver unidades, expensas y registrar/ver pagos
  const ownerPermissionKeys = [
    'UNIT_READ',
    'EXPENSE_READ',
    'PAYMENT_CREATE',
    'PAYMENT_READ',
  ];
  const ownerPermissions = permissions
    .filter(p => ownerPermissionKeys.includes(p.key))
    .map(p => ({
      roleId: ownerRole.id,
      permissionId: p.id,
    }));

  // Roomer puede ver expensas y registrar/ver pagos
  const roomerPermissionKeys = [
    'EXPENSE_READ',
    'PAYMENT_CREATE',
    'PAYMENT_READ',
  ];
  const roomerPermissions = permissions
    .filter(p => roomerPermissionKeys.includes(p.key))
    .map(p => ({
      roleId: roomerRole.id,
      permissionId: p.id,
    }));

  // Crear todas las relaciones en RolePermission
  const allRolePermissions = [
    ...adminPermissions,
    ...ownerPermissions,
    ...roomerPermissions,
  ];

  await prisma.rolePermission.createMany({
    data: allRolePermissions,
  });

  console.log(`Assigned ${allRolePermissions.length} permissions to roles.`);

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
