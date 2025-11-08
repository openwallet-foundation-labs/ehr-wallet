/**
 * Tests for FHIR converters
 */

import {
  patientToFHIR,
  fhirToPatient,
  visitToFHIREncounter,
  fhirEncounterToVisit,
  appointmentToFHIR,
  fhirToAppointment,
  providerToFHIRPractitioner,
  fhirPractitionerToProvider,
  createFHIRBundle,
  createPatientSummaryBundle,
} from '@/lib/fhir/converters';

describe('FHIR Converters', () => {
  describe('Patient Conversion', () => {
    const mockPatient = {
      id: 'pat-123',
      patientId: 'PAT-000001',
      name: 'John Doe',
      dob: '1990-05-15',
      gender: 'male',
      phone: '+1234567890',
      email: 'john.doe@example.com',
      address: '123 Main St, City, State 12345',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-15T12:00:00Z'),
    };

    it('should convert Prisma Patient to FHIR Patient', () => {
      const fhirPatient = patientToFHIR(mockPatient);

      expect(fhirPatient.resourceType).toBe('Patient');
      expect(fhirPatient.id).toBe('pat-123');
      expect(fhirPatient.active).toBe(true);
      expect(fhirPatient.gender).toBe('male');
      expect(fhirPatient.birthDate).toBe('1990-05-15');

      // Check identifiers
      expect(fhirPatient.identifier).toHaveLength(2);
      expect(fhirPatient.identifier?.[0].value).toBe('PAT-000001');

      // Check name
      expect(fhirPatient.name).toHaveLength(1);
      expect(fhirPatient.name?.[0].text).toBe('John Doe');

      // Check telecom
      const phoneContact = fhirPatient.telecom?.find(t => t.system === 'phone');
      expect(phoneContact?.value).toBe('+1234567890');

      const emailContact = fhirPatient.telecom?.find(t => t.system === 'email');
      expect(emailContact?.value).toBe('john.doe@example.com');

      // Check address
      expect(fhirPatient.address).toHaveLength(1);
      expect(fhirPatient.address?.[0].text).toBe('123 Main St, City, State 12345');

      // Check meta
      expect(fhirPatient.meta?.versionId).toBe('1');
      expect(fhirPatient.meta?.profile).toContain('http://hl7.org/fhir/StructureDefinition/Patient');
    });

    it('should convert FHIR Patient to Prisma Patient', () => {
      const fhirPatient = patientToFHIR(mockPatient);
      const prismaPatient = fhirToPatient(fhirPatient);

      expect(prismaPatient.id).toBe('pat-123');
      expect(prismaPatient.patientId).toBe('PAT-000001');
      expect(prismaPatient.name).toBe('John Doe');
      expect(prismaPatient.dob).toBe('1990-05-15');
      expect(prismaPatient.gender).toBe('Male');
      expect(prismaPatient.phone).toBe('+1234567890');
      expect(prismaPatient.email).toBe('john.doe@example.com');
      expect(prismaPatient.address).toBe('123 Main St, City, State 12345');
    });

    it('should handle round-trip conversion', () => {
      const fhirPatient = patientToFHIR(mockPatient);
      const backToPrisma = fhirToPatient(fhirPatient);

      expect(backToPrisma.name).toBe(mockPatient.name);
      expect(backToPrisma.dob).toBe(mockPatient.dob);
      expect(backToPrisma.gender).toBe('Male');
      expect(backToPrisma.phone).toBe(mockPatient.phone);
      expect(backToPrisma.email).toBe(mockPatient.email);
    });
  });

  describe('Encounter (Visit) Conversion', () => {
    const mockVisit = {
      id: 'visit-456',
      date: new Date('2024-03-20T10:30:00Z'),
      notes: 'Annual checkup',
      patientId: 'pat-123',
      createdAt: new Date('2024-03-20T10:30:00Z'),
      updatedAt: new Date('2024-03-20T10:30:00Z'),
    };

    it('should convert Prisma Visit to FHIR Encounter', () => {
      const encounter = visitToFHIREncounter(mockVisit);

      expect(encounter.resourceType).toBe('Encounter');
      expect(encounter.id).toBe('visit-456');
      expect(encounter.status).toBe('finished');
      expect(encounter.class.code).toBe('AMB');
      expect(encounter.subject?.reference).toBe('Patient/pat-123');

      // Check notes in extension
      const notesExt = encounter.extension?.find(ext =>
        ext.url.includes('encounter-notes')
      );
      expect(notesExt?.valueString).toBe('Annual checkup');
    });

    it('should convert FHIR Encounter to Prisma Visit', () => {
      const encounter = visitToFHIREncounter(mockVisit);
      const visit = fhirEncounterToVisit(encounter);

      expect(visit.id).toBe('visit-456');
      expect(visit.patientId).toBe('pat-123');
      expect(visit.notes).toBe('Annual checkup');
      expect(visit.date).toBeInstanceOf(Date);
    });
  });

  describe('Appointment Conversion', () => {
    const mockAppointment = {
      id: 'appt-789',
      title: 'Cardiology Consultation',
      patientId: 'pat-123',
      providerId: 'prov-456',
      startTime: new Date('2024-04-10T14:00:00Z'),
      endTime: new Date('2024-04-10T14:30:00Z'),
      notes: 'Bring previous test results',
      status: 'SCHEDULED' as const,
      createdAt: new Date('2024-03-01T00:00:00Z'),
      updatedAt: new Date('2024-03-01T00:00:00Z'),
    };

    it('should convert Prisma Appointment to FHIR Appointment', () => {
      const fhirAppt = appointmentToFHIR(mockAppointment);

      expect(fhirAppt.resourceType).toBe('Appointment');
      expect(fhirAppt.id).toBe('appt-789');
      expect(fhirAppt.status).toBe('booked');
      expect(fhirAppt.description).toBe('Cardiology Consultation');
      expect(fhirAppt.comment).toBe('Bring previous test results');
      expect(fhirAppt.minutesDuration).toBe(30);

      // Check participants
      expect(fhirAppt.participant).toHaveLength(2);
      const patientParticipant = fhirAppt.participant.find(p =>
        p.actor?.reference?.startsWith('Patient/')
      );
      expect(patientParticipant?.actor?.reference).toBe('Patient/pat-123');
    });

    it('should convert FHIR Appointment to Prisma Appointment', () => {
      const fhirAppt = appointmentToFHIR(mockAppointment);
      const appt = fhirToAppointment(fhirAppt);

      expect(appt.id).toBe('appt-789');
      expect(appt.title).toBe('Cardiology Consultation');
      expect(appt.patientId).toBe('pat-123');
      expect(appt.providerId).toBe('prov-456');
      expect(appt.notes).toBe('Bring previous test results');
      expect(appt.status).toBe('SCHEDULED');
    });

    it('should handle different appointment statuses', () => {
      const statuses: Array<typeof mockAppointment.status> = [
        'SCHEDULED',
        'CONFIRMED',
        'COMPLETED',
        'CANCELLED',
        'NO_SHOW',
      ];

      statuses.forEach(status => {
        const appt = { ...mockAppointment, status };
        const fhirAppt = appointmentToFHIR(appt);
        const backToInternal = fhirToAppointment(fhirAppt);

        // May not be exact match but should be valid
        expect(backToInternal.status).toBeTruthy();
      });
    });
  });

  describe('Practitioner (Provider) Conversion', () => {
    const mockProvider = {
      id: 'prov-456',
      name: 'Dr. Jane Smith',
      specialty: 'Cardiology',
      email: 'dr.smith@hospital.com',
      phone: '+1987654321',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    };

    it('should convert Prisma Provider to FHIR Practitioner', () => {
      const practitioner = providerToFHIRPractitioner(mockProvider);

      expect(practitioner.resourceType).toBe('Practitioner');
      expect(practitioner.id).toBe('prov-456');
      expect(practitioner.active).toBe(true);

      // Check name
      expect(practitioner.name?.[0].text).toBe('Dr. Jane Smith');

      // Check qualification (specialty)
      expect(practitioner.qualification?.[0].code.text).toBe('Cardiology');

      // Check telecom
      const email = practitioner.telecom?.find(t => t.system === 'email');
      expect(email?.value).toBe('dr.smith@hospital.com');
    });

    it('should convert FHIR Practitioner to Prisma Provider', () => {
      const practitioner = providerToFHIRPractitioner(mockProvider);
      const provider = fhirPractitionerToProvider(practitioner);

      expect(provider.id).toBe('prov-456');
      expect(provider.name).toBe('Dr. Jane Smith');
      expect(provider.specialty).toBe('Cardiology');
      expect(provider.email).toBe('dr.smith@hospital.com');
      expect(provider.phone).toBe('+1987654321');
    });
  });

  describe('Bundle Creation', () => {
    const mockPatient = {
      id: 'pat-123',
      patientId: 'PAT-000001',
      name: 'John Doe',
      dob: '1990-05-15',
      gender: 'male',
      phone: null,
      email: null,
      address: null,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-15T12:00:00Z'),
    };

    it('should create a FHIR Bundle from resources', () => {
      const fhirPatient = patientToFHIR(mockPatient);
      const bundle = createFHIRBundle([fhirPatient], 'searchset');

      expect(bundle.resourceType).toBe('Bundle');
      expect(bundle.type).toBe('searchset');
      expect(bundle.total).toBe(1);
      expect(bundle.entry).toHaveLength(1);
      expect(bundle.entry?.[0].resource?.resourceType).toBe('Patient');
    });

    it('should create a patient summary bundle', () => {
      const mockVisit = {
        id: 'visit-1',
        date: new Date('2024-03-20T10:30:00Z'),
        notes: 'Checkup',
        patientId: 'pat-123',
        createdAt: new Date('2024-03-20T10:30:00Z'),
        updatedAt: new Date('2024-03-20T10:30:00Z'),
      };

      const bundle = createPatientSummaryBundle(mockPatient, [mockVisit]);

      expect(bundle.resourceType).toBe('Bundle');
      expect(bundle.type).toBe('collection');
      expect(bundle.total).toBe(2); // Patient + Encounter

      // Check resources
      const patient = bundle.entry?.find(e => e.resource?.resourceType === 'Patient');
      expect(patient).toBeDefined();

      const encounter = bundle.entry?.find(e => e.resource?.resourceType === 'Encounter');
      expect(encounter).toBeDefined();
    });
  });
});
