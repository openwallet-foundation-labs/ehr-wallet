// Prisma 7 client with driver adapter to work with Coolify/Nixpacks
import { PrismaClient } from '@/generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

// Prevent multiple instances in development
const globalForPrisma = global as unknown as { prisma: any }

function createPrismaClient() {
  // In tests the PrismaClient class is mocked via '@/generated/prisma/client',
  // so a stub adapter is enough if the real class is ever constructed.
  const adapter =
    process.env.NODE_ENV === 'test'
      ? ({ adapterName: '@prisma/adapter-better-sqlite3', provider: 'sqlite' } as any)
      : new PrismaBetterSqlite3({
          url: process.env.DATABASE_URL || 'file:./dev.db',
        })

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
