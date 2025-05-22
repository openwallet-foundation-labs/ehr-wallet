import { NextApiRequest, NextApiResponse } from 'next';
import handler from './index';

// Mock the db module and db-utils
jest.mock('@/lib/db', () => ({
  initDatabase: jest.fn().mockResolvedValue({}),
  db: {
    appointmentTypes: {
      toArray: jest.fn(),
    },
  },
}));

jest.mock('@/lib/db-utils', () => ({
  getAllAppointmentTypes: jest.fn(),
  createAppointmentType: jest.fn(),
}));

// Import the mocked functions after mocking
import { getAllAppointmentTypes, createAppointmentType } from '@/lib/db-utils';

describe('Appointment Types API', () => {
  let req: Partial<NextApiRequest>;
  let res: Partial<NextApiResponse>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset and create fresh mocks for each test
    req = {
      method: '',
      body: {},
      query: {},
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
    };
  });

  it('should return all appointment types when GET is called', async () => {
    const mockAppointmentTypes = [
      {
        id: 'type-1',
        name: 'Initial Consultation',
        description: 'First visit with a new patient',
        duration: 60,
        color: '#4299e1',
      },
      {
        id: 'type-2',
        name: 'Follow-up',
        description: 'Follow-up appointment',
        duration: 30,
        color: '#48bb78',
      },
    ];

    // Setup the mock
    (getAllAppointmentTypes as jest.Mock).mockResolvedValueOnce(mockAppointmentTypes);
    
    // Set the request method
    req.method = 'GET';
    
    // Call the handler
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    // Verify the response
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockAppointmentTypes);
    expect(getAllAppointmentTypes).toHaveBeenCalledTimes(1);
  });

  it('should create a new appointment type when POST is called with valid data', async () => {
    const newAppointmentType = {
      name: 'X-Ray',
      description: 'X-Ray imaging session',
      duration: 45,
      color: '#ed8936',
    };

    const createdAppointmentType = {
      id: 'new-type-id',
      ...newAppointmentType,
    };

    // Setup the mock
    (createAppointmentType as jest.Mock).mockResolvedValueOnce(createdAppointmentType);
    
    // Set the request method and body
    req.method = 'POST';
    req.body = newAppointmentType;
    
    // Call the handler
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    // Verify the response
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(createdAppointmentType);
    expect(createAppointmentType).toHaveBeenCalledTimes(1);
    expect(createAppointmentType).toHaveBeenCalledWith(expect.objectContaining({
      name: newAppointmentType.name,
      description: newAppointmentType.description,
      duration: newAppointmentType.duration,
      color: newAppointmentType.color,
    }));
  });

  it('should create appointment type with minimal required fields', async () => {
    const minimalAppointmentType = {
      name: 'Minimal Type',
      duration: 15,
    };

    const createdAppointmentType = {
      id: 'minimal-type-id',
      name: minimalAppointmentType.name,
      description: null,
      duration: minimalAppointmentType.duration,
      color: null,
    };

    // Setup the mock
    (createAppointmentType as jest.Mock).mockResolvedValueOnce(createdAppointmentType);
    
    // Set the request method and body
    req.method = 'POST';
    req.body = minimalAppointmentType;
    
    // Call the handler
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    // Verify the response
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(createdAppointmentType);
    expect(createAppointmentType).toHaveBeenCalledTimes(1);
    expect(createAppointmentType).toHaveBeenCalledWith(expect.objectContaining({
      name: minimalAppointmentType.name,
      duration: expect.any(Number),
    }));
  });

  it('should return 400 if name is missing', async () => {
    const invalidAppointmentType = {
      // Missing name
      description: 'Invalid type',
      duration: 30,
    };
    
    // Set the request method and body
    req.method = 'POST';
    req.body = invalidAppointmentType;
    
    // Call the handler
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    // Verify the response
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
      error: expect.stringContaining('required') 
    }));
    expect(createAppointmentType).not.toHaveBeenCalled();
  });

  it('should return 400 if duration is missing', async () => {
    const invalidAppointmentType = {
      name: 'Invalid Type',
      // Missing duration
      description: 'Invalid type',
    };
    
    // Set the request method and body
    req.method = 'POST';
    req.body = invalidAppointmentType;
    
    // Call the handler
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    // Verify the response
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
      error: expect.stringContaining('required') 
    }));
    expect(createAppointmentType).not.toHaveBeenCalled();
  });

  it('should return 400 if duration is not a number', async () => {
    const invalidAppointmentType = {
      name: 'Invalid Type',
      duration: 'thirty', // Not a number
    };
    
    // Set the request method and body
    req.method = 'POST';
    req.body = invalidAppointmentType;
    
    // Call the handler
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    // Verify the response
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
      error: expect.stringContaining('valid duration') 
    }));
    expect(createAppointmentType).not.toHaveBeenCalled();
  });

  it('should return 405 for unsupported methods', async () => {
    // Set the request method
    req.method = 'DELETE';
    
    // Call the handler
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    // Verify the response
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
      error: expect.stringContaining('Not Allowed') 
    }));
    expect(res.setHeader).toHaveBeenCalledWith('Allow', ['GET', 'POST']);
  });

  it('should return 500 if database query fails during GET', async () => {
    // Setup the mock to throw an error
    (getAllAppointmentTypes as jest.Mock).mockRejectedValueOnce(new Error('Database error'));
    
    // Set the request method
    req.method = 'GET';
    
    // Call the handler
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    // Verify the response
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
      error: expect.stringContaining('Failed to fetch') 
    }));
  });

  it('should return 500 if database operation fails during POST', async () => {
    const appointmentType = {
      name: 'Error Type',
      duration: 30,
    };
    
    // Setup the mock to throw an error
    (createAppointmentType as jest.Mock).mockRejectedValueOnce(new Error('Database error'));
    
    // Set the request method and body
    req.method = 'POST';
    req.body = appointmentType;
    
    // Call the handler
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    // Verify the response
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
      error: expect.stringContaining('Failed to create') 
    }));
  });
});
