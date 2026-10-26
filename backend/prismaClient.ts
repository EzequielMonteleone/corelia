import {PrismaClient} from '@prisma/client';
import {PrismaPg} from '@prisma/adapter-pg';
import {resolveDatabaseUrl} from './lib/databaseUrl.js';

const connectionString = resolveDatabaseUrl();
const adapter = new PrismaPg(connectionString);

export const prisma = new PrismaClient({
  adapter,
  log: ['query', 'info', 'warn', 'error'],
});
