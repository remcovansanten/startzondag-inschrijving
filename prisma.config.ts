import dotenv from 'dotenv';
import { defineConfig, env } from 'prisma/config';

// Laad lokale env-bestanden voor de Prisma CLI (db push, studio, generate).
// Op Vercel zijn de env-vars al geïnjecteerd; dotenv overschrijft bestaande niet.
dotenv.config({ path: '.env.local' });
dotenv.config();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'tsx scripts/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
