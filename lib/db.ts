import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'

declare global {
  var prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
  
  // Only use Accelerate extension if we have the Accelerate URL
  if (process.env.DATABASE_URL?.includes('prisma.io')) {
    return client.$extends(withAccelerate()) as unknown as PrismaClient
  }
  
  return client
}

export const prisma = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}

// Ensure proper connection handling for serverless
export async function disconnect() {
  await prisma.$disconnect()
}