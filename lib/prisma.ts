// For compatibility with different build environments including Netlify
let PrismaClient;
try {
  // First, try the standard import pattern
  const { PrismaClient: StandardPrismaClient } = require('@prisma/client');
  PrismaClient = StandardPrismaClient;
} catch (error) {
  // Fallback: try to get the client through ESM dynamic import
  console.log('Falling back to alternative Prisma import method');
  const prismaModule = require('@prisma/client');
  PrismaClient = prismaModule?.default?.PrismaClient || prismaModule?.PrismaClient;
  
  if (!PrismaClient) {
    throw new Error('Failed to load PrismaClient from @prisma/client');
  }
}

// Prevent multiple instances in development
const globalForPrisma = global as unknown as { prisma: any }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
