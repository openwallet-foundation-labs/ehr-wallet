import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node --compiler-options {"module":"CommonJS"} prisma/seed.ts',
  },
  datasource: {
    // `prisma generate` does not need a live database, so fall back to a
    // placeholder when DATABASE_URL is unset (e.g. in CI).
    url: process.env.DATABASE_URL ?? 'file:./dev.db',
  },
});
