import bcrypt from 'bcrypt';
import {
  AmenityReservationStatus,
  ClaimStatus,
  ExpensePeriodStatus,
  ExpenseStatus,
  GlobalRole,
  PaymentStatus,
  UnitRelationType,
} from '@prisma/client';
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
  {key: 'AMENITY_READ', name: 'Ver amenities'},
  {key: 'AMENITY_RESERVE', name: 'Reservar amenities'},
  {key: 'AMENITY_MANAGE', name: 'Configurar amenities'},
];

const rolePermissionMap: Record<string, string[]> = {
  Admin: permissionsData.map(p => p.key),
  Owner: [
    'UNIT_READ',
    'EXPENSE_READ',
    'PAYMENT_CREATE',
    'PAYMENT_READ',
    'AMENITY_READ',
    'AMENITY_RESERVE',
  ],
  Roomer: [
    'EXPENSE_READ',
    'PAYMENT_CREATE',
    'PAYMENT_READ',
    'AMENITY_READ',
    'AMENITY_RESERVE',
  ],
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

const DEMO_BUILDING_NAME = 'Torre Palermo';
const DEMO_PASSWORD = 'Demo123!';
const SUPERADMIN_EMAIL = 'superadmin@corelia.local';
const SUPERADMIN_PASSWORD = 'Admin123!';
const DEMO_EXPENSE_TOTAL = 2_000_000;

const DEMO_AMENITIES = [
  {key: 'POOL', name: 'Pileta'},
  {key: 'SUM', name: 'SUM / Zoom'},
  {key: 'GYM', name: 'Gimnasio'},
  {key: 'LAUNDRY', name: 'Laundry'},
  {key: 'BBQ', name: 'Parrilla'},
] as const;

const DEMO_UNITS = [
  {name: 'PB', floor: 'PB', coefficient: 0.08},
  {name: '1A', floor: '1', coefficient: 0.1},
  {name: '1B', floor: '1', coefficient: 0.1},
  {name: '2A', floor: '2', coefficient: 0.12},
  {name: '2B', floor: '2', coefficient: 0.12},
  {name: '3A', floor: '3', coefficient: 0.14},
  {name: '3B', floor: '3', coefficient: 0.16},
  {name: '4B', floor: '4', coefficient: 0.18},
] as const;

type DemoUnitName = (typeof DEMO_UNITS)[number]['name'];

const CLOSED_EXPENSE_STATUS: Record<DemoUnitName, ExpenseStatus> = {
  PB: ExpenseStatus.PAID,
  '1A': ExpenseStatus.PAID,
  '1B': ExpenseStatus.PAID,
  '2A': ExpenseStatus.PAID,
  '2B': ExpenseStatus.PAID,
  '3A': ExpenseStatus.UNPAID,
  '3B': ExpenseStatus.PAID,
  '4B': ExpenseStatus.PAID,
};

const OPEN_EXPENSE_STATUS: Record<DemoUnitName, ExpenseStatus> = {
  PB: ExpenseStatus.UNPAID,
  '1A': ExpenseStatus.PAID,
  '1B': ExpenseStatus.PENDING,
  '2A': ExpenseStatus.UNPAID,
  '2B': ExpenseStatus.PAID,
  '3A': ExpenseStatus.PENDING,
  '3B': ExpenseStatus.UNPAID,
  '4B': ExpenseStatus.PAID,
};

const DEMO_PEOPLE: {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  roleName: 'Admin' | 'Owner' | 'Roomer';
  unitName?: DemoUnitName;
  relationType?: UnitRelationType;
}[] = [
  {
    email: 'admin@torre-palermo.local',
    firstName: 'Ana',
    lastName: 'Beltrán',
    phone: '+54 11 5555-0101',
    roleName: 'Admin',
  },
  {
    email: 'lucia.fernandez@torre-palermo.local',
    firstName: 'Lucía',
    lastName: 'Fernández',
    phone: '+54 11 5555-0102',
    roleName: 'Owner',
    unitName: '1A',
    relationType: UnitRelationType.OWNER,
  },
  {
    email: 'martin.gomez@torre-palermo.local',
    firstName: 'Martín',
    lastName: 'Gómez',
    phone: '+54 11 5555-0103',
    roleName: 'Owner',
    unitName: '2A',
    relationType: UnitRelationType.OWNER,
  },
  {
    email: 'sofia.rios@torre-palermo.local',
    firstName: 'Sofía',
    lastName: 'Ríos',
    phone: '+54 11 5555-0104',
    roleName: 'Owner',
    unitName: '3B',
    relationType: UnitRelationType.OWNER,
  },
  {
    email: 'diego.acosta@torre-palermo.local',
    firstName: 'Diego',
    lastName: 'Acosta',
    phone: '+54 11 5555-0105',
    roleName: 'Owner',
    unitName: '4B',
    relationType: UnitRelationType.OWNER,
  },
  {
    email: 'camila.nunez@torre-palermo.local',
    firstName: 'Camila',
    lastName: 'Núñez',
    phone: '+54 11 5555-0106',
    roleName: 'Roomer',
    unitName: '1A',
    relationType: UnitRelationType.ROOMER,
  },
  {
    email: 'julian.perez@torre-palermo.local',
    firstName: 'Julián',
    lastName: 'Pérez',
    phone: '+54 11 5555-0107',
    roleName: 'Roomer',
    unitName: '2B',
    relationType: UnitRelationType.ROOMER,
  },
];

function formatPeriod(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${date.getFullYear()}-${month}`;
}

function printDemoCredentials() {
  console.log('Credenciales de demo:');
  console.log(`  ${SUPERADMIN_EMAIL} / ${SUPERADMIN_PASSWORD} (Superadmin)`);
  for (const person of DEMO_PEOPLE) {
    const unit = person.unitName ? `, ${person.unitName}` : '';
    console.log(
      `  ${person.email} / ${DEMO_PASSWORD} (${person.roleName}${unit})`,
    );
  }
}

/** Edificio, usuarios, amenities y expensas. No pisa datos si Torre Palermo ya existe. */
async function seedDemo() {
  const existingBuilding = await prisma.building.findFirst({
    where: {name: DEMO_BUILDING_NAME},
  });
  if (existingBuilding) {
    console.log(`${DEMO_BUILDING_NAME} ya existe: no se cargan datos de demo.`);
    printDemoCredentials();
    return;
  }

  const [adminRole, ownerRole, roomerRole] = await Promise.all([
    prisma.role.findFirst({where: {name: 'Admin'}}),
    prisma.role.findFirst({where: {name: 'Owner'}}),
    prisma.role.findFirst({where: {name: 'Roomer'}}),
  ]);
  if (!adminRole || !ownerRole || !roomerRole) {
    throw new Error(
      'Faltan roles Admin, Owner o Roomer. El seed de roles tiene que correr antes.',
    );
  }
  const roleByName = {
    Admin: adminRole,
    Owner: ownerRole,
    Roomer: roomerRole,
  };

  const takenEmails = await prisma.user.findMany({
    where: {email: {in: DEMO_PEOPLE.map(person => person.email)}},
    select: {email: true},
  });
  if (takenEmails.length > 0) {
    throw new Error(
      `Hay usuarios de demo sin el edificio ${DEMO_BUILDING_NAME}: ` +
        takenEmails.map(user => user.email).join(', '),
    );
  }

  const [demoHash, superHash] = await Promise.all([
    bcrypt.hash(DEMO_PASSWORD, 10),
    bcrypt.hash(SUPERADMIN_PASSWORD, 10),
  ]);

  const now = new Date();
  const currentPeriodDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousPeriodDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  await prisma.$transaction(
    async tx => {
      const superadmin = await tx.user.findUnique({
        where: {email: SUPERADMIN_EMAIL},
      });
      if (!superadmin) {
        await tx.user.create({
          data: {
            email: SUPERADMIN_EMAIL,
            passwordHash: superHash,
            firstName: 'Super',
            lastName: 'Admin',
            globalRole: GlobalRole.SUPERADMIN,
          },
        });
      }

      const building = await tx.building.create({
        data: {
          name: DEMO_BUILDING_NAME,
          address: 'Av. Santa Fe 3253',
          city: 'Buenos Aires',
          country: 'Argentina',
          taxId: '30-71234567-8',
          planType: 'pro',
        },
      });

      const units = await tx.unit.createManyAndReturn({
        data: DEMO_UNITS.map(unit => ({
          buildingId: building.id,
          name: unit.name,
          floor: unit.floor,
          coefficient: unit.coefficient,
        })),
      });
      const unitByName = new Map(units.map(unit => [unit.name, unit]));

      const userByEmail = new Map<string, {id: string}>();
      for (const person of DEMO_PEOPLE) {
        const user = await tx.user.create({
          data: {
            email: person.email,
            passwordHash: demoHash,
            firstName: person.firstName,
            lastName: person.lastName,
            phone: person.phone,
          },
        });
        userByEmail.set(person.email, user);

        await tx.buildingUser.create({
          data: {
            buildingId: building.id,
            userId: user.id,
            roleId: roleByName[person.roleName].id,
          },
        });

        if (person.unitName && person.relationType) {
          const unit = unitByName.get(person.unitName);
          if (!unit) {
            throw new Error(`Unidad demo no encontrada: ${person.unitName}`);
          }
          await tx.userUnit.create({
            data: {
              userId: user.id,
              unitId: unit.id,
              relationType: person.relationType,
            },
          });
        }
      }

      for (const item of DEMO_AMENITIES) {
        const amenity = await tx.amenity.upsert({
          where: {key: item.key},
          update: {name: item.name, isSystem: true},
          create: {key: item.key, name: item.name, isSystem: true},
        });
        await tx.buildingAmenity.create({
          data: {
            buildingId: building.id,
            amenityId: amenity.id,
            isEnabled: true,
          },
        });
      }

      const buildingAmenities = await tx.buildingAmenity.findMany({
        where: {buildingId: building.id},
        include: {amenity: true},
      });
      const amenityByKey = new Map(
        buildingAmenities.map(row => [row.amenity.key, row]),
      );

      const reservations: {
        key: (typeof DEMO_AMENITIES)[number]['key'];
        email: string;
        unitName: DemoUnitName;
        daysFromNow: number;
        hour: number;
        notes: string | null;
      }[] = [
        {
          key: 'SUM',
          email: 'lucia.fernandez@torre-palermo.local',
          unitName: '1A',
          daysFromNow: 1,
          hour: 19,
          notes: 'Reunión de consorcio',
        },
        {
          key: 'POOL',
          email: 'camila.nunez@torre-palermo.local',
          unitName: '1A',
          daysFromNow: 2,
          hour: 10,
          notes: null,
        },
        {
          key: 'BBQ',
          email: 'diego.acosta@torre-palermo.local',
          unitName: '4B',
          daysFromNow: 3,
          hour: 13,
          notes: 'Asado familiar',
        },
      ];

      for (const reservation of reservations) {
        const buildingAmenity = amenityByKey.get(reservation.key);
        const user = userByEmail.get(reservation.email);
        const unit = unitByName.get(reservation.unitName);
        if (!buildingAmenity || !user || !unit) {
          throw new Error(`Reserva demo incompleta: ${reservation.key}`);
        }
        const startsAt = new Date(now);
        startsAt.setDate(startsAt.getDate() + reservation.daysFromNow);
        startsAt.setHours(reservation.hour, 0, 0, 0);
        const endsAt = new Date(startsAt);
        endsAt.setHours(startsAt.getHours() + 1);
        await tx.amenityReservation.create({
          data: {
            buildingAmenityId: buildingAmenity.id,
            unitId: unit.id,
            userId: user.id,
            startsAt,
            endsAt,
            status: AmenityReservationStatus.CONFIRMED,
            notes: reservation.notes,
          },
        });
      }

      const camila = userByEmail.get('camila.nunez@torre-palermo.local');
      const martin = userByEmail.get('martin.gomez@torre-palermo.local');
      const adminUser = userByEmail.get('admin@torre-palermo.local');
      const unit1A = unitByName.get('1A');
      const unit2A = unitByName.get('2A');
      if (!camila || !martin || !adminUser || !unit1A || !unit2A) {
        throw new Error('Reclamos demo incompletos');
      }
      await tx.claim.create({
        data: {
          buildingId: building.id,
          unitId: unit1A.id,
          authorUserId: camila.id,
          title: 'Pérdida en el baño',
          body: 'Hay una pérdida debajo del lavamanos desde anoche.',
          status: ClaimStatus.OPEN,
        },
      });
      await tx.claim.create({
        data: {
          buildingId: building.id,
          unitId: unit2A.id,
          authorUserId: martin.id,
          title: 'Luz del palier',
          body: 'La luz del palier del segundo piso no enciende.',
          status: ClaimStatus.IN_PROGRESS,
          reply: 'Ya pedimos el cambio del artefacto. Lo hacen esta semana.',
          repliedAt: now,
          repliedByUserId: adminUser.id,
        },
      });
      const sum = amenityByKey.get('SUM');
      if (!sum) throw new Error('Reclamos demo incompletos');
      await tx.claim.create({
        data: {
          buildingId: building.id,
          buildingAmenityId: sum.id,
          authorUserId: camila.id,
          title: 'Luces del SUM',
          body: 'Dos luces del salón de usos múltiples no encienden.',
          status: ClaimStatus.OPEN,
        },
      });

      const periods: {
        period: string;
        status: ExpensePeriodStatus;
        expenseStatus: Record<DemoUnitName, ExpenseStatus>;
        paidAt: Date;
      }[] = [
        {
          period: formatPeriod(previousPeriodDate),
          status: ExpensePeriodStatus.CLOSED,
          expenseStatus: CLOSED_EXPENSE_STATUS,
          paidAt: new Date(
            previousPeriodDate.getFullYear(),
            previousPeriodDate.getMonth(),
            12,
            15,
            0,
            0,
            0,
          ),
        },
        {
          period: formatPeriod(currentPeriodDate),
          status: ExpensePeriodStatus.OPEN,
          expenseStatus: OPEN_EXPENSE_STATUS,
          paidAt: new Date(
            currentPeriodDate.getFullYear(),
            currentPeriodDate.getMonth(),
            Math.min(now.getDate(), 28),
            11,
            0,
            0,
            0,
          ),
        },
      ];

      for (const period of periods) {
        const expensePeriod = await tx.expensePeriod.create({
          data: {
            buildingId: building.id,
            period: period.period,
            status: period.status,
          },
        });

        for (const unitDef of DEMO_UNITS) {
          const unit = unitByName.get(unitDef.name);
          if (!unit) {
            throw new Error(`Unidad demo no encontrada: ${unitDef.name}`);
          }
          const status = period.expenseStatus[unitDef.name];
          const amount = Math.round(DEMO_EXPENSE_TOTAL * unitDef.coefficient);
          const expense = await tx.expense.create({
            data: {
              buildingId: building.id,
              unitId: unit.id,
              periodId: expensePeriod.id,
              amount,
              status,
            },
          });

          if (status === ExpenseStatus.PAID) {
            await tx.payment.create({
              data: {
                buildingId: building.id,
                expenseId: expense.id,
                amount,
                paymentMethod: 'transferencia',
                status: PaymentStatus.COMPLETED,
                paidAt: period.paidAt,
              },
            });
          } else if (status === ExpenseStatus.PENDING) {
            await tx.payment.create({
              data: {
                buildingId: building.id,
                expenseId: expense.id,
                amount,
                paymentMethod: 'mercadopago',
                status: PaymentStatus.PENDING,
              },
            });
          }
        }
      }
    },
    {timeout: 30_000},
  );

  console.log(`Demo cargada: ${DEMO_BUILDING_NAME}.`);
  printDemoCredentials();
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

  await seedDemo();
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
