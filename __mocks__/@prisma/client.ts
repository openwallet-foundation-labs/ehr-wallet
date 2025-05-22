// __mocks__/@prisma/client.ts
export const PrismaClient = jest.fn().mockImplementation(() => ({
  patient: {
    count: jest.fn(),
    groupBy: jest.fn(),
    findMany: jest.fn(), // Though not used by patient-stats, good for consistency
  },
  appointment: {
    count: jest.fn(),
    groupBy: jest.fn(),
    findMany: jest.fn(),
  },
  provider: {
    // Assuming provider data is fetched via appointments relation or directly if needed
    findMany: jest.fn(),
    groupBy: jest.fn(), // If we ever group by provider directly
  },
  $disconnect: jest.fn(),
}));

// Helper to access the mock instances
export const mockPrisma = new PrismaClient();
