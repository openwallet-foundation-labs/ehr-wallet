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

// Define the database class
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

// Create a mock database for server-side rendering
class MockDB {
  users = { toArray: async () => [], get: async () => null, where: () => ({ equals: () => ({ first: async () => null }), anyOf: () => ({ toArray: async () => [] }), startsWith: () => ({ toArray: async () => [] }) }), add: async () => {}, update: async () => {}, delete: async () => {} };
  patients = { toArray: async () => [], get: async () => null, where: () => ({ equals: () => ({ first: async () => null, delete: async () => {} }), anyOf: () => ({ toArray: async () => [] }), startsWith: () => ({ toArray: async () => [] }) }), add: async () => {}, update: async () => {}, delete: async () => {} };
  visits = { toArray: async () => [], get: async () => null, where: () => ({ equals: () => ({ first: async () => null, delete: async () => {} }), anyOf: () => ({ toArray: async () => [] }) }), add: async () => {}, update: async () => {}, delete: async () => {} };
  providers = { toArray: async () => [], get: async () => null, where: () => ({ equals: () => ({ first: async () => null }), anyOf: () => ({ toArray: async () => [] }) }), add: async () => {}, update: async () => {}, delete: async () => {} };
  appointmentTypes = { toArray: async () => [], get: async () => null, where: () => ({ equals: () => ({ first: async () => null }), anyOf: () => ({ toArray: async () => [] }) }), add: async () => {}, update: async () => {}, delete: async () => {} };
  timeSlots = { toArray: async () => [], get: async () => null, where: () => ({ equals: () => ({ first: async () => null, delete: async () => {} }), anyOf: () => ({ toArray: async () => [] }) }), add: async () => {}, update: async () => {}, delete: async () => {} };
  appointments = { toArray: async () => [], get: async () => null, where: () => ({ equals: () => ({ first: async () => null, delete: async () => {} }), anyOf: () => ({ toArray: async () => [] }) }), add: async () => {}, update: async () => {}, delete: async () => {} };
  pendingChanges = { toArray: async () => [], get: async () => null, where: () => ({ equals: () => ({ first: async () => null }), anyOf: () => ({ toArray: async () => [] }) }), add: async () => {}, update: async () => {}, delete: async () => {} };
  open = async () => {};
}

// Singleton pattern to ensure we only create one instance
let dbInstance: ImagingHubDB | MockDB;

// Create and export a database getter function
export function getDb(): ImagingHubDB | MockDB {
  if (typeof window === 'undefined') {
    // Server-side: return mock DB
    console.log('Running in server environment, using mock DB');
    return new MockDB();
  }
  
  if (!dbInstance) {
    try {
      // Client-side: create real DB instance
      dbInstance = new ImagingHubDB();
    } catch (error) {
      console.error('Failed to create Dexie database:', error);
      // Fallback to mock DB if creation fails
      dbInstance = new MockDB();
    }
  }
  
  return dbInstance;
}

// For backward compatibility
export const db = typeof window === 'undefined' ? new MockDB() as any : new ImagingHubDB();

// Initialize the database when imported
export async function initDatabase() {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    console.log('Running in server environment, skipping Dexie initialization');
    return getDb();
  }
  
  try {
    // Get the database instance
    const database = getDb() as ImagingHubDB;
    
    // Attempt to open the database
    await database.open();
    console.log('Dexie database initialized successfully');
    return database;
  } catch (error) {
    console.error('Failed to initialize Dexie database:', error);
    throw error;
  }
}
