import {PrismaClient} from '@prisma/client';
import {Pool} from 'pg';
import {PrismaPg} from '@prisma/adapter-pg';
import {resolveDatabaseUrl} from './lib/databaseUrl.js';

const connectionString = resolveDatabaseUrl();

const pool = new Pool({connectionString});
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  log: ['query', 'info', 'warn', 'error'],
});
