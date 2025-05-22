import { configureMockDexieInstance } from '../dexie';

// Create a mock instance with all the tables from the real database
export const db = configureMockDexieInstance();

// Re-export all the types from the real db.ts
export * from '../../lib/db';

// Mock the initDatabase function
export const initDatabase = jest.fn().mockResolvedValue(db);

// Export the mock db for direct manipulation in tests
export const mockDb = db;
