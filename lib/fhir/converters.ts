/**
 * FHIR Converters - Bidirectional conversion between internal models and FHIR resources
 */

import {
  FHIRPatient,
  FHIREncounter,
  FHIRAppointment,
  FHIRPractitioner,
  FHIRDocumentReference,
  FHIRBundle,
  HumanName,
  ContactPoint,
  Address,
  Identifier,
  Reference,
  CodeableConcept,
  Annotation,
  Meta,
} from './types';

// Prisma types (from our schema)
interface PrismaPatient {
  id: string;
  patientId: string;
  name: string;
  dob: string;
  gender: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PrismaVisit {
  id: string;
  date: Date;
  notes?: string | null;
  patientId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PrismaAppointment {
  id: string;
  title: string;
  patientId: string;
  providerId: string;
  startTime: Date;
  endTime: Date;
  notes?: string | null;
  status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  createdAt: Date;
  updatedAt: Date;
}

interface PrismaProvider {
  id: string;
  name: string;
  specialty?: string | null;
  email: string;
  phone?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse name into FHIR HumanName format
 * Handles formats like "John Doe", "Doe, John", "Dr. John Michael Doe Jr."
 */
function parseNameToFHIR(nameString: string): HumanName[] {
  const name: HumanName = {
    use: 'official',
    text: nameString,
  };

  // Simple parsing - split by space
  const parts = nameString.trim().split(/\s+/);

  if (parts.length === 1) {
    name.family = parts[0];
  } else if (parts.length === 2) {
    name.given = [parts[0]];
    name.family = parts[1];
  } else if (parts.length > 2) {
    // Assume last part is family name, rest are given names
    name.family = parts[parts.length - 1];
    name.given = parts.slice(0, -1);
  }

  return [name];
}

/**
 * Convert FHIR HumanName to simple string
 */
function parseFHIRNameToString(names?: HumanName[]): string {
  if (!names || names.length === 0) return '';

  const name = names[0];
  if (name.text) return name.text;

  const parts: string[] = [];
  if (name.prefix) parts.push(...name.prefix);
  if (name.given) parts.push(...name.given);
  if (name.family) parts.push(name.family);
  if (name.suffix) parts.push(...name.suffix);

  return parts.join(' ');
}

/**
 * Parse address string into FHIR Address
 */
function parseAddressToFHIR(addressString: string): Address[] {
  return [{
    use: 'home',
    type: 'physical',
    text: addressString,
  }];
}

/**
 * Convert FHIR Address to simple string
 */
function parseFHIRAddressToString(addresses?: Address[]): string {
  if (!addresses || addresses.length === 0) return '';

  const address = addresses[0];
  if (address.text) return address.text;

  const parts: string[] = [];
  if (address.line) parts.push(...address.line);
  if (address.city) parts.push(address.city);
  if (address.state) parts.push(address.state);
  if (address.postalCode) parts.push(address.postalCode);
  if (address.country) parts.push(address.country);

  return parts.join(', ');
}

/**
 * Create FHIR telecom from phone/email
 */
function createTelecom(phone?: string | null, email?: string | null): ContactPoint[] {
  const telecom: ContactPoint[] = [];

  if (phone) {
    telecom.push({
      system: 'phone',
      value: phone,
      use: 'mobile',
    });
  }

  if (email) {
    telecom.push({
      system: 'email',
      value: email,
      use: 'home',
    });
  }

  return telecom;
}

/**
 * Extract phone from FHIR telecom
 */
function extractPhoneFromTelecom(telecom?: ContactPoint[]): string | undefined {
  return telecom?.find(t => t.system === 'phone')?.value;
}

/**
 * Extract email from FHIR telecom
 */
function extractEmailFromTelecom(telecom?: ContactPoint[]): string | undefined {
  return telecom?.find(t => t.system === 'email')?.value;
}

/**
 * Map gender to FHIR format
 */
function mapGenderToFHIR(gender: string): 'male' | 'female' | 'other' | 'unknown' {
  const normalized = gender.toLowerCase();
  if (normalized === 'male' || normalized === 'm') return 'male';
  if (normalized === 'female' || normalized === 'f') return 'female';
  if (normalized === 'other' || normalized === 'o') return 'other';
  return 'unknown';
}

/**
 * Map FHIR gender back to simple string
 */
function mapFHIRGenderToString(gender?: 'male' | 'female' | 'other' | 'unknown'): string {
  if (!gender) return 'unknown';
  return gender.charAt(0).toUpperCase() + gender.slice(1);
}

/**
 * Format date to FHIR date format (YYYY-MM-DD)
 */
function formatFHIRDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

/**
 * Format date to FHIR instant format (ISO 8601)
 */
function formatFHIRInstant(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
}

/**
 * Map appointment status to FHIR
 */
function mapAppointmentStatusToFHIR(
  status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
): FHIRAppointment['status'] {
  const statusMap: Record<string, FHIRAppointment['status']> = {
    SCHEDULED: 'booked',
    CONFIRMED: 'booked',
    COMPLETED: 'fulfilled',
    CANCELLED: 'cancelled',
    NO_SHOW: 'noshow',
  };
  return statusMap[status] || 'booked';
}

/**
 * Map FHIR appointment status back to internal
 */
function mapFHIRAppointmentStatusToInternal(
  status: FHIRAppointment['status']
): 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' {
  if (status === 'fulfilled') return 'COMPLETED';
  if (status === 'cancelled') return 'CANCELLED';
  if (status === 'noshow') return 'NO_SHOW';
  if (status === 'booked' || status === 'pending') return 'SCHEDULED';
  return 'SCHEDULED';
}

// ============================================================================
// Patient Converters
// ============================================================================

/**
 * Convert Prisma Patient to FHIR Patient
 */
export function patientToFHIR(patient: PrismaPatient, baseUrl?: string): FHIRPatient {
  const fhirPatient: FHIRPatient = {
    resourceType: 'Patient',
    id: patient.id,
    meta: {
      lastUpdated: formatFHIRInstant(patient.updatedAt),
      versionId: '1',
      profile: ['http://hl7.org/fhir/StructureDefinition/Patient'],
    },
    identifier: [
      {
        use: 'official',
        system: baseUrl ? `${baseUrl}/patient-id` : 'urn:ehr-wallet:patient-id',
        value: patient.patientId,
      },
      {
        use: 'secondary',
        system: baseUrl ? `${baseUrl}/internal-id` : 'urn:ehr-wallet:internal-id',
        value: patient.id,
      },
    ],
    active: true,
    name: parseNameToFHIR(patient.name),
    telecom: createTelecom(patient.phone, patient.email),
    gender: mapGenderToFHIR(patient.gender),
    birthDate: patient.dob, // Assume already in YYYY-MM-DD format
  };

  if (patient.address) {
    fhirPatient.address = parseAddressToFHIR(patient.address);
  }

  return fhirPatient;
}

/**
 * Convert FHIR Patient to Prisma Patient format
 */
export function fhirToPatient(fhirPatient: FHIRPatient): Partial<PrismaPatient> {
  // Extract patient ID from identifiers
  const patientIdIdentifier = fhirPatient.identifier?.find(
    id => id.system?.includes('patient-id')
  );
  const internalIdIdentifier = fhirPatient.identifier?.find(
    id => id.system?.includes('internal-id')
  );

  return {
    id: internalIdIdentifier?.value || fhirPatient.id,
    patientId: patientIdIdentifier?.value || fhirPatient.id || '',
    name: parseFHIRNameToString(fhirPatient.name),
    dob: fhirPatient.birthDate || '',
    gender: mapFHIRGenderToString(fhirPatient.gender),
    phone: extractPhoneFromTelecom(fhirPatient.telecom),
    email: extractEmailFromTelecom(fhirPatient.telecom),
    address: parseFHIRAddressToString(fhirPatient.address),
  };
}

// ============================================================================
// Encounter (Visit) Converters
// ============================================================================

/**
 * Convert Prisma Visit to FHIR Encounter
 */
export function visitToFHIREncounter(visit: PrismaVisit, patientRef?: string): FHIREncounter {
  const encounter: FHIREncounter = {
    resourceType: 'Encounter',
    id: visit.id,
    meta: {
      lastUpdated: formatFHIRInstant(visit.updatedAt),
      versionId: '1',
      profile: ['http://hl7.org/fhir/StructureDefinition/Encounter'],
    },
    status: 'finished',
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: 'AMB',
      display: 'ambulatory',
    },
    period: {
      start: formatFHIRInstant(visit.date),
      end: formatFHIRInstant(visit.date),
    },
  };

  if (patientRef) {
    encounter.subject = {
      reference: patientRef,
      type: 'Patient',
    };
  } else if (visit.patientId) {
    encounter.subject = {
      reference: `Patient/${visit.patientId}`,
      type: 'Patient',
    };
  }

  if (visit.notes) {
    encounter.extension = [
      {
        url: 'http://ehr-wallet.local/fhir/StructureDefinition/encounter-notes',
        valueString: visit.notes,
      },
    ];
  }

  return encounter;
}

/**
 * Convert FHIR Encounter to Prisma Visit
 */
export function fhirEncounterToVisit(encounter: FHIREncounter): Partial<PrismaVisit> {
  // Extract patient ID from subject reference
  const patientId = encounter.subject?.reference?.replace('Patient/', '');

  // Extract notes from extension
  const notesExtension = encounter.extension?.find(
    ext => ext.url.includes('encounter-notes')
  );

  return {
    id: encounter.id,
    date: encounter.period?.start ? new Date(encounter.period.start) : new Date(),
    notes: notesExtension?.valueString,
    patientId: patientId || '',
  };
}

// ============================================================================
// Appointment Converters
// ============================================================================

/**
 * Convert Prisma Appointment to FHIR Appointment
 */
export function appointmentToFHIR(appointment: PrismaAppointment): FHIRAppointment {
  const fhirAppointment: FHIRAppointment = {
    resourceType: 'Appointment',
    id: appointment.id,
    meta: {
      lastUpdated: formatFHIRInstant(appointment.createdAt),
      versionId: '1',
      profile: ['http://hl7.org/fhir/StructureDefinition/Appointment'],
    },
    status: mapAppointmentStatusToFHIR(appointment.status),
    description: appointment.title,
    start: formatFHIRInstant(appointment.startTime),
    end: formatFHIRInstant(appointment.endTime),
    created: formatFHIRInstant(appointment.createdAt),
    comment: appointment.notes || undefined,
    participant: [
      {
        actor: {
          reference: `Patient/${appointment.patientId}`,
          type: 'Patient',
        },
        required: 'required',
        status: 'accepted',
      },
      {
        actor: {
          reference: `Practitioner/${appointment.providerId}`,
          type: 'Practitioner',
        },
        required: 'required',
        status: 'accepted',
      },
    ],
  };

  // Calculate duration in minutes
  const durationMs = appointment.endTime.getTime() - appointment.startTime.getTime();
  fhirAppointment.minutesDuration = Math.round(durationMs / (1000 * 60));

  return fhirAppointment;
}

/**
 * Convert FHIR Appointment to Prisma Appointment
 */
export function fhirToAppointment(fhirAppointment: FHIRAppointment): Partial<PrismaAppointment> {
  // Extract patient and provider from participants
  const patientParticipant = fhirAppointment.participant.find(
    p => p.actor?.type === 'Patient' || p.actor?.reference?.startsWith('Patient/')
  );
  const providerParticipant = fhirAppointment.participant.find(
    p => p.actor?.type === 'Practitioner' || p.actor?.reference?.startsWith('Practitioner/')
  );

  const patientId = patientParticipant?.actor?.reference?.replace('Patient/', '') || '';
  const providerId = providerParticipant?.actor?.reference?.replace('Practitioner/', '') || '';

  return {
    id: fhirAppointment.id,
    title: fhirAppointment.description || 'Appointment',
    patientId,
    providerId,
    startTime: fhirAppointment.start ? new Date(fhirAppointment.start) : new Date(),
    endTime: fhirAppointment.end ? new Date(fhirAppointment.end) : new Date(),
    notes: fhirAppointment.comment,
    status: mapFHIRAppointmentStatusToInternal(fhirAppointment.status),
  };
}

// ============================================================================
// Practitioner (Provider) Converters
// ============================================================================

/**
 * Convert Prisma Provider to FHIR Practitioner
 */
export function providerToFHIRPractitioner(provider: PrismaProvider): FHIRPractitioner {
  const practitioner: FHIRPractitioner = {
    resourceType: 'Practitioner',
    id: provider.id,
    meta: {
      lastUpdated: formatFHIRInstant(provider.updatedAt),
      versionId: '1',
      profile: ['http://hl7.org/fhir/StructureDefinition/Practitioner'],
    },
    active: true,
    name: parseNameToFHIR(provider.name),
    telecom: createTelecom(provider.phone, provider.email),
  };

  if (provider.specialty) {
    practitioner.qualification = [
      {
        code: {
          text: provider.specialty,
        },
      },
    ];
  }

  return practitioner;
}

/**
 * Convert FHIR Practitioner to Prisma Provider
 */
export function fhirPractitionerToProvider(practitioner: FHIRPractitioner): Partial<PrismaProvider> {
  return {
    id: practitioner.id,
    name: parseFHIRNameToString(practitioner.name),
    email: extractEmailFromTelecom(practitioner.telecom) || '',
    phone: extractPhoneFromTelecom(practitioner.telecom),
    specialty: practitioner.qualification?.[0]?.code?.text,
  };
}

// ============================================================================
// Bundle Helpers
// ============================================================================

/**
 * Create a FHIR Bundle from multiple resources
 */
export function createFHIRBundle(
  resources: any[],
  type: FHIRBundle['type'] = 'searchset',
  baseUrl?: string
): FHIRBundle {
  return {
    resourceType: 'Bundle',
    type,
    total: resources.length,
    timestamp: formatFHIRInstant(new Date()),
    entry: resources.map(resource => ({
      fullUrl: baseUrl ? `${baseUrl}/${resource.resourceType}/${resource.id}` : undefined,
      resource,
    })),
  };
}

/**
 * Create a patient summary bundle with related resources
 */
export function createPatientSummaryBundle(
  patient: PrismaPatient,
  visits?: PrismaVisit[],
  appointments?: PrismaAppointment[],
  baseUrl?: string
): FHIRBundle {
  const resources: any[] = [patientToFHIR(patient, baseUrl)];

  if (visits) {
    const encounters = visits.map(v => visitToFHIREncounter(v, `Patient/${patient.id}`));
    resources.push(...encounters);
  }

  if (appointments) {
    const fhirAppointments = appointments.map(a => appointmentToFHIR(a));
    resources.push(...fhirAppointments);
  }

  return createFHIRBundle(resources, 'collection', baseUrl);
}
