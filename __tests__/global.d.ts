// This file provides type definitions for the global test environment

// Import Jest types
import '@types/jest';

// Extend the global namespace
declare global {
  // Add any global variables or mocks here
  namespace NodeJS {
    interface Global {
      fetch: jest.Mock;
    }
  }

  // Make TypeScript recognize Jest's expect, describe, it, etc.
  const expect: jest.Expect;
  const describe: jest.Describe;
  const it: jest.It;
  const beforeAll: jest.Lifecycle;
  const afterAll: jest.Lifecycle;
  const beforeEach: jest.Lifecycle;
  const afterEach: jest.Lifecycle;
  const jest: jest.Jest;
}

// This file doesn't need to export anything
export {};
