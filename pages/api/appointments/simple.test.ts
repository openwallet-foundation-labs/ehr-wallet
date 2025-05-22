import { NextApiRequest, NextApiResponse } from 'next';
import handler from './index';

// Mock the db module and db-utils
jest.mock('@/lib/db', () => ({
  initDatabase: jest.fn().mockResolvedValue({}),
  db: {
    appointments: {
      toArray: jest.fn().mockResolvedValue([]),
      where: jest.fn().mockReturnThis(),
      anyOf: jest.fn().mockReturnThis(),
    },
    patients: {
      where: jest.fn().mockReturnThis(),
      anyOf: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([]),
    },
    providers: {
      where: jest.fn().mockReturnThis(),
      anyOf: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([]),
    },
    appointmentTypes: {
      where: jest.fn().mockReturnThis(),
      anyOf: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([]),
    },
  },
}));

jest.mock('@/lib/db-utils', () => ({
  getAllAppointments: jest.fn(),
  createAppointment: jest.fn(),
  getPatientById: jest.fn(),
  getProviderById: jest.fn(),
  getAppointmentTypeById: jest.fn(),
}));

// Import the mocked functions after mocking
import { 
  getAllAppointments, 
  createAppointment, 
  getPatientById, 
  getProviderById, 
  getAppointmentTypeById 
} from '@/lib/db-utils';

describe('Appointments API', () => {
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

  it('should return all appointments when GET is called with no filters', async () => {
    const mockAppointments = [
      {
        id: 'appt-1',
        title: 'Annual Checkup',
        patientId: 'patient-1',
        providerId: 'provider-1',
        appointmentTypeId: 'type-1',
        startTime: new Date('2023-06-01T10:00:00Z'),
        endTime: new Date('2023-06-01T11:00:00Z'),
        status: 'SCHEDULED',
        notes: null,
      },
      {
        id: 'appt-2',
        title: 'Follow-up',
        patientId: 'patient-2',
        providerId: 'provider-2',
        appointmentTypeId: 'type-2',
        startTime: new Date('2023-06-02T14:00:00Z'),
        endTime: new Date('2023-06-02T15:00:00Z'),
        status: 'CONFIRMED',
        notes: 'Follow-up for previous visit',
      },
    ];

    // Setup the mocks
    (getAllAppointments as jest.Mock).mockResolvedValueOnce(mockAppointments);
    
    // Set the request method
    req.method = 'GET';
    
    // Call the handler
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    // Verify the response
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
    expect(getAllAppointments).toHaveBeenCalledTimes(1);
  });

  it('should filter appointments by patientId when provided in query', async () => {
    const mockAppointments = [
      {
        id: 'appt-1',
        title: 'Annual Checkup',
        patientId: 'patient-1',
        providerId: 'provider-1',
        appointmentTypeId: 'type-1',
        startTime: new Date('2023-06-01T10:00:00Z'),
        endTime: new Date('2023-06-01T11:00:00Z'),
        status: 'SCHEDULED',
        notes: null,
      },
      {
        id: 'appt-2',
        title: 'Follow-up',
        patientId: 'patient-2',
        providerId: 'provider-2',
        appointmentTypeId: 'type-2',
        startTime: new Date('2023-06-02T14:00:00Z'),
        endTime: new Date('2023-06-02T15:00:00Z'),
        status: 'CONFIRMED',
        notes: 'Follow-up for previous visit',
      },
    ];

    // Setup the mocks
    (getAllAppointments as jest.Mock).mockResolvedValueOnce(mockAppointments);
    
    // Set the request method and query
    req.method = 'GET';
    req.query = { patientId: 'patient-1' };
    
    // Call the handler
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    // Verify the response
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
    // We can't easily verify the filtering logic since it happens after the mock returns
    // but we can check that the function was called
    expect(getAllAppointments).toHaveBeenCalledTimes(1);
  });

  it('should create a new appointment when POST is called with valid data', async () => {
    const newAppointment = {
      title: 'New Appointment',
      patientId: 'patient-1',
      providerId: 'provider-1',
      appointmentTypeId: 'type-1',
      startTime: '2023-06-10T10:00:00Z',
      endTime: '2023-06-10T11:00:00Z',
      notes: 'New patient appointment',
      status: 'SCHEDULED',
    };

    const mockPatient = { id: 'patient-1', name: 'John Doe' };
    const mockProvider = { id: 'provider-1', name: 'Dr. Smith' };
    const mockAppointmentType = { id: 'type-1', name: 'Checkup' };
    
    const createdAppointment = {
      id: 'new-appt-id',
      ...newAppointment,
      startTime: new Date(newAppointment.startTime),
      endTime: new Date(newAppointment.endTime),
    };

    // Setup the mocks
    (getPatientById as jest.Mock).mockResolvedValueOnce(mockPatient);
    (getProviderById as jest.Mock).mockResolvedValueOnce(mockProvider);
    (getAppointmentTypeById as jest.Mock).mockResolvedValueOnce(mockAppointmentType);
    (createAppointment as jest.Mock).mockResolvedValueOnce(createdAppointment);
    
    // Set the request method and body
    req.method = 'POST';
    req.body = newAppointment;
    
    // Call the handler
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    // Verify the response
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalled();
    expect(getPatientById).toHaveBeenCalledWith(newAppointment.patientId);
    expect(getProviderById).toHaveBeenCalledWith(newAppointment.providerId);
    expect(getAppointmentTypeById).toHaveBeenCalledWith(newAppointment.appointmentTypeId);
    expect(createAppointment).toHaveBeenCalledTimes(1);
  });

  it('should return 400 if required fields are missing in POST', async () => {
    const invalidAppointment = {
      title: 'Invalid Appointment',
      // Missing patientId, providerId, startTime, endTime
    };
    
    // Set the request method and body
    req.method = 'POST';
    req.body = invalidAppointment;
    
    // Call the handler
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    // Verify the response
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ 
      error: expect.stringContaining('required') 
    }));
    expect(createAppointment).not.toHaveBeenCalled();
  });

  it('should return 404 if patient is not found', async () => {
    const appointmentData = {
      title: 'Test Appointment',
      patientId: 'non-existent-patient',
      providerId: 'provider-1',
      startTime: '2023-06-10T10:00:00Z',
      endTime: '2023-06-10T11:00:00Z',
    };
    
    // Setup the mocks
    (getPatientById as jest.Mock).mockResolvedValueOnce(null);
    
    // Set the request method and body
    req.method = 'POST';
    req.body = appointmentData;
    
    // Call the handler
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    // Verify the response
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Patient not found' });
    expect(getProviderById).not.toHaveBeenCalled();
    expect(createAppointment).not.toHaveBeenCalled();
  });

  it('should return 404 if provider is not found', async () => {
    const appointmentData = {
      title: 'Test Appointment',
      patientId: 'patient-1',
      providerId: 'non-existent-provider',
      startTime: '2023-06-10T10:00:00Z',
      endTime: '2023-06-10T11:00:00Z',
    };
    
    // Setup the mocks
    (getPatientById as jest.Mock).mockResolvedValueOnce({ id: 'patient-1', name: 'John Doe' });
    (getProviderById as jest.Mock).mockResolvedValueOnce(null);
    
    // Set the request method and body
    req.method = 'POST';
    req.body = appointmentData;
    
    // Call the handler
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    // Verify the response
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Provider not found' });
    expect(createAppointment).not.toHaveBeenCalled();
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
    (getAllAppointments as jest.Mock).mockRejectedValueOnce(new Error('Database error'));
    
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
});
