import { testApiHandler } from 'next-test-api-route-handler';
import appointmentVolumesHandler from './appointment-volumes';
import { mockPrisma } from '@/__mocks__/@prisma/client';

jest.mock('@prisma/client');

describe('API /api/reports/appointment-volumes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return appointment volumes for a valid date range', async () => {
    const mockAppointmentsInRange = [
      { id: '1', status: 'COMPLETED' }, { id: '2', status: 'SCHEDULED' }, { id: '3', status: 'COMPLETED' },
    ];
    const mockStatusDistribution = [
      { status: 'COMPLETED', _count: { status: 2 } },
      { status: 'SCHEDULED', _count: { status: 1 } },
    ];

    mockPrisma.appointment.findMany.mockResolvedValueOnce(mockAppointmentsInRange);
    mockPrisma.appointment.groupBy.mockResolvedValueOnce(mockStatusDistribution);

    await testApiHandler({
      handler: appointmentVolumesHandler,
      params: { startDate: '2023-02-01', endDate: '2023-02-28' },
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.totalAppointmentsInDateRange).toBe(mockAppointmentsInRange.length);
        expect(json.statusDistribution).toEqual({ COMPLETED: 2, SCHEDULED: 1 });
        expect(json.appointmentsPerPeriod.message).toBeDefined(); // Check placeholder is there
        expect(mockPrisma.appointment.findMany).toHaveBeenCalledTimes(1);
        expect(mockPrisma.appointment.groupBy).toHaveBeenCalledTimes(1);
      },
    });
  });

  it('should return 400 if startDate or endDate is missing', async () => {
    await testApiHandler({
      handler: appointmentVolumesHandler,
      params: { endDate: '2023-02-28' }, // Missing startDate
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.message).toBe('startDate and endDate are required');
      },
    });
  });
  
  it('should return 400 for invalid date format', async () => {
    await testApiHandler({
      handler: appointmentVolumesHandler,
      params: { startDate: 'invalid-date', endDate: '2023-01-31' },
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.message).toBe('Invalid date format');
      },
    });
  });

  it('should return 405 if method is not GET', async () => {
    await testApiHandler({
      handler: appointmentVolumesHandler,
      params: { startDate: '2023-01-01', endDate: '2023-01-31' },
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'PUT', body: 'test' });
        expect(res.status).toBe(405);
      },
    });
  });

  it('should return 500 if Prisma query fails', async () => {
    mockPrisma.appointment.findMany.mockRejectedValueOnce(new Error('Prisma DB error'));

    await testApiHandler({
      handler: appointmentVolumesHandler,
      params: { startDate: '2023-02-01', endDate: '2023-02-28' },
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(500);
        const json = await res.json();
        expect(json.message).toBe('Internal Server Error');
      },
    });
  });
});
