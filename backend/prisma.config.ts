import 'dotenv/config';
import {defineConfig} from 'prisma/config';
import {resolveDatabaseUrl} from './lib/databaseUrl.js';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: resolveDatabaseUrl(),
  },
});
