# Testing Guide for Radiant Flow Imaging Hub

This document provides a comprehensive guide to the testing approach used in the Radiant Flow Imaging Hub application. It covers the testing strategy, tools, and processes used to ensure the quality and reliability of the codebase.

## Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Testing Tools](#testing-tools)
3. [Test Structure](#test-structure)
4. [API Testing](#api-testing)
   - [Database Mocking](#database-mocking)
   - [API Route Testing](#api-route-testing)
5. [Component Testing](#component-testing)
6. [Running Tests](#running-tests)
7. [Adding New Tests](#adding-new-tests)

## Testing Strategy

The Radiant Flow Imaging Hub uses a comprehensive testing approach that focuses on:

- **Unit Testing**: Testing individual functions and components in isolation
- **Integration Testing**: Testing API routes with mocked database connections
- **Component Testing**: Testing React components with mocked props and state

Our testing pyramid follows the standard approach with more unit tests than integration tests, ensuring both code coverage and confidence in the application's behavior.

## Testing Tools

The application uses the following testing tools:

- **Jest**: The main testing framework for running tests and providing assertions
- **React Testing Library**: For testing React components in a user-centric way
- **Mock Service Worker**: For mocking API requests in component tests
- **Custom Mocks**: For database interactions (both Dexie.js and Prisma)

## Test Structure

Tests in the project follow a standard structure:

```
/pages
  /api
    /[endpoint]
      index.ts           # The actual API implementation
      simple.test.ts     # Tests for the API endpoint
/components
  /[component]
    Component.tsx        # The React component
    Component.test.tsx   # Tests for the component
/__mocks__              # Mock implementations for external dependencies
  /dexie.ts             # Mock for Dexie.js
  /lib
    /db.ts              # Mock for the database module
  /@prisma
    /client.ts          # Mock for Prisma client
```

## API Testing

### Database Mocking

The application uses two database technologies that require different mocking approaches:

#### Dexie.js Mocking

For API routes that use Dexie.js (IndexedDB wrapper), we use a custom mock implementation:

```typescript
// /__mocks__/dexie.ts
interface MockTable {
  toArray: jest.Mock;
  where: jest.Mock;
  equals: jest.Mock;
  // ... other methods
}

export interface MockDexie {
  version: () => { stores: jest.Mock };
  table: () => MockTable;
  users: MockTable;
  patients: MockTable;
  // ... other tables
}

// Mock implementation
```

This mock is used by importing it in the test files and configuring Jest to use it instead of the real Dexie.js:

```typescript
// Mock the db module and db-utils
jest.mock('@/lib/db', () => ({
  initDatabase: jest.fn().mockResolvedValue({}),
  db: {
    patients: {
      toArray: jest.fn(),
      // ... other methods
    },
    // ... other tables
  },
}));
```

#### Prisma Mocking

For API routes that use Prisma (primarily report endpoints), we use a different mock approach:

```typescript
// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPatientCount = jest.fn();
  const mockPatientGroupBy = jest.fn();
  
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      patient: {
        count: mockPatientCount,
        groupBy: mockPatientGroupBy,
      },
      $disconnect: jest.fn(),
    })),
  };
});
```

### API Route Testing

API routes are tested using a direct approach that mocks the Next.js request and response objects:

```typescript
describe('Patients API', () => {
  let req: Partial<NextApiRequest>;
  let res: Partial<NextApiResponse>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset and create fresh mocks for each test
    req = {
      method: 'GET',
      body: {},
      query: {},
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
    };
  });

  it('should return patients when GET is called', async () => {
    // Setup mocks
    (getAllPatients as jest.Mock).mockResolvedValueOnce(mockPatients);
    
    // Set the request method
    req.method = 'GET';
    
    // Call the handler
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    // Verify the response
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockPatients);
  });

  // More tests...
});
```

Each API endpoint has tests for:

- Successful operations (GET, POST, etc.)
- Validation errors (missing required fields, invalid data)
- Database errors (mocked failures)
- Method not allowed errors

## Component Testing

React components are tested using React Testing Library, focusing on user interactions and component behavior:

```typescript
describe('ReportViewer Component', () => {
  it('renders basic structure', () => {
    render(<ReportViewer />);
    expect(screen.getByText('Reports')).toBeInTheDocument();
    // More assertions...
  });

  // More tests...
});
```

## Running Tests

To run all tests in the project:

```bash
npm test
```

To run tests for a specific file or pattern:

```bash
npx jest path/to/test/file.test.ts
```

To run tests with coverage:

```bash
npm test -- --coverage
```

## Adding New Tests

When adding new tests to the project, follow these guidelines:

### For API Routes:

1. Create a new `simple.test.ts` file in the same directory as the API route
2. Mock the database and any other dependencies
3. Create test cases for all possible scenarios (success, validation errors, database errors)
4. Verify both the status code and response body

Example:

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import handler from './index';

// Mock dependencies...

describe('API Endpoint', () => {
  // Setup request and response mocks...

  it('should handle successful requests', async () => {
    // Setup mocks...
    await handler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(200);
    // More assertions...
  });

  // More tests...
});
```

### For Components:

1. Create a new `Component.test.tsx` file in the same directory as the component
2. Mock any props, state, or context the component needs
3. Render the component and test its behavior
4. Focus on user interactions and visible output

Example:

```typescript
import { render, screen } from '@testing-library/react';
import Component from './Component';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component />);
    // Assertions...
  });

  // More tests...
});
```

---

By following this testing guide, you can ensure that new features and changes to the Radiant Flow Imaging Hub application are properly tested and maintain the quality of the codebase.
