import { testApiHandler } from 'next-test-api-route-handler';
import patientStatsHandler from './patient-stats'; // Adjust path as necessary
import { mockPrisma } from '@/__mocks__/@prisma/client'; // Import the mock

jest.mock('@prisma/client'); // This will use the mock from __mocks__/@prisma/client.ts

describe('API /api/reports/patient-stats', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should return patient statistics for a valid date range', async () => {
    const mockTotalPatients = 100;
    const mockNewPatients = 10;
    const mockGenderDistribution = [
      { gender: 'Male', _count: { gender: 5 } },
      { gender: 'Female', _count: { gender: 4 } },
      { gender: 'Other', _count: { gender: 1 } },
    ];

    mockPrisma.patient.count.mockResolvedValueOnce(mockTotalPatients); // For total patients
    mockPrisma.patient.count.mockResolvedValueOnce(mockNewPatients);   // For new patients in range
    mockPrisma.patient.groupBy.mockResolvedValueOnce(mockGenderDistribution);

    await testApiHandler({
      handler: patientStatsHandler,
      params: { startDate: '2023-01-01', endDate: '2023-01-31' },
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.totalPatients).toBe(mockTotalPatients);
        expect(json.newPatientsInDateRange).toBe(mockNewPatients);
        expect(json.genderDistribution).toEqual({ Male: 5, Female: 4, Other: 1 });
        expect(mockPrisma.patient.count).toHaveBeenCalledTimes(2);
        expect(mockPrisma.patient.groupBy).toHaveBeenCalledTimes(1);
      },
    });
  });

  it('should return 400 if startDate is missing', async () => {
    await testApiHandler({
      handler: patientStatsHandler,
      params: { endDate: '2023-01-31' },
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.message).toBe('startDate and endDate are required');
      },
    });
  });

  it('should return 400 if endDate is missing', async () => {
    await testApiHandler({
      handler: patientStatsHandler,
      params: { startDate: '2023-01-01' },
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
      handler: patientStatsHandler,
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
      handler: patientStatsHandler,
      params: { startDate: '2023-01-01', endDate: '2023-01-31' },
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'POST', body: 'test' }); // Any other method
        expect(res.status).toBe(405);
        const json = await res.json();
        expect(json.message).toBe('Method Not Allowed');
      },
    });
  });

  it('should return 500 if Prisma query fails', async () => {
    mockPrisma.patient.count.mockRejectedValueOnce(new Error('Prisma DB error'));

    await testApiHandler({
      handler: patientStatsHandler,
      params: { startDate: '2023-01-01', endDate: '2023-01-31' },
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'GET' });
        expect(res.status).toBe(500);
        const json = await res.json();
        expect(json.message).toBe('Internal Server Error');
      },
    });
  });
});
