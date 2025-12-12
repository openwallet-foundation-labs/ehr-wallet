/**
 * Integration tests for FHIR Patient API endpoints
 */

import { NextApiRequest, NextApiResponse } from 'next';
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

// Helper to create mock request and response
function createMocks(method: string, query: any = {}, body: any = {}) {
  const req: Partial<NextApiRequest> = {
    method,
    query,
    body,
    headers: {
      host: 'localhost:3000',
    },
  };

  const res: Partial<NextApiResponse> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    setHeader: jest.fn(),
    end: jest.fn(),
  };

  return { req: req as NextApiRequest, res: res as NextApiResponse };
}

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

      const { req, res } = createMocks('GET');
      await patientIndexHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        resourceType: 'Bundle',
        type: 'searchset',
        total: 1,
        entry: expect.arrayContaining([
          expect.objectContaining({
            resource: expect.objectContaining({
              resourceType: 'Patient',
              id: 'pat-1',
            }),
          }),
        ]),
      }));
    });

    it('should support search by name', async () => {
      (mockPrisma.patient.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.patient.count as jest.Mock).mockResolvedValue(0);

      const { req, res } = createMocks('GET', { name: 'John' });
      await patientIndexHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockPrisma.patient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: expect.objectContaining({
              contains: 'John',
            }),
          }),
        })
      );
    });

    it('should support pagination', async () => {
      (mockPrisma.patient.findMany as jest.Mock).mockResolvedValue([]);
      (mockPrisma.patient.count as jest.Mock).mockResolvedValue(100);

      const { req, res } = createMocks('GET', { _count: '10', _offset: '20' });
      await patientIndexHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockPrisma.patient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      );
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

      const { req, res } = createMocks('POST', {}, fhirPatient);
      await patientIndexHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.setHeader).toHaveBeenCalledWith('Location', expect.stringContaining('/Patient/pat-new'));
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        resourceType: 'Patient',
        id: 'pat-new',
      }));
    });

    it('should reject invalid resource type', async () => {
      const { req, res } = createMocks('POST', {}, { resourceType: 'Observation' });
      await patientIndexHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        resourceType: 'OperationOutcome',
        issue: expect.arrayContaining([
          expect.objectContaining({
            severity: 'error',
          }),
        ]),
      }));
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

      const { req, res } = createMocks('GET', { id: 'pat-123' });
      await patientIdHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        resourceType: 'Patient',
        id: 'pat-123',
      }));
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', expect.stringContaining('application/fhir+json'));
      expect(res.setHeader).toHaveBeenCalledWith('ETag', expect.any(String));
    });

    it('should return 404 for non-existent patient', async () => {
      (mockPrisma.patient.findUnique as jest.Mock).mockResolvedValue(null);

      const { req, res } = createMocks('GET', { id: 'nonexistent' });
      await patientIdHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        resourceType: 'OperationOutcome',
      }));
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

      const { req, res } = createMocks('PUT', { id: 'pat-123' }, fhirUpdate);
      await patientIdHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        resourceType: 'Patient',
      }));
    });
  });

  describe('DELETE /api/fhir/Patient/[id]', () => {
    it('should delete a patient', async () => {
      (mockPrisma.patient.delete as jest.Mock).mockResolvedValue({});

      const { req, res } = createMocks('DELETE', { id: 'pat-123' });
      await patientIdHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.end).toHaveBeenCalled();
    });
  });
});