import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { visitToFHIREncounter, createFHIRBundle } from '@/lib/fhir/converters';
import { FHIROperationOutcome } from '@/lib/fhir/types';

const prisma = new PrismaClient();

/**
 * FHIR Encounter (Visit) Collection Endpoint
 * GET /api/fhir/Encounter - Search encounters
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        return await searchEncounters(req, res);
      default:
        res.setHeader('Allow', ['GET']);
        return res.status(405).json(createOperationOutcome('error', `Method ${req.method} not allowed`));
    }
  } catch (error) {
    console.error('FHIR Encounter endpoint error:', error);
    return res.status(500).json(createOperationOutcome('error', 'Internal server error', String(error)));
  }
}

/**
 * Search encounters (visits)
 * Supports FHIR search parameters:
 * - patient: Search by patient ID
 * - date: Search by encounter date
 * - _count: Number of results (default 20)
 */
async function searchEncounters(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    patient,
    date,
    _count = '20',
    _offset = '0',
  } = req.query;

  const where: any = {};

  if (patient && typeof patient === 'string') {
    where.patientId = patient.replace('Patient/', '');
  }

  if (date && typeof date === 'string') {
    const searchDate = new Date(date);
    where.date = {
      gte: new Date(searchDate.setHours(0, 0, 0, 0)),
      lte: new Date(searchDate.setHours(23, 59, 59, 999)),
    };
  }

  const take = parseInt(_count as string, 10);
  const skip = parseInt(_offset as string, 10);

  const [visits, total] = await Promise.all([
    prisma.visit.findMany({
      where,
      take,
      skip,
      orderBy: {
        date: 'desc',
      },
    }),
    prisma.visit.count({ where }),
  ]);

  const baseUrl = getBaseUrl(req);
  const fhirEncounters = visits.map(v => visitToFHIREncounter(v));
  const bundle = createFHIRBundle(fhirEncounters, 'searchset', baseUrl);
  bundle.total = total;

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
