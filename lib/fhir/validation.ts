/**
 * FHIR Validation Utilities
 *
 * Provides validation functions for FHIR resources and data types
 */

import {
  FHIRPatient,
  FHIREncounter,
  FHIRAppointment,
  FHIRObservation,
  FHIRCondition,
  FHIRPractitioner,
  Resource,
} from './types';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  path: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Validate FHIR date format (YYYY-MM-DD)
 */
export function validateFHIRDate(date: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return false;
  }

  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
}

/**
 * Validate FHIR instant format (ISO 8601)
 */
export function validateFHIRInstant(instant: string): boolean {
  try {
    const date = new Date(instant);
    return date instanceof Date && !isNaN(date.getTime());
  } catch {
    return false;
  }
}

/**
 * Validate required fields for a resource
 */
function validateRequired(
  resource: any,
  requiredFields: string[],
  errors: ValidationError[]
): void {
  requiredFields.forEach(field => {
    if (resource[field] === undefined || resource[field] === null) {
      errors.push({
        path: field,
        message: `Required field '${field}' is missing`,
        severity: 'error',
      });
    }
  });
}

/**
 * Validate FHIR Patient resource
 */
export function validatePatient(patient: FHIRPatient): ValidationResult {
  const errors: ValidationError[] = [];

  // Check resource type
  if (patient.resourceType !== 'Patient') {
    errors.push({
      path: 'resourceType',
      message: 'Resource type must be "Patient"',
      severity: 'error',
    });
  }

  // Validate birthDate if present
  if (patient.birthDate && !validateFHIRDate(patient.birthDate)) {
    errors.push({
      path: 'birthDate',
      message: 'Invalid birthDate format. Must be YYYY-MM-DD',
      severity: 'error',
    });
  }

  // Validate gender
  if (patient.gender && !['male', 'female', 'other', 'unknown'].includes(patient.gender)) {
    errors.push({
      path: 'gender',
      message: 'Invalid gender value',
      severity: 'error',
    });
  }

  // Validate name structure
  if (patient.name && patient.name.length > 0) {
    patient.name.forEach((name, index) => {
      if (!name.text && !name.family && (!name.given || name.given.length === 0)) {
        errors.push({
          path: `name[${index}]`,
          message: 'Name must have either text, family, or given name',
          severity: 'warning',
        });
      }
    });
  }

  // Validate telecom
  if (patient.telecom) {
    patient.telecom.forEach((contact, index) => {
      if (!contact.system || !contact.value) {
        errors.push({
          path: `telecom[${index}]`,
          message: 'Telecom must have both system and value',
          severity: 'error',
        });
      }
    });
  }

  return {
    valid: errors.filter(e => e.severity === 'error').length === 0,
    errors,
  };
}

/**
 * Validate FHIR Encounter resource
 */
export function validateEncounter(encounter: FHIREncounter): ValidationResult {
  const errors: ValidationError[] = [];

  // Check resource type
  if (encounter.resourceType !== 'Encounter') {
    errors.push({
      path: 'resourceType',
      message: 'Resource type must be "Encounter"',
      severity: 'error',
    });
  }

  // Validate required fields
  validateRequired(encounter, ['status', 'class'], errors);

  // Validate status
  const validStatuses = [
    'planned',
    'arrived',
    'triaged',
    'in-progress',
    'onleave',
    'finished',
    'cancelled',
    'entered-in-error',
    'unknown',
  ];

  if (encounter.status && !validStatuses.includes(encounter.status)) {
    errors.push({
      path: 'status',
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      severity: 'error',
    });
  }

  // Validate period dates
  if (encounter.period) {
    if (encounter.period.start && !validateFHIRInstant(encounter.period.start)) {
      errors.push({
        path: 'period.start',
        message: 'Invalid period start instant format',
        severity: 'error',
      });
    }

    if (encounter.period.end && !validateFHIRInstant(encounter.period.end)) {
      errors.push({
        path: 'period.end',
        message: 'Invalid period end instant format',
        severity: 'error',
      });
    }
  }

  return {
    valid: errors.filter(e => e.severity === 'error').length === 0,
    errors,
  };
}

/**
 * Validate FHIR Appointment resource
 */
export function validateAppointment(appointment: FHIRAppointment): ValidationResult {
  const errors: ValidationError[] = [];

  if (appointment.resourceType !== 'Appointment') {
    errors.push({
      path: 'resourceType',
      message: 'Resource type must be "Appointment"',
      severity: 'error',
    });
  }

  // Validate required fields
  validateRequired(appointment, ['status', 'participant'], errors);

  // Validate status
  const validStatuses = [
    'proposed',
    'pending',
    'booked',
    'arrived',
    'fulfilled',
    'cancelled',
    'noshow',
    'entered-in-error',
    'checked-in',
    'waitlist',
  ];

  if (appointment.status && !validStatuses.includes(appointment.status)) {
    errors.push({
      path: 'status',
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      severity: 'error',
    });
  }

  // Validate participants
  if (appointment.participant.length === 0) {
    errors.push({
      path: 'participant',
      message: 'At least one participant is required',
      severity: 'error',
    });
  }

  // Validate start/end times
  if (appointment.start && !validateFHIRInstant(appointment.start)) {
    errors.push({
      path: 'start',
      message: 'Invalid start instant format',
      severity: 'error',
    });
  }

  if (appointment.end && !validateFHIRInstant(appointment.end)) {
    errors.push({
      path: 'end',
      message: 'Invalid end instant format',
      severity: 'error',
    });
  }

  // Validate start is before end
  if (appointment.start && appointment.end) {
    if (new Date(appointment.start) >= new Date(appointment.end)) {
      errors.push({
        path: 'start/end',
        message: 'Start time must be before end time',
        severity: 'error',
      });
    }
  }

  return {
    valid: errors.filter(e => e.severity === 'error').length === 0,
    errors,
  };
}

/**
 * Validate FHIR Observation resource
 */
export function validateObservation(observation: FHIRObservation): ValidationResult {
  const errors: ValidationError[] = [];

  if (observation.resourceType !== 'Observation') {
    errors.push({
      path: 'resourceType',
      message: 'Resource type must be "Observation"',
      severity: 'error',
    });
  }

  // Validate required fields
  validateRequired(observation, ['status', 'code'], errors);

  // Validate status
  const validStatuses = [
    'registered',
    'preliminary',
    'final',
    'amended',
    'corrected',
    'cancelled',
    'entered-in-error',
    'unknown',
  ];

  if (observation.status && !validStatuses.includes(observation.status)) {
    errors.push({
      path: 'status',
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      severity: 'error',
    });
  }

  // Validate code has at least coding or text
  if (observation.code) {
    if (!observation.code.coding && !observation.code.text) {
      errors.push({
        path: 'code',
        message: 'Code must have either coding or text',
        severity: 'error',
      });
    }
  }

  // Should have a value or dataAbsentReason
  const hasValue =
    observation.valueQuantity ||
    observation.valueCodeableConcept ||
    observation.valueString ||
    observation.valueBoolean !== undefined ||
    observation.valueInteger !== undefined ||
    observation.valueRange ||
    observation.valueRatio ||
    observation.valueDateTime ||
    observation.valuePeriod;

  if (!hasValue && !observation.dataAbsentReason) {
    errors.push({
      path: 'value',
      message: 'Observation must have a value or dataAbsentReason',
      severity: 'warning',
    });
  }

  return {
    valid: errors.filter(e => e.severity === 'error').length === 0,
    errors,
  };
}

/**
 * Validate any FHIR resource (dispatches to specific validators)
 */
export function validateResource(resource: Resource): ValidationResult {
  switch (resource.resourceType) {
    case 'Patient':
      return validatePatient(resource as FHIRPatient);
    case 'Encounter':
      return validateEncounter(resource as FHIREncounter);
    case 'Appointment':
      return validateAppointment(resource as FHIRAppointment);
    case 'Observation':
      return validateObservation(resource as FHIRObservation);
    default:
      return {
        valid: true,
        errors: [
          {
            path: 'resourceType',
            message: `Validation not implemented for resource type: ${resource.resourceType}`,
            severity: 'warning',
          },
        ],
      };
  }
}

/**
 * Format validation errors as FHIR OperationOutcome
 */
export function validationErrorsToOperationOutcome(errors: ValidationError[]) {
  return {
    resourceType: 'OperationOutcome',
    issue: errors.map(error => ({
      severity: error.severity === 'error' ? 'error' : 'warning',
      code: 'invalid',
      diagnostics: error.message,
      expression: [error.path],
    })),
  };
}
