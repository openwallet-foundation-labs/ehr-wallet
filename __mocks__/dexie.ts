// Mock for Dexie.js
interface MockTable {
  toArray: jest.Mock;
  where: jest.Mock;
  equals: jest.Mock;
  anyOf: jest.Mock;
  startsWith: jest.Mock;
  first: jest.Mock;
  add: jest.Mock;
  put: jest.Mock;
  delete: jest.Mock;
  bulkAdd: jest.Mock;
  bulkDelete: jest.Mock;
  count: jest.Mock;
  orderBy: jest.Mock;
  reverse: jest.Mock;
  limit: jest.Mock;
  offset: jest.Mock;
  filter: jest.Mock;
}

const createMockTable = (): MockTable => ({
  toArray: jest.fn().mockResolvedValue([]),
  where: jest.fn().mockReturnThis(),
  equals: jest.fn().mockReturnThis(),
  anyOf: jest.fn().mockReturnThis(),
  startsWith: jest.fn().mockReturnThis(),
  first: jest.fn().mockResolvedValue(null),
  add: jest.fn().mockResolvedValue('mock-id'),
  put: jest.fn().mockResolvedValue('mock-id'),
  delete: jest.fn().mockResolvedValue(undefined),
  bulkAdd: jest.fn().mockResolvedValue(['mock-id']),
  bulkDelete: jest.fn().mockResolvedValue(undefined),
  count: jest.fn().mockResolvedValue(0),
  orderBy: jest.fn().mockReturnThis(),
  reverse: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  filter: jest.fn().mockReturnThis(),
});

export interface MockDexie {
  version: () => { stores: jest.Mock };
  table: () => MockTable;
  users: MockTable;
  patients: MockTable;
  visits: MockTable;
  providers: MockTable;
  appointmentTypes: MockTable;
  timeSlots: MockTable;
  appointments: MockTable;
  pendingChanges: MockTable;
}

class MockDexieImpl implements MockDexie {
  users: MockTable;
  patients: MockTable;
  visits: MockTable;
  providers: MockTable;
  appointmentTypes: MockTable;
  timeSlots: MockTable;
  appointments: MockTable;
  pendingChanges: MockTable;

  constructor() {
    this.users = createMockTable();
    this.patients = createMockTable();
    this.visits = createMockTable();
    this.providers = createMockTable();
    this.appointmentTypes = createMockTable();
    this.timeSlots = createMockTable();
    this.appointments = createMockTable();
    this.pendingChanges = createMockTable();
  }

  version() {
    return {
      stores: jest.fn().mockReturnThis(),
    };
  }

  table() {
    return createMockTable();
  }
}

// Export the mock class
export default MockDexieImpl;

// Export a helper to create and configure mock tables
export const configureMockDexieInstance = (): MockDexie => {
  return new MockDexieImpl();
};
