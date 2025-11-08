/**
 * Integration tests for FHIR Patient API endpoints
 */

import { testApiHandler } from 'next-test-api-route-handler';
import patientIndexHandler from '@/pages/api/fhir/Patient/index';
import patientIdHandler from '@/pages/api/fhir/Patient/[id]';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    patient: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

const mockPrisma = new PrismaClient();

describe('FHIR Patient API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/fhir/Patient', () => {
    it('should return a FHIR Bundle of patients', async () => {
      const mockPatients = [
        {
          id: 'pat-1',
          patientId: 'PAT-000001',
          name: 'John Doe',
          dob: '1990-05-15',
          gender: 'male',
          phone: '+1234567890',
          email: 'john@example.com',
          address: '123 Main St',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];

      (mockPrisma.patient.findMany as jest.Mock).mockResolvedValue(mockPatients);
      (mockPrisma.patient.count as jest.Mock).mockResolvedValue(1);

      await testApiHandler({
        handler: patientIndexHandler,
        test: async ({ fetch }) => {
          const res = await fetch({ method: 'GET' });
          const json = await res.json();

          expect(res.status).toBe(200);
          expect(json.resourceType).toBe('Bundle');
          expect(json.type).toBe('searchset');
          expect(json.total).toBe(1);
          expect(json.entry).toHaveLength(1);
          expect(json.entry[0].resource.resourceType).toBe('Patient');
          expect(json.entry[0].resource.id).toBe('pat-1');
        },
      });
    });

    it('should support search by name', async () => {
      (mockPrisma.patient.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.patient.count as jest.Mock).mockResolvedValue(0);

      await testApiHandler({
        handler: patientIndexHandler,
        params: { name: 'John' },
        test: async ({ fetch }) => {
          const res = await fetch({ method: 'GET' });

          expect(res.status).toBe(200);
          expect(mockPrisma.patient.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
              where: expect.objectContaining({
                name: expect.objectContaining({
                  contains: 'John',
                }),
              }),
            })
          );
        },
      });
    });

    it('should support pagination', async () => {
      (mockPrisma.patient.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.patient.count as jest.Mock).mockResolvedValue(100);

      await testApiHandler({
        handler: patientIndexHandler,
        params: { _count: '10', _offset: '20' },
        test: async ({ fetch }) => {
          const res = await fetch({ method: 'GET' });

          expect(res.status).toBe(200);
          expect(mockPrisma.patient.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
              take: 10,
              skip: 20,
            })
          );
        },
      });
    });
  });

  describe('POST /api/fhir/Patient', () => {
    it('should create a new patient from FHIR resource', async () => {
      const fhirPatient = {
        resourceType: 'Patient',
        name: [
          {
            text: 'Jane Smith',
            given: ['Jane'],
            family: 'Smith',
          },
        ],
        gender: 'female',
        birthDate: '1985-03-20',
        telecom: [
          {
            system: 'email',
            value: 'jane@example.com',
          },
        ],
      };

      const createdPatient = {
        id: 'pat-new',
        patientId: 'PAT-000002',
        name: 'Jane Smith',
        dob: '1985-03-20',
        gender: 'female',
        phone: null,
        email: 'jane@example.com',
        address: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.patient.count as jest.Mock).mockResolvedValue(1);
      (mockPrisma.patient.create as jest.Mock).mockResolvedValue(createdPatient);

      await testApiHandler({
        handler: patientIndexHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'POST',
            headers: {
              'Content-Type': 'application/fhir+json',
            },
            body: JSON.stringify(fhirPatient),
          });

          const json = await res.json();

          expect(res.status).toBe(201);
          expect(json.resourceType).toBe('Patient');
          expect(json.id).toBe('pat-new');
          expect(res.headers.get('Location')).toContain('/Patient/pat-new');
        },
      });
    });

    it('should reject invalid resource type', async () => {
      await testApiHandler({
        handler: patientIndexHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'POST',
            headers: {
              'Content-Type': 'application/fhir+json',
            },
            body: JSON.stringify({ resourceType: 'Observation' }),
          });

          const json = await res.json();

          expect(res.status).toBe(400);
          expect(json.resourceType).toBe('OperationOutcome');
          expect(json.issue[0].severity).toBe('error');
        },
      });
    });
  });

  describe('GET /api/fhir/Patient/[id]', () => {
    it('should return a specific patient', async () => {
      const mockPatient = {
        id: 'pat-123',
        patientId: 'PAT-000001',
        name: 'John Doe',
        dob: '1990-05-15',
        gender: 'male',
        phone: '+1234567890',
        email: 'john@example.com',
        address: '123 Main St',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      };

      (mockPrisma.patient.findUnique as jest.Mock).mockResolvedValue(mockPatient);

      await testApiHandler({
        handler: patientIdHandler,
        params: { id: 'pat-123' },
        test: async ({ fetch }) => {
          const res = await fetch({ method: 'GET' });
          const json = await res.json();

          expect(res.status).toBe(200);
          expect(json.resourceType).toBe('Patient');
          expect(json.id).toBe('pat-123');
          expect(res.headers.get('Content-Type')).toContain('application/fhir+json');
          expect(res.headers.get('ETag')).toBeDefined();
        },
      });
    });

    it('should return 404 for non-existent patient', async () => {
      (mockPrisma.patient.findUnique as jest.Mock).mockResolvedValue(null);

      await testApiHandler({
        handler: patientIdHandler,
        params: { id: 'nonexistent' },
        test: async ({ fetch }) => {
          const res = await fetch({ method: 'GET' });
          const json = await res.json();

          expect(res.status).toBe(404);
          expect(json.resourceType).toBe('OperationOutcome');
        },
      });
    });
  });

  describe('PUT /api/fhir/Patient/[id]', () => {
    it('should update an existing patient', async () => {
      const existingPatient = {
        id: 'pat-123',
        patientId: 'PAT-000001',
        name: 'John Doe',
        dob: '1990-05-15',
        gender: 'male',
        phone: '+1234567890',
        email: 'john@example.com',
        address: '123 Main St',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      const updatedPatient = {
        ...existingPatient,
        phone: '+1111111111',
        updatedAt: new Date('2024-01-20'),
      };

      (mockPrisma.patient.findUnique as jest.Mock).mockResolvedValue(existingPatient);
      (mockPrisma.patient.update as jest.Mock).mockResolvedValue(updatedPatient);

      const fhirUpdate = {
        resourceType: 'Patient',
        id: 'pat-123',
        telecom: [
          {
            system: 'phone',
            value: '+1111111111',
          },
        ],
      };

      await testApiHandler({
        handler: patientIdHandler,
        params: { id: 'pat-123' },
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'PUT',
            headers: {
              'Content-Type': 'application/fhir+json',
            },
            body: JSON.stringify(fhirUpdate),
          });

          const json = await res.json();

          expect(res.status).toBe(200);
          expect(json.resourceType).toBe('Patient');
        },
      });
    });
  });

  describe('DELETE /api/fhir/Patient/[id]', () => {
    it('should delete a patient', async () => {
      (mockPrisma.patient.delete as jest.Mock).mockResolvedValue({});

      await testApiHandler({
        handler: patientIdHandler,
        params: { id: 'pat-123' },
        test: async ({ fetch }) => {
          const res = await fetch({ method: 'DELETE' });

          expect(res.status).toBe(204);
        },
      });
    });
  });
});
