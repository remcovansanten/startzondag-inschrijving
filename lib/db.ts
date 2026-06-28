import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

declare global {
  var prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL ontbreekt. Stel deze in via de environment — er is geen fallback.');
  }
  // Prisma 7 driver adapter: directe Postgres-verbinding (lokaal localhost,
  // productie Prisma Postgres via db.prisma.io). Uniform, geen Accelerate-tak.
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const prisma = globalThis.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Ensure proper connection handling for serverless
export async function disconnect() {
  await prisma.$disconnect();
}
