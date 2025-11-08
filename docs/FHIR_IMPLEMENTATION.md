# FHIR R4 Implementation Guide

This document describes the FHIR R4 (Fast Healthcare Interoperability Resources) implementation in the EHR Wallet application.

## Table of Contents

1. [Overview](#overview)
2. [Supported Resources](#supported-resources)
3. [API Endpoints](#api-endpoints)
4. [Usage Examples](#usage-examples)
5. [Blockchain Integration](#blockchain-integration)
6. [Interoperability](#interoperability)
7. [Testing](#testing)

## Overview

The EHR Wallet now supports HL7 FHIR R4, the international standard for healthcare data exchange. This enables:

- **Interoperability**: Exchange data with other FHIR-compliant systems (Epic, Cerner, etc.)
- **Standardization**: Use industry-standard terminology (LOINC, SNOMED CT, ICD-10)
- **Blockchain Integration**: Store FHIR resource references on Ethereum with IPFS
- **Patient Control**: Patients can share standardized health data via blockchain access grants

## Architecture

```
┌─────────────────┐
│  FHIR Client    │
│ (Epic/Cerner)   │
└────────┬────────┘
         │ FHIR R4 API
         ▼
┌─────────────────────────────────────────┐
│      EHR Wallet FHIR Server             │
│  ┌────────────────────────────────────┐ │
│  │  API Endpoints (/api/fhir/*)       │ │
│  │  - Patient, Encounter, Appointment │ │
│  │  - Observation, Condition, etc.    │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │  Converters (lib/fhir/converters) │ │
│  │  - FHIR ⟷ Internal Models         │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │  Validation (lib/fhir/validation) │ │
│  └────────────────────────────────────┘ │
└──────────────┬──────────────────────────┘
               │
      ┌────────┴────────┐
      ▼                 ▼
┌──────────┐    ┌──────────────┐
│ Database │    │  Blockchain  │
│ (Prisma) │    │  + IPFS      │
└──────────┘    └──────────────┘
```

## Supported Resources

### Fully Implemented

- **Patient** - Demographics and administrative information
- **Encounter** - Patient visits and encounters
- **Appointment** - Scheduled appointments
- **Practitioner** - Healthcare providers

### Defined Types (Ready for Implementation)

- **Observation** - Lab results, vitals, measurements
- **Condition** - Diagnoses and medical conditions
- **MedicationRequest** - Prescriptions
- **DocumentReference** - Medical documents (PDFs, images on IPFS)
- **Bundle** - Collection of resources

## API Endpoints

### Base URL

```
http://localhost:3000/api/fhir
```

### Capability Statement

**GET** `/api/fhir/metadata`

Returns the server's capability statement describing supported resources and operations.

```bash
curl http://localhost:3000/api/fhir/metadata
```

### Patient Resource

#### Search Patients

**GET** `/api/fhir/Patient`

Query parameters:
- `name` - Search by patient name
- `birthdate` - Search by date of birth (YYYY-MM-DD)
- `gender` - Search by gender (male|female|other|unknown)
- `identifier` - Search by patient ID
- `_count` - Results per page (default: 20)
- `_offset` - Pagination offset (default: 0)

```bash
# Search by name
curl "http://localhost:3000/api/fhir/Patient?name=John"

# Search with pagination
curl "http://localhost:3000/api/fhir/Patient?_count=10&_offset=0"
```

**Response:**
```json
{
  "resourceType": "Bundle",
  "type": "searchset",
  "total": 42,
  "link": [
    {
      "relation": "self",
      "url": "http://localhost:3000/api/fhir/Patient?name=John"
    },
    {
      "relation": "next",
      "url": "http://localhost:3000/api/fhir/Patient?name=John&_offset=20"
    }
  ],
  "entry": [
    {
      "fullUrl": "http://localhost:3000/api/fhir/Patient/pat-123",
      "resource": {
        "resourceType": "Patient",
        "id": "pat-123",
        "meta": {
          "versionId": "1",
          "lastUpdated": "2024-01-15T12:00:00Z",
          "profile": ["http://hl7.org/fhir/StructureDefinition/Patient"]
        },
        "identifier": [
          {
            "use": "official",
            "system": "urn:ehr-wallet:patient-id",
            "value": "PAT-000001"
          }
        ],
        "active": true,
        "name": [
          {
            "use": "official",
            "text": "John Doe",
            "family": "Doe",
            "given": ["John"]
          }
        ],
        "telecom": [
          {
            "system": "phone",
            "value": "+1234567890",
            "use": "mobile"
          }
        ],
        "gender": "male",
        "birthDate": "1990-05-15"
      }
    }
  ]
}
```

#### Read Patient

**GET** `/api/fhir/Patient/{id}`

```bash
curl http://localhost:3000/api/fhir/Patient/pat-123
```

#### Create Patient

**POST** `/api/fhir/Patient`

```bash
curl -X POST http://localhost:3000/api/fhir/Patient \
  -H "Content-Type: application/fhir+json" \
  -d '{
    "resourceType": "Patient",
    "name": [
      {
        "text": "Jane Smith",
        "given": ["Jane"],
        "family": "Smith"
      }
    ],
    "gender": "female",
    "birthDate": "1985-03-20",
    "telecom": [
      {
        "system": "email",
        "value": "jane.smith@example.com"
      }
    ]
  }'
```

#### Update Patient

**PUT** `/api/fhir/Patient/{id}`

```bash
curl -X PUT http://localhost:3000/api/fhir/Patient/pat-123 \
  -H "Content-Type: application/fhir+json" \
  -d '{
    "resourceType": "Patient",
    "id": "pat-123",
    "telecom": [
      {
        "system": "phone",
        "value": "+1987654321"
      }
    ]
  }'
```

#### Delete Patient

**DELETE** `/api/fhir/Patient/{id}`

```bash
curl -X DELETE http://localhost:3000/api/fhir/Patient/pat-123
```

### Patient Operations

#### $everything - Get Patient Summary

**GET** `/api/fhir/Patient/{id}/$everything`

Returns a Bundle containing the patient and all related resources (encounters, appointments, etc.).

```bash
curl http://localhost:3000/api/fhir/Patient/pat-123/\$everything
```

**Response:**
```json
{
  "resourceType": "Bundle",
  "type": "collection",
  "total": 5,
  "entry": [
    {
      "resource": {
        "resourceType": "Patient",
        "id": "pat-123",
        ...
      }
    },
    {
      "resource": {
        "resourceType": "Encounter",
        "id": "enc-456",
        "subject": {
          "reference": "Patient/pat-123"
        },
        ...
      }
    },
    {
      "resource": {
        "resourceType": "Appointment",
        "id": "appt-789",
        ...
      }
    }
  ]
}
```

### Encounter Resource

#### Search Encounters

**GET** `/api/fhir/Encounter`

Query parameters:
- `patient` - Filter by patient (e.g., `Patient/pat-123`)
- `date` - Filter by encounter date
- `_count` - Results per page

```bash
curl "http://localhost:3000/api/fhir/Encounter?patient=Patient/pat-123"
```

## Usage Examples

### Example 1: Register a New Patient

```typescript
import { FHIRPatient } from '@/lib/fhir/types';

const newPatient: FHIRPatient = {
  resourceType: 'Patient',
  name: [
    {
      use: 'official',
      given: ['Alice'],
      family: 'Johnson',
    },
  ],
  gender: 'female',
  birthDate: '1992-07-10',
  telecom: [
    {
      system: 'email',
      value: 'alice.johnson@example.com',
      use: 'home',
    },
    {
      system: 'phone',
      value: '+1555123456',
      use: 'mobile',
    },
  ],
  address: [
    {
      use: 'home',
      type: 'physical',
      line: ['456 Oak Avenue'],
      city: 'Springfield',
      state: 'IL',
      postalCode: '62701',
      country: 'USA',
    },
  ],
};

// Create patient via API
const response = await fetch('/api/fhir/Patient', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/fhir+json',
  },
  body: JSON.stringify(newPatient),
});

const createdPatient = await response.json();
console.log('Created patient:', createdPatient.id);
```

### Example 2: Convert Internal Patient to FHIR

```typescript
import { patientToFHIR } from '@/lib/fhir/converters';
import { prisma } from '@/lib/prisma';

// Fetch patient from database
const patient = await prisma.patient.findUnique({
  where: { id: 'pat-123' },
});

// Convert to FHIR format
const fhirPatient = patientToFHIR(patient, 'http://localhost:3000/api/fhir');

// Share via IPFS + Blockchain
const bundle = {
  resourceType: 'Bundle',
  type: 'document',
  entry: [{ resource: fhirPatient }],
};

// Upload to IPFS (encrypted)
const ipfsCid = await uploadToIPFS(JSON.stringify(bundle));

// Create blockchain access grant
const accessId = await createFHIRAccessGrant(ipfsCid, fhirPatient);
```

### Example 3: Validate FHIR Resources

```typescript
import { validatePatient } from '@/lib/fhir/validation';

const patient: FHIRPatient = {
  resourceType: 'Patient',
  birthDate: '1990-13-45', // Invalid date
  gender: 'invalid', // Invalid gender
};

const result = validatePatient(patient);

if (!result.valid) {
  console.error('Validation errors:');
  result.errors.forEach(error => {
    console.error(`- ${error.path}: ${error.message}`);
  });
}
// Output:
// - birthDate: Invalid birthDate format. Must be YYYY-MM-DD
// - gender: Invalid gender value
```

## Blockchain Integration

### FHIR-Enhanced Smart Contract

The `FHIRAccessControl.sol` contract extends the base access control with FHIR-specific metadata:

```solidity
// Create FHIR access grant
function createFHIRAccess(
    string memory ipfsCid,           // IPFS CID of FHIR Bundle
    uint256 durationSeconds,          // Access duration
    bytes32 passwordHash,             // Optional password
    string memory fhirResourceType,   // e.g., "Bundle"
    string memory fhirResourceId,     // FHIR resource ID
    string memory fhirVersion,        // e.g., "4.0.1"
    string[] memory resourceTypes     // Resources in Bundle
) external returns (bytes32 accessId);
```

### Sharing FHIR Data on Blockchain

```typescript
import { ethers } from 'ethers';
import { createPatientSummaryBundle } from '@/lib/fhir/converters';

// 1. Create FHIR Bundle
const bundle = createPatientSummaryBundle(patient, visits, appointments);

// 2. Encrypt and upload to IPFS
const encrypted = await encryptData(JSON.stringify(bundle), password);
const ipfsCid = await uploadToIPFS(encrypted);

// 3. Create blockchain access grant
const contract = new ethers.Contract(contractAddress, abi, signer);

const tx = await contract.createFHIRAccess(
  ipfsCid,
  86400, // 24 hours
  ethers.utils.id(password), // Password hash
  'Bundle',
  patient.id,
  '4.0.1',
  ['Patient', 'Encounter', 'Appointment']
);

const receipt = await tx.wait();
const accessId = receipt.events[0].args.accessId;

console.log('Share link:', `https://ehr-wallet.app/access/${accessId}`);
```

## Interoperability

### Connecting to Epic/Cerner

FHIR enables integration with major EHR systems:

```typescript
// Import data from Epic FHIR API
const epicResponse = await fetch(
  'https://fhir.epic.com/Patient/123',
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/fhir+json',
    },
  }
);

const epicPatient = await epicResponse.json();

// Convert to internal format
const internalPatient = fhirToPatient(epicPatient);

// Save to local database
await prisma.patient.create({
  data: internalPatient,
});
```

### Using Standard Terminologies

#### LOINC (Lab Observations)

```typescript
import { FHIRObservation } from '@/lib/fhir/types';

const bloodPressure: FHIRObservation = {
  resourceType: 'Observation',
  status: 'final',
  code: {
    coding: [
      {
        system: 'http://loinc.org',
        code: '85354-9',
        display: 'Blood pressure panel',
      },
    ],
  },
  subject: { reference: 'Patient/pat-123' },
  effectiveDateTime: '2024-03-20T10:30:00Z',
  component: [
    {
      code: {
        coding: [
          {
            system: 'http://loinc.org',
            code: '8480-6',
            display: 'Systolic blood pressure',
          },
        ],
      },
      valueQuantity: {
        value: 120,
        unit: 'mmHg',
        system: 'http://unitsofmeasure.org',
        code: 'mm[Hg]',
      },
    },
    {
      code: {
        coding: [
          {
            system: 'http://loinc.org',
            code: '8462-4',
            display: 'Diastolic blood pressure',
          },
        ],
      },
      valueQuantity: {
        value: 80,
        unit: 'mmHg',
        system: 'http://unitsofmeasure.org',
        code: 'mm[Hg]',
      },
    },
  ],
};
```

#### SNOMED CT (Conditions)

```typescript
import { FHIRCondition } from '@/lib/fhir/types';

const diabetes: FHIRCondition = {
  resourceType: 'Condition',
  clinicalStatus: {
    coding: [
      {
        system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
        code: 'active',
      },
    ],
  },
  verificationStatus: {
    coding: [
      {
        system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
        code: 'confirmed',
      },
    ],
  },
  code: {
    coding: [
      {
        system: 'http://snomed.info/sct',
        code: '44054006',
        display: 'Type 2 diabetes mellitus',
      },
    ],
  },
  subject: { reference: 'Patient/pat-123' },
  onsetDateTime: '2020-05-15',
};
```

## Testing

### Run FHIR Tests

```bash
# Run all FHIR tests
npm test -- --testPathPattern=fhir

# Run converter tests
npm test -- __tests__/lib/fhir/converters.test.ts

# Run API tests
npm test -- __tests__/api/fhir/patient.test.ts
```

### Manual API Testing

```bash
# Test capability statement
curl http://localhost:3000/api/fhir/metadata | jq

# Create a test patient
curl -X POST http://localhost:3000/api/fhir/Patient \
  -H "Content-Type: application/fhir+json" \
  -d @test-patient.json

# Search patients
curl "http://localhost:3000/api/fhir/Patient?name=Test" | jq '.entry[].resource.name'

# Get patient summary
curl http://localhost:3000/api/fhir/Patient/pat-123/\$everything | jq
```

## Best Practices

### 1. Always Validate Resources

```typescript
import { validateResource } from '@/lib/fhir/validation';

const result = validateResource(fhirPatient);
if (!result.valid) {
  throw new Error(result.errors.map(e => e.message).join(', '));
}
```

### 2. Use Proper FHIR URLs

```typescript
// Reference other resources with full URLs
const encounter: FHIREncounter = {
  resourceType: 'Encounter',
  subject: {
    reference: 'Patient/pat-123',  // Relative reference
    type: 'Patient',
  },
};

// Or with full URL
const encounterFull: FHIREncounter = {
  resourceType: 'Encounter',
  subject: {
    reference: 'http://localhost:3000/api/fhir/Patient/pat-123',
  },
};
```

### 3. Include Metadata

```typescript
const patient: FHIRPatient = {
  resourceType: 'Patient',
  meta: {
    versionId: '1',
    lastUpdated: new Date().toISOString(),
    profile: ['http://hl7.org/fhir/StructureDefinition/Patient'],
    tag: [
      {
        system: 'http://ehr-wallet.local/tags',
        code: 'blockchain-enabled',
        display: 'Blockchain Enabled',
      },
    ],
  },
  // ... other fields
};
```

### 4. Handle Pagination

```typescript
async function getAllPatients() {
  const allPatients = [];
  let offset = 0;
  const count = 20;

  while (true) {
    const response = await fetch(
      `/api/fhir/Patient?_count=${count}&_offset=${offset}`
    );
    const bundle = await response.json();

    allPatients.push(...bundle.entry.map(e => e.resource));

    if (offset + count >= bundle.total) {
      break;
    }

    offset += count;
  }

  return allPatients;
}
```

## References

- [HL7 FHIR R4 Specification](https://www.hl7.org/fhir/R4/)
- [FHIR Patient Resource](https://www.hl7.org/fhir/R4/patient.html)
- [LOINC Codes](https://loinc.org/)
- [SNOMED CT](https://www.snomed.org/)
- [FHIR RESTful API](https://www.hl7.org/fhir/R4/http.html)

## Next Steps

To further improve FHIR support:

1. **Implement remaining resources**: Observation, Condition, MedicationRequest
2. **Add SMART on FHIR**: OAuth 2.0 authentication for third-party apps
3. **FHIR Bulk Data Export**: $export operation for data portability
4. **Terminology Server**: Integrate with FHIR terminology services
5. **CDS Hooks**: Clinical decision support integration
6. **FHIR Subscriptions**: Real-time notifications for resource changes

## Support

For questions or issues with FHIR implementation:

- Open an issue on GitHub
- Check the [FHIR Chat](https://chat.fhir.org/)
- Review HL7 FHIR documentation
