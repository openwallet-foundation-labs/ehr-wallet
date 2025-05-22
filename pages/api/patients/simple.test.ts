import { NextApiRequest, NextApiResponse } from 'next';
import handler from './index';

// Mock the db module and db-utils
jest.mock('@/lib/db', () => ({
  initDatabase: jest.fn().mockResolvedValue({}),
  db: {
    patients: {
      toArray: jest.fn(),
    },
    visits: {
      where: jest.fn().mockReturnThis(),
      anyOf: jest.fn().mockReturnThis(),
      toArray: jest.fn(),
    },
  },
}));

jest.mock('@/lib/db-utils', () => ({
  getAllPatients: jest.fn(),
  createNewPatient: jest.fn(),
}));

// Import the mocked functions after mocking
import { getAllPatients, createNewPatient } from '@/lib/db-utils';

describe('Patients API', () => {
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

  it('should return patients when GET is called', async () => {
    const mockPatients = [
      {
        id: 'PAT-1000',
        name: 'John Doe',
        dob: '1980-01-01',
        gender: 'Male',
        phone: '555-1234',
        lastVisit: '2023-01-15',
        email: 'john@example.com',
        address: '123 Main St',
      },
    ];

    // Setup the mock
    (getAllPatients as jest.Mock).mockResolvedValueOnce(mockPatients);
    
    // Set the request method
    req.method = 'GET';
    
    // Call the handler
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    // Verify the response
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockPatients);
    expect(getAllPatients).toHaveBeenCalledTimes(1);
  });

  it('should create a new patient when POST is called with valid data', async () => {
    const newPatient = {
      name: 'Jane Smith',
      dob: '1990-05-15',
      gender: 'Female',
      phone: '555-5678',
      email: 'jane@example.com',
      address: '456 Oak Ave',
    };

    const createdPatient = {
      id: 'PAT-1001',
      ...newPatient,
    };

    // Setup the mock
    (createNewPatient as jest.Mock).mockResolvedValueOnce(createdPatient);
    
    // Set the request method and body
    req.method = 'POST';
    req.body = newPatient;
    
    // Call the handler
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    // Verify the response
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(createdPatient);
    expect(createNewPatient).toHaveBeenCalledTimes(1);
    expect(createNewPatient).toHaveBeenCalledWith(expect.objectContaining({
      name: newPatient.name,
      dob: newPatient.dob,
      gender: newPatient.gender,
    }));
  });

  it('should return 400 if required fields are missing in POST', async () => {
    const invalidPatient = {
      name: 'Invalid Patient',
      // Missing dob and gender
    };
    
    // Set the request method and body
    req.method = 'POST';
    req.body = invalidPatient;
    
    // Call the handler
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    // Verify the response
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: expect.stringContaining('required') });
    expect(createNewPatient).not.toHaveBeenCalled();
  });

  it('should return 405 for unsupported methods', async () => {
    // Set the request method
    req.method = 'PUT';
    
    // Call the handler
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    // Verify the response
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: expect.stringContaining('Not Allowed') });
    expect(res.setHeader).toHaveBeenCalledWith('Allow', ['GET', 'POST']);
  });

  it('should return 500 if database query fails during GET', async () => {
    // Setup the mock to throw an error
    (getAllPatients as jest.Mock).mockRejectedValueOnce(new Error('Database error'));
    
    // Set the request method
    req.method = 'GET';
    
    // Call the handler
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    // Verify the response
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: expect.stringContaining('Failed to fetch') });
  });

  it('should return 500 if database operation fails during POST', async () => {
    const newPatient = {
      name: 'Error Patient',
      dob: '1995-12-12',
      gender: 'Male',
      phone: '555-2222',
    };
    
    // Setup the mock to throw an error
    (createNewPatient as jest.Mock).mockRejectedValueOnce(new Error('Database error'));
    
    // Set the request method and body
    req.method = 'POST';
    req.body = newPatient;
    
    // Call the handler
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    // Verify the response
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: expect.stringContaining('Failed to create') });
  });
});
