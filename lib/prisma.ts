// Import from @prisma/client/edge which is available in Prisma v6+
import { PrismaClient as BasePrismaClient } from '@prisma/client/edge'

// Define a custom client type with the log option
type PrismaClientOptions = {
  log?: Array<'query' | 'info' | 'warn' | 'error'>
}

// Create a custom client constructor
class PrismaClient extends BasePrismaClient {
  constructor(options?: PrismaClientOptions) {
    super(options)
  }
}

// Prevent multiple instances in development
const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
