# FHIR Library

This directory contains the FHIR R4 implementation for the EHR Wallet application.

## Files

### `types.ts`
Complete FHIR R4 type definitions including:
- Base data types (Identifier, CodeableConcept, HumanName, etc.)
- Resource types (Patient, Encounter, Appointment, Observation, Condition, etc.)
- Bundle types for collections
- OperationOutcome for error handling

### `converters.ts`
Bidirectional converters between internal Prisma models and FHIR resources:
- `patientToFHIR()` / `fhirToPatient()`
- `visitToFHIREncounter()` / `fhirEncounterToVisit()`
- `appointmentToFHIR()` / `fhirToAppointment()`
- `providerToFHIRPractitioner()` / `fhirPractitionerToProvider()`
- `createFHIRBundle()` - Bundle multiple resources
- `createPatientSummaryBundle()` - Complete patient record

### `validation.ts`
FHIR resource validation utilities:
- `validatePatient()` - Validate Patient resources
- `validateEncounter()` - Validate Encounter resources
- `validateAppointment()` - Validate Appointment resources
- `validateObservation()` - Validate Observation resources
- `validateResource()` - Generic validation dispatcher
- `validationErrorsToOperationOutcome()` - Convert errors to FHIR OperationOutcome

## Quick Start

```typescript
import { patientToFHIR, validatePatient } from '@/lib/fhir';

// Convert internal patient to FHIR
const fhirPatient = patientToFHIR(patient);

// Validate FHIR resource
const result = validatePatient(fhirPatient);
if (!result.valid) {
  console.error('Validation failed:', result.errors);
}
```

## API Endpoints

FHIR API endpoints are located in `/pages/api/fhir/`:

- `GET /api/fhir/metadata` - Capability statement
- `GET /api/fhir/Patient` - Search patients
- `POST /api/fhir/Patient` - Create patient
- `GET /api/fhir/Patient/{id}` - Read patient
- `PUT /api/fhir/Patient/{id}` - Update patient
- `DELETE /api/fhir/Patient/{id}` - Delete patient
- `GET /api/fhir/Patient/{id}/$everything` - Patient summary
- `GET /api/fhir/Encounter` - Search encounters

## Blockchain Integration

The `FHIRAccessControl.sol` smart contract stores FHIR resource references with metadata:

```solidity
contract.createFHIRAccess(
  ipfsCid,
  duration,
  passwordHash,
  "Bundle",
  patientId,
  "4.0.1",
  ["Patient", "Encounter", "Appointment"]
);
```

## Documentation

See `/docs/FHIR_IMPLEMENTATION.md` for complete documentation including:
- Architecture overview
- Usage examples
- Interoperability guide
- Best practices
- Testing guide

## Standards Compliance

This implementation follows:
- **HL7 FHIR R4** (v4.0.1)
- **FHIR RESTful API** specification
- **LOINC** for observations
- **SNOMED CT** for conditions
- **ICD-10** for diagnoses

## Testing

Tests are located in `/__tests__/lib/fhir/`:

```bash
npm test -- --testPathPattern=fhir
```
