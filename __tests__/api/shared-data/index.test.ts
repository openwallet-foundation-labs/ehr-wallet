/**
 * Tests for Shared Data API
 */

import { NextApiRequest, NextApiResponse } from 'next';
import handler from '@/pages/api/shared-data/index';

// Mock next-auth
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

// Mock auth options
jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

import { getServerSession } from 'next-auth/next';

describe('Shared Data API', () => {
  let req: Partial<NextApiRequest>;
  let res: Partial<NextApiResponse>;

  // Mock Prisma client
  const mockPrisma = {
    sharedMedicalData: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    req = {
      method: 'GET',
      query: {},
      headers: {},
      body: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock Prisma
    jest.doMock('@prisma/client', () => ({
      PrismaClient: jest.fn(() => mockPrisma),
    }));
  });

  afterEach(() => {
    jest.resetModules();
  });

  it('should return 401 if no authentication', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Authentication required. Please login or connect wallet.',
    });
  });

  it('should return 405 for unsupported methods', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { ethereumAddress: '0x123' },
    });

    req.method = 'DELETE';

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
  });

  it('should return 400 for POST with missing fields', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { ethereumAddress: '0x123' },
    });

    req.method = 'POST';
    req.body = { accessId: 'test-id' }; // missing ipfsCid and expiryTime

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing required fields' });
  });
});
