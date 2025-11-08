import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { patientToFHIR, fhirToPatient, createFHIRBundle } from '@/lib/fhir/converters';
import { FHIROperationOutcome, FHIRBundle } from '@/lib/fhir/types';

const prisma = new PrismaClient();

/**
 * FHIR Patient Collection Endpoint
 * GET /api/fhir/Patient - Search patients
 * POST /api/fhir/Patient - Create a new patient
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        return await searchPatients(req, res);
      case 'POST':
        return await createPatient(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json(createOperationOutcome('error', `Method ${req.method} not allowed`));
    }
  } catch (error) {
    console.error('FHIR Patient endpoint error:', error);
    return res.status(500).json(createOperationOutcome('error', 'Internal server error', String(error)));
  }
}

/**
 * Search patients (GET)
 * Supports FHIR search parameters:
 * - name: Search by patient name
 * - birthdate: Search by date of birth
 * - gender: Search by gender
 * - identifier: Search by patient ID
 * - _count: Number of results to return (default 20)
 * - _offset: Offset for pagination (default 0)
 */
async function searchPatients(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    name,
    birthdate,
    gender,
    identifier,
    _count = '20',
    _offset = '0',
  } = req.query;

  // Build where clause
  const where: any = {};

  if (name && typeof name === 'string') {
    where.name = {
      contains: name,
      mode: 'insensitive',
    };
  }

  if (birthdate && typeof birthdate === 'string') {
    where.dob = birthdate;
  }

  if (gender && typeof gender === 'string') {
    where.gender = {
      equals: gender,
      mode: 'insensitive',
    };
  }

  if (identifier && typeof identifier === 'string') {
    where.OR = [
      { patientId: identifier },
      { id: identifier },
    ];
  }

  const take = parseInt(_count as string, 10);
  const skip = parseInt(_offset as string, 10);

  // Execute search
  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      take,
      skip,
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.patient.count({ where }),
  ]);

  const baseUrl = getBaseUrl(req);
  const fhirPatients = patients.map(p => patientToFHIR(p, baseUrl));
  const bundle = createFHIRBundle(fhirPatients, 'searchset', baseUrl);
  bundle.total = total;

  // Add pagination links
  const currentUrl = `${baseUrl}/Patient`;
  bundle.link = [
    {
      relation: 'self',
      url: buildSearchUrl(currentUrl, req.query),
    },
  ];

  if (skip + take < total) {
    bundle.link.push({
      relation: 'next',
      url: buildSearchUrl(currentUrl, { ...req.query, _offset: String(skip + take) }),
    });
  }

  if (skip > 0) {
    bundle.link.push({
      relation: 'previous',
      url: buildSearchUrl(currentUrl, { ...req.query, _offset: String(Math.max(0, skip - take)) }),
    });
  }

  res.setHeader('Content-Type', 'application/fhir+json; charset=utf-8');
  return res.status(200).json(bundle);
}

/**
 * Create a new patient (POST)
 */
async function createPatient(
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

  // Validate required fields
  if (!patientData.name || !patientData.dob || !patientData.gender) {
    return res.status(400).json(createOperationOutcome('error', 'Missing required fields: name, birthDate, gender'));
  }

  // Generate patient ID if not provided
  if (!patientData.patientId) {
    const count = await prisma.patient.count();
    patientData.patientId = `PAT-${String(count + 1).padStart(6, '0')}`;
  }

  // Create patient
  const createdPatient = await prisma.patient.create({
    data: {
      patientId: patientData.patientId!,
      name: patientData.name,
      dob: patientData.dob,
      gender: patientData.gender,
      phone: patientData.phone,
      email: patientData.email,
      address: patientData.address,
    },
  });

  const baseUrl = getBaseUrl(req);
  const createdFhirPatient = patientToFHIR(createdPatient, baseUrl);

  res.setHeader('Content-Type', 'application/fhir+json; charset=utf-8');
  res.setHeader('Location', `${baseUrl}/Patient/${createdPatient.id}`);

  return res.status(201).json(createdFhirPatient);
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
 * Helper: Build search URL with query parameters
 */
function buildSearchUrl(baseUrl: string, params: any): string {
  const queryString = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
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
