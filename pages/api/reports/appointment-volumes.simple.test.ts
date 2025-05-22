import { NextApiRequest, NextApiResponse } from 'next';
import handler from './appointment-volumes';

// Mock the db module and db-utils
jest.mock('@/lib/db', () => ({
  initDatabase: jest.fn().mockResolvedValue({}),
}));

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockAppointmentFindMany = jest.fn();
  const mockAppointmentGroupBy = jest.fn();
  
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      appointment: {
        findMany: mockAppointmentFindMany,
        groupBy: mockAppointmentGroupBy,
      },
      $disconnect: jest.fn(),
    })),
  };
});

describe('Appointment Volumes API', () => {
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

  it('should return appointment volumes for a valid date range', async () => {
    const mockAppointmentsInRange = [
      { id: 'appt1', status: 'SCHEDULED' },
      { id: 'appt2', status: 'CONFIRMED' },
      { id: 'appt3', status: 'COMPLETED' },
      { id: 'appt4', status: 'CANCELLED' },
      { id: 'appt5', status: 'SCHEDULED' },
    ];

    const mockStatusDistribution = [
      { status: 'SCHEDULED', _count: { status: 2 } },
      { status: 'CONFIRMED', _count: { status: 1 } },
      { status: 'COMPLETED', _count: { status: 1 } },
      { status: 'CANCELLED', _count: { status: 1 } },
    ];

    // Setup the mocks
    prismaClient.appointment.findMany.mockResolvedValueOnce(mockAppointmentsInRange);
    prismaClient.appointment.groupBy.mockResolvedValueOnce(mockStatusDistribution);
    
    // Call the handler
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    // Verify the response
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      totalAppointments: 5,
      statusDistribution: {
        SCHEDULED: 2,
        CONFIRMED: 1,
        COMPLETED: 1,
        CANCELLED: 1,
        NO_SHOW: 0,
      },
    }));
    expect(prismaClient.appointment.findMany).toHaveBeenCalledTimes(1);
    expect(prismaClient.appointment.groupBy).toHaveBeenCalledTimes(1);
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
    prismaClient.appointment.findMany.mockRejectedValueOnce(new Error('Prisma DB error'));
    
    // Call the handler
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    // Verify the response
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
      message: expect.stringContaining('Internal Server Error') 
    }));
  });
});
