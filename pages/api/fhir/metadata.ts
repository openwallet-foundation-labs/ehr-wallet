import { NextApiRequest, NextApiResponse } from 'next';

/**
 * FHIR Capability Statement
 * GET /api/fhir/metadata
 *
 * Describes the server's capabilities, supported resources, and operations
 * Required by FHIR specification for all FHIR servers
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  const baseUrl = getBaseUrl(req);

  const capabilityStatement = {
    resourceType: 'CapabilityStatement',
    status: 'active',
    date: new Date().toISOString(),
    kind: 'instance',
    software: {
      name: 'EHR Wallet FHIR Server',
      version: '1.0.0',
    },
    implementation: {
      description: 'Blockchain-based patient health wallet with FHIR R4 support',
      url: baseUrl,
    },
    fhirVersion: '4.0.1',
    format: [
      'application/fhir+json',
      'json',
    ],
    rest: [
      {
        mode: 'server',
        documentation: 'RESTful FHIR API for patient health records',
        security: {
          description: 'Blockchain-based access control with optional OAuth 2.0',
          cors: true,
        },
        resource: [
          {
            type: 'Patient',
            profile: 'http://hl7.org/fhir/StructureDefinition/Patient',
            documentation: 'Patient demographics and administrative information',
            interaction: [
              { code: 'read', documentation: 'Read a patient resource' },
              { code: 'search-type', documentation: 'Search for patients' },
              { code: 'create', documentation: 'Create a new patient' },
              { code: 'update', documentation: 'Update an existing patient' },
              { code: 'delete', documentation: 'Delete a patient' },
            ],
            searchParam: [
              {
                name: 'name',
                type: 'string',
                documentation: 'Search by patient name',
              },
              {
                name: 'birthdate',
                type: 'date',
                documentation: 'Search by date of birth',
              },
              {
                name: 'gender',
                type: 'token',
                documentation: 'Search by gender',
              },
              {
                name: 'identifier',
                type: 'token',
                documentation: 'Search by patient identifier',
              },
            ],
            operation: [
              {
                name: '$everything',
                definition: `${baseUrl}/OperationDefinition/Patient-everything`,
                documentation: 'Retrieve all resources related to a patient',
              },
            ],
          },
          {
            type: 'Encounter',
            profile: 'http://hl7.org/fhir/StructureDefinition/Encounter',
            documentation: 'Patient visits and encounters',
            interaction: [
              { code: 'read', documentation: 'Read an encounter' },
              { code: 'search-type', documentation: 'Search for encounters' },
            ],
            searchParam: [
              {
                name: 'patient',
                type: 'reference',
                documentation: 'Search by patient reference',
              },
              {
                name: 'date',
                type: 'date',
                documentation: 'Search by encounter date',
              },
            ],
          },
          {
            type: 'Appointment',
            profile: 'http://hl7.org/fhir/StructureDefinition/Appointment',
            documentation: 'Patient appointments',
            interaction: [
              { code: 'read', documentation: 'Read an appointment' },
              { code: 'search-type', documentation: 'Search for appointments' },
              { code: 'create', documentation: 'Create a new appointment' },
              { code: 'update', documentation: 'Update an appointment' },
            ],
            searchParam: [
              {
                name: 'patient',
                type: 'reference',
                documentation: 'Search by patient reference',
              },
              {
                name: 'date',
                type: 'date',
                documentation: 'Search by appointment date',
              },
              {
                name: 'status',
                type: 'token',
                documentation: 'Search by appointment status',
              },
            ],
          },
          {
            type: 'Practitioner',
            profile: 'http://hl7.org/fhir/StructureDefinition/Practitioner',
            documentation: 'Healthcare providers',
            interaction: [
              { code: 'read', documentation: 'Read a practitioner' },
              { code: 'search-type', documentation: 'Search for practitioners' },
            ],
            searchParam: [
              {
                name: 'name',
                type: 'string',
                documentation: 'Search by practitioner name',
              },
            ],
          },
          {
            type: 'Observation',
            profile: 'http://hl7.org/fhir/StructureDefinition/Observation',
            documentation: 'Lab results, vitals, and other observations',
            interaction: [
              { code: 'read', documentation: 'Read an observation' },
              { code: 'search-type', documentation: 'Search for observations' },
            ],
            searchParam: [
              {
                name: 'patient',
                type: 'reference',
                documentation: 'Search by patient reference',
              },
              {
                name: 'code',
                type: 'token',
                documentation: 'Search by observation code (LOINC)',
              },
              {
                name: 'date',
                type: 'date',
                documentation: 'Search by observation date',
              },
            ],
          },
          {
            type: 'Condition',
            profile: 'http://hl7.org/fhir/StructureDefinition/Condition',
            documentation: 'Patient diagnoses and conditions',
            interaction: [
              { code: 'read', documentation: 'Read a condition' },
              { code: 'search-type', documentation: 'Search for conditions' },
            ],
            searchParam: [
              {
                name: 'patient',
                type: 'reference',
                documentation: 'Search by patient reference',
              },
              {
                name: 'code',
                type: 'token',
                documentation: 'Search by condition code (SNOMED CT)',
              },
            ],
          },
          {
            type: 'MedicationRequest',
            profile: 'http://hl7.org/fhir/StructureDefinition/MedicationRequest',
            documentation: 'Patient medication prescriptions',
            interaction: [
              { code: 'read', documentation: 'Read a medication request' },
              { code: 'search-type', documentation: 'Search for medication requests' },
            ],
            searchParam: [
              {
                name: 'patient',
                type: 'reference',
                documentation: 'Search by patient reference',
              },
              {
                name: 'status',
                type: 'token',
                documentation: 'Search by medication request status',
              },
            ],
          },
          {
            type: 'DocumentReference',
            profile: 'http://hl7.org/fhir/StructureDefinition/DocumentReference',
            documentation: 'Medical documents and imaging stored on IPFS',
            interaction: [
              { code: 'read', documentation: 'Read a document reference' },
              { code: 'search-type', documentation: 'Search for documents' },
              { code: 'create', documentation: 'Create a new document reference' },
            ],
            searchParam: [
              {
                name: 'patient',
                type: 'reference',
                documentation: 'Search by patient reference',
              },
              {
                name: 'type',
                type: 'token',
                documentation: 'Search by document type',
              },
            ],
          },
        ],
      },
    ],
  };

  res.setHeader('Content-Type', 'application/fhir+json; charset=utf-8');
  return res.status(200).json(capabilityStatement);
}

function getBaseUrl(req: NextApiRequest): string {
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host;
  return `${protocol}://${host}/api/fhir`;
}
