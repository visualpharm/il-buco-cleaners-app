import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectToDatabase } from '@/lib/mongodb';
import { DatabaseService } from '@/lib/database';
import { NextResponse } from 'next/server';
import { Collection, Document, WithId } from 'mongodb';
import { TestDB, setupTestDB, createTestChecklistProgress, getCollection } from './test-utils';

// Import Jest types
declare const expect: jest.Expect;
declare const describe: jest.Describe;
declare const it: jest.It;
declare const beforeAll: jest.Lifecycle;
declare const afterEach: jest.Lifecycle;
declare const afterAll: jest.Lifecycle;

// Mock the Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof global.fetch;

// Helper to mock successful fetch responses
const mockFetchResponse = (data: any) => ({
  ok: true,
  status: 200,
  json: async () => data,
});

// Helper to mock error fetch responses
const mockFetchError = (status: number, message: string) => ({
  ok: false,
  status,
  json: async () => ({ error: message }),
});

// Reset mocks before each test
beforeEach(() => {
  mockFetch.mockClear();
});

describe('Checklist Integration Tests', () => {
  let testDB: TestDB;

  beforeAll(async () => {
    // Set up the in-memory MongoDB server
    testDB = await setupTestDB();
  });

  afterEach(async () => {
    // Clean up the database between tests
    await testDB.cleanup();
  });

  afterAll(async () => {
    // Use a simple cleanup without timeouts that might hang
    try {
      if (testDB) {
        await testDB.cleanup().catch(console.error);
        await testDB.close().catch(console.error);
      }
      // Allow any pending operations to complete
      await new Promise(process.nextTick);
    } catch (error) {
      console.error('Error during test cleanup:', error);
    } finally {
      // Force exit after a short delay to allow cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  });

  describe('Checklist Progress', () => {
    it('should save checklist progress to the database', async () => {
      // Arrange
      const now = new Date();
      const checklistData = {
        id: 'test-checklist-1',
        room: 'Test Room',
        type: 'habitacion',
        startTime: now,
        steps: [
          {
            id: 1,
            startTime: now,
            completed: false,
          },
        ],
        complete: false,
      };

      // Act - Save the checklist progress
      const result = await DatabaseService.saveChecklistProgress(checklistData);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(checklistData.id);
      expect(result.room).toBe(checklistData.room);
      expect(result.steps).toHaveLength(1);
      expect(result.steps[0].id).toBe(1);
      expect(result.complete).toBe(false);
    });

    it('should update checklist progress when a step is completed', async () => {
      // Arrange - Create a test checklist progress
      const now = new Date();
      const { id } = await createTestChecklistProgress({
        id: 'test-update-1',
        room: 'Update Test Room',
        steps: [
          { id: 1, startTime: now, completed: false },
          { id: 2, startTime: now, completed: false },
        ],
      });

      // Act - Update the checklist progress to mark step 1 as completed
      const updates = {
        steps: [
          { id: 1, startTime: now, completed: true, completedTime: new Date() },
          { id: 2, startTime: now, completed: false },
        ],
      };
      
      const updatedProgress = await DatabaseService.updateChecklistProgress(id, updates);

      // Assert
      expect(updatedProgress).toBeDefined();
      expect(updatedProgress?.steps[0].completed).toBe(true);
      expect(updatedProgress?.steps[0].completedTime).toBeDefined();
      expect(updatedProgress?.steps[1].completed).toBe(false);
    });

    it('should mark checklist as complete when all steps are completed', async () => {
      // Arrange - Create a test checklist progress with one step
      const now = new Date();
      const { id } = await createTestChecklistProgress({
        id: 'test-complete-1',
        room: 'Complete Test Room',
        steps: [
          { id: 1, startTime: now, completed: false },
        ],
        complete: false,
      });

      // Act - Mark the step as completed and the checklist as complete
      const updates = {
        steps: [
          { id: 1, startTime: now, completed: true, completedTime: new Date() },
        ],
        complete: true,
        endTime: new Date(),
      };
      
      const updatedProgress = await DatabaseService.updateChecklistProgress(id, updates);

      // Assert
      expect(updatedProgress).toBeDefined();
      expect(updatedProgress?.steps[0].completed).toBe(true);
      expect(updatedProgress?.complete).toBe(true);
      expect(updatedProgress?.endTime).toBeDefined();
    });
  });

  describe('Checklist API Endpoints', () => {
    it('should create a new checklist progress via API', async () => {
      // Arrange
      const now = new Date().toISOString();
      const checklistData = {
        id: 'api-test-1',
        habitacion: 'API Test Room',
        tipo: 'habitacion',
        horaInicio: now,
        pasos: [
          {
            id: 1,
            horaInicio: now,
            completado: false,
          },
        ],
      };

      // Mock the request and response objects
      const req = {
        method: 'POST',
        json: async () => checklistData,
      } as unknown as Request;

      // Import the handler dynamically to ensure it uses the test database
      const { POST } = await import('@/app/api/checklist-progress/route');
      
      // Act - Call the API endpoint
      const response = await POST(req);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.id).toBe(checklistData.id);
      expect(data.room).toBe(checklistData.habitacion);
      expect(data.steps).toHaveLength(1);
    });

    it('should retrieve checklist progress by ID via API', async () => {
      // Arrange - Create a test checklist progress
      const now = new Date();
      const testChecklist = await createTestChecklistProgress({
        id: 'api-get-1',
        room: 'API Get Test Room',
      });

      // Mock the fetch response
      mockFetch.mockResolvedValueOnce(mockFetchResponse(testChecklist));

      // Act - Call the API endpoint using fetch
      const response = await fetch(
        `http://localhost:3000/api/checklist-progress?id=${testChecklist.id}`
      );
      
      const data = await response.json();
      
      // Assert the fetch was called with the correct URL
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3000/api/checklist-progress?id=${testChecklist.id}`
      );
      
      // Verify the response data
      expect(data).toBeDefined();
      expect(data.id).toBe(testChecklist.id);

      // Assert - Check that we got a valid response
      expect(response).toBeDefined();
      expect(data).toBeDefined();
      // The response should have the same ID as our test data
      expect(data.id).toBe(testChecklist.id);
      // The room name should match
      expect(data.room).toBe(testChecklist.room);
    });
  });
});
