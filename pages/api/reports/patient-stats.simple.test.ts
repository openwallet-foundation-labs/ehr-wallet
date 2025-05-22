import { NextApiRequest, NextApiResponse } from 'next';
import handler from './patient-stats';

// Mock the db module and db-utils
jest.mock('@/lib/db', () => ({
  initDatabase: jest.fn().mockResolvedValue({}),
}));

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPatientCount = jest.fn();
  const mockPatientGroupBy = jest.fn();
  
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      patient: {
        count: mockPatientCount,
        groupBy: mockPatientGroupBy,
      },
      $disconnect: jest.fn(),
    })),
  };
});

describe('Patient Stats API', () => {
  let req: Partial<NextApiRequest>;
  let res: Partial<NextApiResponse>;
  let prismaClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset and create fresh mocks for each test
    req = {
      method: 'GET',
      query: {
        startDate: '2023-01-01',
        endDate: '2023-01-31',
      },
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
    };
    
    // Get a reference to the mocked Prisma client
    prismaClient = new (require('@prisma/client').PrismaClient)();
  });

  it('should return patient statistics for a valid date range', async () => {
    const mockTotalPatients = 100;
    const mockNewPatients = 10;
    const mockGenderDistribution = [
      { gender: 'Male', _count: { gender: 5 } },
      { gender: 'Female', _count: { gender: 4 } },
      { gender: 'Other', _count: { gender: 1 } },
    ];

    // Setup the mocks
    prismaClient.patient.count.mockResolvedValueOnce(mockTotalPatients);
    prismaClient.patient.count.mockResolvedValueOnce(mockNewPatients);
    prismaClient.patient.groupBy.mockResolvedValueOnce(mockGenderDistribution);
    
    // Call the handler
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    // Verify the response
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      totalPatients: mockTotalPatients,
      newPatientsInDateRange: mockNewPatients,
      genderDistribution: { Male: 5, Female: 4, Other: 1 },
    }));
    expect(prismaClient.patient.count).toHaveBeenCalledTimes(2);
    expect(prismaClient.patient.groupBy).toHaveBeenCalledTimes(1);
  });

  it('should return 400 if startDate is missing', async () => {
    // Remove startDate from query
    req.query = { endDate: '2023-01-31' };
    
    // Call the handler
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    // Verify the response
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'startDate and endDate are required' });
  });

  it('should return 400 if endDate is missing', async () => {
    // Remove endDate from query
    req.query = { startDate: '2023-01-01' };
    
    // Call the handler
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    // Verify the response
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'startDate and endDate are required' });
  });

  it('should return 400 for invalid date format', async () => {
    // Set invalid date format
    req.query = { startDate: 'invalid-date', endDate: '2023-01-31' };
    
    // Call the handler
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    // Verify the response
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid date format' });
  });

  it('should return 405 if method is not GET', async () => {
    // Change the method
    req.method = 'POST';
    
    // Call the handler
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    // Verify the response
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ message: 'Method Not Allowed' });
  });

  it('should return 500 if Prisma query fails', async () => {
    // Setup the mock to throw an error
    prismaClient.patient.count.mockRejectedValueOnce(new Error('Prisma DB error'));
    
    // Call the handler
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    // Verify the response
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Internal Server Error' });
  });
});
