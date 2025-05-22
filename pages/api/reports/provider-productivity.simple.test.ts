import { NextApiRequest, NextApiResponse } from 'next';
import handler from './provider-productivity';

// Mock the db module and db-utils
jest.mock('@/lib/db', () => ({
  initDatabase: jest.fn().mockResolvedValue({}),
}));

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockAppointmentGroupBy = jest.fn();
  const mockProviderFindMany = jest.fn();
  
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      appointment: {
        groupBy: mockAppointmentGroupBy,
      },
      provider: {
        findMany: mockProviderFindMany,
      },
      $disconnect: jest.fn(),
    })),
  };
});

describe('Provider Productivity API', () => {
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

  it('should return provider productivity for a valid date range', async () => {
    const mockAppointmentsByProvider = [
      { providerId: 'provider1', _count: { providerId: 10 } },
      { providerId: 'provider2', _count: { providerId: 5 } },
    ];

    const mockProviders = [
      { id: 'provider1', name: 'Dr. Smith', specialty: 'Radiology' },
      { id: 'provider2', name: 'Dr. Johnson', specialty: 'MRI' },
    ];

    // Setup the mocks
    prismaClient.appointment.groupBy.mockResolvedValueOnce(mockAppointmentsByProvider);
    prismaClient.provider.findMany.mockResolvedValueOnce(mockProviders);
    
    // Call the handler
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    // Verify the response
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      providers: expect.arrayContaining([
        expect.objectContaining({
          id: 'provider1',
          name: 'Dr. Smith',
          specialty: 'Radiology',
          appointmentCount: 10,
        }),
        expect.objectContaining({
          id: 'provider2',
          name: 'Dr. Johnson',
          specialty: 'MRI',
          appointmentCount: 5,
        }),
      ]),
    }));
    expect(prismaClient.appointment.groupBy).toHaveBeenCalledTimes(1);
    expect(prismaClient.provider.findMany).toHaveBeenCalledTimes(1);
  });

  it('should return 400 if startDate is missing', async () => {
    // Remove startDate from query
    req.query = { endDate: '2023-01-31' };
    
    // Call the handler
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    // Verify the response
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
      message: expect.stringContaining('required') 
    }));
  });

  it('should return 400 if endDate is missing', async () => {
    // Remove endDate from query
    req.query = { startDate: '2023-01-01' };
    
    // Call the handler
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    // Verify the response
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
      message: expect.stringContaining('required') 
    }));
  });

  it('should return 405 if method is not GET', async () => {
    // Change the method
    req.method = 'POST';
    
    // Call the handler
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    // Verify the response
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
      message: expect.stringContaining('Not Allowed') 
    }));
  });

  it('should return 500 if Prisma query fails', async () => {
    // Setup the mock to throw an error
    prismaClient.appointment.groupBy.mockRejectedValueOnce(new Error('Prisma DB error'));
    
    // Call the handler
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    // Verify the response
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
      message: expect.stringContaining('Internal Server Error') 
    }));
  });
});
