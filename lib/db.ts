import Dexie from 'dexie';

// Define types based on your existing Prisma schema
export interface UserType {
  id: string;
  name?: string | null;
  email: string;
  password?: string; // Stored hashed
  role: 'ADMIN' | 'DOCTOR' | 'STAFF';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PatientType {
  id: string;
  patientId: string; // Custom patient ID (e.g., PAT-7890)
  name: string;
  dob: string;
  gender: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface VisitType {
  id: string;
  date: Date;
  notes?: string | null;
  patientId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProviderType {
  id: string;
  name: string;
  specialty?: string | null;
  email: string;
  phone?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AppointmentTypeType {
  id: string;
  name: string;
  description?: string | null;
  duration: number; // in minutes
  color?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TimeSlotType {
  id: string;
  providerId: string;
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AppointmentType {
  id: string;
  title: string;
  patientId: string;
  providerId: string;
  appointmentTypeId?: string | null;
  startTime: Date;
  endTime: Date;
  notes?: string | null;
  status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PendingChangeType {
  id: string;
  entityType: string; // e.g., 'patients', 'appointments'
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: Date;
}

// Define the database
export class ImagingHubDB extends Dexie {
  users: Dexie.Table<UserType, string>;
  patients: Dexie.Table<PatientType, string>;
  visits: Dexie.Table<VisitType, string>;
  providers: Dexie.Table<ProviderType, string>;
  appointmentTypes: Dexie.Table<AppointmentTypeType, string>;
  timeSlots: Dexie.Table<TimeSlotType, string>;
  appointments: Dexie.Table<AppointmentType, string>;
  pendingChanges: Dexie.Table<PendingChangeType, string>;

  constructor() {
    super('imagingHubDatabase');
    
    this.version(1).stores({
      // Define schemas for each table
      // Format: primary key, indexes
      users: 'id, email, role',
      patients: 'id, patientId, name, dob, gender',
      visits: 'id, patientId, date',
      providers: 'id, name, email, specialty',
      appointmentTypes: 'id, name, duration',
      timeSlots: 'id, providerId, startTime, endTime, isAvailable',
      appointments: 'id, patientId, providerId, startTime, endTime, status',
      pendingChanges: 'id, entityType, action, timestamp'
    });
  }
}

// Create and export a database instance
export const db = new ImagingHubDB();

// Initialize the database when imported
export async function initDatabase() {
  // You could perform any initialization here
  console.log('Dexie database initialized');
  return db;
}
