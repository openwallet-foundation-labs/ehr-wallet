import { testApiHandler } from 'next-test-api-route-handler';
import providerProductivityHandler from './provider-productivity';
import { mockPrisma } from '@/__mocks__/@prisma/client';

jest.mock('@prisma/client');

describe('API /api/reports/provider-productivity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return provider productivity for a valid date range', async () => {
    const mockAppointmentsByProvider = [
      { providerId: 'prov1', _count: { id: 50 } },
      { providerId: 'prov2', _count: { id: 70 } },
    ];
    const mockProviders = [
      { id: 'prov1', name: 'Dr. Smith', specialty: 'Cardiology' },
      { id: 'prov2', name: 'Dr. Jones', specialty: 'Pediatrics' },
    ];

    mockPrisma.appointment.groupBy.mockResolvedValueOnce(mockAppointmentsByProvider);
    mockPrisma.provider.findMany.mockResolvedValueOnce(mockProviders);

    await testApiHandler({
      handler: providerProductivityHandler,
      params: { startDate: '2023-03-01', endDate: '2023-03-31' },
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.providerProductivity).toHaveLength(2);
        expect(json.providerProductivity[0].providerName).toBe('Dr. Jones'); // Ordered by count desc
        expect(json.providerProductivity[0].appointmentCount).toBe(70);
        expect(json.providerProductivity[1].providerName).toBe('Dr. Smith');
        expect(json.providerProductivity[1].appointmentCount).toBe(50);
        expect(mockPrisma.appointment.groupBy).toHaveBeenCalledTimes(1);
        expect(mockPrisma.provider.findMany).toHaveBeenCalledTimes(1);
      },
    });
  });

  it('should return 400 if startDate or endDate is missing', async () => {
    await testApiHandler({
      handler: providerProductivityHandler,
      params: { startDate: '2023-03-01' }, // Missing endDate
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(400);
      },
    });
  });
  
  it('should return 400 for invalid date format', async () => {
    await testApiHandler({
      handler: providerProductivityHandler,
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
      handler: providerProductivityHandler,
      params: { startDate: '2023-01-01', endDate: '2023-01-31' },
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'DELETE' });
        expect(res.status).toBe(405);
      },
    });
  });

  it('should return 500 if Prisma.appointment.groupBy fails', async () => {
    mockPrisma.appointment.groupBy.mockRejectedValueOnce(new Error('Prisma DB error'));

    await testApiHandler({
      handler: providerProductivityHandler,
      params: { startDate: '2023-03-01', endDate: '2023-03-31' },
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(500);
        const json = await res.json();
        expect(json.message).toBe('Internal Server Error');
      },
    });
  });

  it('should return 500 if Prisma.provider.findMany fails', async () => {
    // First call (groupBy) succeeds
    mockPrisma.appointment.groupBy.mockResolvedValueOnce([
      { providerId: 'prov1', _count: { id: 50 } },
    ]);
    // Second call (findMany) fails
    mockPrisma.provider.findMany.mockRejectedValueOnce(new Error('Prisma DB error'));

    await testApiHandler({
      handler: providerProductivityHandler,
      params: { startDate: '2023-03-01', endDate: '2023-03-31' },
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(500);
        const json = await res.json();
        expect(json.message).toBe('Internal Server Error');
      },
    });
  });
  
  it('should handle cases where providers are not found for some appointments', async () => {
    const mockAppointmentsByProvider = [
      { providerId: 'prov1', _count: { id: 50 } },
      { providerId: 'prov_unknown', _count: { id: 70 } },
    ];
    const mockProviders = [ // Only Dr. Smith is found
      { id: 'prov1', name: 'Dr. Smith', specialty: 'Cardiology' },
    ];

    mockPrisma.appointment.groupBy.mockResolvedValueOnce(mockAppointmentsByProvider);
    mockPrisma.provider.findMany.mockResolvedValueOnce(mockProviders);

    await testApiHandler({
      handler: providerProductivityHandler,
      params: { startDate: '2023-03-01', endDate: '2023-03-31' },
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.providerProductivity).toHaveLength(2);
        // The order is based on count, so 'prov_unknown' comes first
        expect(json.providerProductivity[0].providerName).toBe('Unknown Provider');
        expect(json.providerProductivity[0].appointmentCount).toBe(70);
        expect(json.providerProductivity[1].providerName).toBe('Dr. Smith');
        expect(json.providerProductivity[1].appointmentCount).toBe(50);
      },
    });
  });

});
