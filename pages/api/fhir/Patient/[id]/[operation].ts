import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { createPatientSummaryBundle } from '@/lib/fhir/converters';
import { FHIROperationOutcome } from '@/lib/fhir/types';

const prisma = new PrismaClient();

/**
 * FHIR Patient Operations Endpoint
 * GET /api/fhir/Patient/[id]/$everything - Get patient summary with all related resources
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id, operation } = req.query;

  if (typeof id !== 'string' || typeof operation !== 'string') {
    return res.status(400).json(createOperationOutcome('error', 'Invalid request parameters'));
  }

  try {
    switch (operation) {
      case '$everything':
        return await getEverything(id, req, res);
      default:
        return res.status(404).json(createOperationOutcome('error', `Operation ${operation} not found`));
    }
  } catch (error) {
    console.error('FHIR Patient operation error:', error);
    return res.status(500).json(createOperationOutcome('error', 'Internal server error', String(error)));
  }
}

/**
 * Get complete patient summary ($everything operation)
 * Returns a Bundle containing the patient and all related resources
 */
async function getEverything(
  id: string,
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Fetch patient
  const patient = await prisma.patient.findUnique({
    where: { id },
  });

  if (!patient) {
    return res.status(404).json(createOperationOutcome('error', 'Patient not found'));
  }

  // Fetch related resources
  const [visits, appointments] = await Promise.all([
    prisma.visit.findMany({
      where: { patientId: id },
      orderBy: { date: 'desc' },
    }),
    prisma.appointment.findMany({
      where: { patientId: id },
      orderBy: { startTime: 'desc' },
    }),
  ]);

  const baseUrl = getBaseUrl(req);
  const bundle = createPatientSummaryBundle(patient, visits, appointments, baseUrl);

  res.setHeader('Content-Type', 'application/fhir+json; charset=utf-8');
  return res.status(200).json(bundle);
}

function getBaseUrl(req: NextApiRequest): string {
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host;
  return `${protocol}://${host}/api/fhir`;
}

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
