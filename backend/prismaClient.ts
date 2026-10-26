import {PrismaClient} from './node_modules/.prisma/client/index.js';
import {PrismaPg} from '@prisma/adapter-pg';
import {resolveDatabaseUrl} from './lib/databaseUrl.js';

const connectionString = resolveDatabaseUrl();
const adapter = new PrismaPg(connectionString);

export const prisma = new PrismaClient({
  adapter,
  log: ['query', 'info', 'warn', 'error'],
});
