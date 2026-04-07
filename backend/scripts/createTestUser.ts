import 'dotenv/config';
import {prisma} from '../prismaClient.js';
import bcrypt from 'bcrypt';
import {isUsingNeonPoolerInEnv} from '../lib/databaseUrl.js';

if (isUsingNeonPoolerInEnv()) {
  console.log(
    '(Neon) DATABASE_URL usa pooler; Prisma usará el host directo (sin -pooler) automáticamente.',
  );
}

const TEST_USER = {
  email: 'superadmin@corelia.local',
  password: 'Admin123!',
  firstName: 'Super',
  lastName: 'Admin',
  globalRole: 'SUPERADMIN' as const,
};

async function main() {
  const existing = await prisma.user.findUnique({
    where: {email: TEST_USER.email},
  });

  if (existing) {
    console.log(`User ${TEST_USER.email} already exists, skipping.`);
    return;
  }

  const passwordHash = await bcrypt.hash(TEST_USER.password, 10);

  const user = await prisma.user.create({
    data: {
      email: TEST_USER.email,
      passwordHash,
      firstName: TEST_USER.firstName,
      lastName: TEST_USER.lastName,
      globalRole: TEST_USER.globalRole,
    },
  });

  console.log(`Created test user:`);
  console.log(`  Email:    ${user.email}`);
  console.log(`  Password: ${TEST_USER.password}`);
  console.log(`  Role:     ${user.globalRole}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
