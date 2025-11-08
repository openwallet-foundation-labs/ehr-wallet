import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { patientToFHIR, fhirToPatient } from '@/lib/fhir/converters';
import { FHIROperationOutcome } from '@/lib/fhir/types';

const prisma = new PrismaClient();

/**
 * FHIR Patient Resource Endpoint
 * GET /api/fhir/Patient/[id] - Read a specific patient
 * PUT /api/fhir/Patient/[id] - Update a specific patient
 * DELETE /api/fhir/Patient/[id] - Delete a specific patient
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json(createOperationOutcome('error', 'Invalid patient ID'));
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getPatient(id, req, res);
      case 'PUT':
        return await updatePatient(id, req, res);
      case 'DELETE':
        return await deletePatient(id, req, res);
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json(createOperationOutcome('error', `Method ${req.method} not allowed`));
    }
  } catch (error) {
    console.error('FHIR Patient endpoint error:', error);
    return res.status(500).json(createOperationOutcome('error', 'Internal server error', String(error)));
  }
}

/**
 * Read a specific patient (GET)
 */
async function getPatient(
  id: string,
  req: NextApiRequest,
  res: NextApiResponse
) {
  const patient = await prisma.patient.findUnique({
    where: { id },
  });

  if (!patient) {
    return res.status(404).json(createOperationOutcome('error', 'Patient not found'));
  }

  const baseUrl = getBaseUrl(req);
  const fhirPatient = patientToFHIR(patient, baseUrl);

  // Set FHIR-specific headers
  res.setHeader('Content-Type', 'application/fhir+json; charset=utf-8');
  res.setHeader('ETag', `W/"${fhirPatient.meta?.versionId || '1'}"`);
  res.setHeader('Last-Modified', new Date(patient.updatedAt).toUTCString());

  return res.status(200).json(fhirPatient);
}

/**
 * Update a specific patient (PUT)
 */
async function updatePatient(
  id: string,
  req: NextApiRequest,
  res: NextApiResponse
) {
  const fhirPatient = req.body;

  // Validate resource type
  if (fhirPatient.resourceType !== 'Patient') {
    return res.status(400).json(createOperationOutcome('error', 'Invalid resource type'));
  }

  // Convert FHIR patient to internal format
  const patientData = fhirToPatient(fhirPatient);

  // Check if patient exists
  const existingPatient = await prisma.patient.findUnique({
    where: { id },
  });

  if (!existingPatient) {
    return res.status(404).json(createOperationOutcome('error', 'Patient not found'));
  }

  // Update patient
  const updatedPatient = await prisma.patient.update({
    where: { id },
    data: {
      name: patientData.name || existingPatient.name,
      dob: patientData.dob || existingPatient.dob,
      gender: patientData.gender || existingPatient.gender,
      phone: patientData.phone !== undefined ? patientData.phone : existingPatient.phone,
      email: patientData.email !== undefined ? patientData.email : existingPatient.email,
      address: patientData.address !== undefined ? patientData.address : existingPatient.address,
    },
  });

  const baseUrl = getBaseUrl(req);
  const updatedFhirPatient = patientToFHIR(updatedPatient, baseUrl);

  res.setHeader('Content-Type', 'application/fhir+json; charset=utf-8');
  res.setHeader('Last-Modified', new Date(updatedPatient.updatedAt).toUTCString());

  return res.status(200).json(updatedFhirPatient);
}

/**
 * Delete a specific patient (DELETE)
 */
async function deletePatient(
  id: string,
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    await prisma.patient.delete({
      where: { id },
    });

    return res.status(204).end();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json(createOperationOutcome('error', 'Patient not found'));
    }
    throw error;
  }
}

/**
 * Helper: Get base URL from request
 */
function getBaseUrl(req: NextApiRequest): string {
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host;
  return `${protocol}://${host}/api/fhir`;
}

/**
 * Helper: Create FHIR OperationOutcome
 */
function createOperationOutcome(
  severity: 'fatal' | 'error' | 'warning' | 'information',
  message: string,
  diagnostics?: string
): FHIROperationOutcome {
  return {
    resourceType: 'OperationOutcome',
    issue: [
      {
        severity,
        code: 'processing',
        diagnostics: diagnostics || message,
        details: {
          text: message,
        },
      },
    ],
  };
}
