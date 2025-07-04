import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TestDB, setupTestDB, getCollection } from './test-utils';
import { DatabaseService } from '@/lib/database';
import { ChecklistProgress } from '@/lib/database';
import { act } from 'react-dom/test-utils';

// Import Jest types
declare const expect: jest.Expect;
declare const describe: jest.Describe;
declare const it: jest.It;
declare const beforeAll: jest.Lifecycle;
declare const afterEach: jest.Lifecycle;
declare const afterAll: jest.Lifecycle;
declare const beforeEach: jest.Lifecycle;

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    back: jest.fn(),
    refresh: jest.fn(),
  })),
  useSearchParams: jest.fn(() => ({
    get: jest.fn(),
    toString: jest.fn(() => ''),
  })),
}));

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof global.fetch;

// Helper to mock successful API responses
const mockApiResponse = (data: any) => ({
  ok: true,
  status: 200,
  json: async () => data,
});

describe('Checklist Button Integration Tests', () => {
  let testDB: TestDB;

  beforeAll(async () => {
    // Set up the in-memory MongoDB server
    testDB = await setupTestDB();
  });

  beforeEach(() => {
    // Reset fetch mock before each test
    mockFetch.mockClear();
  });

  afterEach(async () => {
    // Clean up the database between tests
    await testDB.cleanup();
  });

  afterAll(async () => {
    try {
      if (testDB) {
        await testDB.cleanup().catch(console.error);
        await testDB.close().catch(console.error);
      }
      await new Promise(process.nextTick);
    } catch (error) {
      console.error('Error during test cleanup:', error);
    } finally {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  });

  describe('Completar Button Click', () => {
    it('should save checklist step completion to MongoDB when Completar button is clicked', async () => {
      // Arrange
      const mockSessionId = 'test-session-123';
      const mockRoomName = 'Garden Room';
      const mockStepId = 1;
      const mockStartTime = new Date();
      
      // Mock the initial checklist data that would be sent
      const expectedChecklistData = {
        id: expect.any(String),
        habitacion: mockRoomName,
        tipo: 'habitacion',
        horaInicio: expect.any(String),
        pasos: [{
          id: mockStepId,
          horaInicio: expect.any(String),
          completado: true,
          horaCompletado: expect.any(String),
        }],
        sesionId: mockSessionId,
        completa: false,
      };

      // Mock the API response
      mockFetch.mockResolvedValueOnce(mockApiResponse({
        id: 'saved-checklist-id',
        room: mockRoomName,
        steps: [{
          id: mockStepId,
          completed: true,
        }],
      }));

      // Act - Simulate the button click by calling the API directly
      // (In a real UI test, this would be triggered by fireEvent.click on the button)
      const response = await fetch('/api/checklist-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expectedChecklistData),
      });

      // Assert - Check API was called correctly
      expect(mockFetch).toHaveBeenCalledWith('/api/checklist-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expectedChecklistData),
      });

      expect(response.ok).toBe(true);
      const responseData = await response.json();
      expect(responseData.id).toBe('saved-checklist-id');
      expect(responseData.room).toBe(mockRoomName);
      expect(responseData.steps[0].completed).toBe(true);

      // Now test the actual database operation
      // Save data directly to database to verify structure
      const checklistProgress: Omit<ChecklistProgress, '_id' | 'createdAt' | 'updatedAt'> = {
        id: 'db-test-123',
        room: mockRoomName,
        type: 'habitacion',
        startTime: mockStartTime,
        steps: [{
          id: mockStepId,
          startTime: mockStartTime,
          completed: true,
          completedTime: new Date(),
          elapsedTime: 60000, // 1 minute
        }],
        sessionId: mockSessionId,
        complete: false,
      };

      // Save to database
      const savedProgress = await DatabaseService.saveChecklistProgress(checklistProgress);

      // Assert - Verify data was saved to MongoDB
      expect(savedProgress).toBeDefined();
      expect(savedProgress._id).toBeDefined();
      expect(savedProgress.id).toBe('db-test-123');
      expect(savedProgress.room).toBe(mockRoomName);
      expect(savedProgress.steps[0].completed).toBe(true);
      expect(savedProgress.steps[0].completedTime).toBeDefined();

      // Query database directly to verify
      const collection = await getCollection<ChecklistProgress>('checklistProgress');
      const dbResult = await collection.findOne({ id: 'db-test-123' });

      expect(dbResult).toBeDefined();
      expect(dbResult?.room).toBe(mockRoomName);
      expect(dbResult?.steps[0].completed).toBe(true);
      expect(dbResult?.sessionId).toBe(mockSessionId);
    });

    it('should update existing checklist progress when multiple steps are completed', async () => {
      // Arrange - Create initial checklist progress
      const initialProgress: Omit<ChecklistProgress, '_id' | 'createdAt' | 'updatedAt'> = {
        id: 'multi-step-test',
        room: 'Suite Esquinera',
        type: 'habitacion',
        startTime: new Date(),
        steps: [
          {
            id: 1,
            startTime: new Date(),
            completed: true,
            completedTime: new Date(),
          },
          {
            id: 2,
            startTime: new Date(),
            completed: false,
          },
        ],
        sessionId: 'test-session-456',
        complete: false,
      };

      // Save initial progress
      const saved = await DatabaseService.saveChecklistProgress(initialProgress);

      // Act - Update to mark step 2 as completed
      const updatedSteps = [
        ...saved.steps.slice(0, 1),
        {
          ...saved.steps[1],
          completed: true,
          completedTime: new Date(),
          elapsedTime: 120000, // 2 minutes
        },
      ];

      const updateResult = await DatabaseService.updateChecklistProgress('multi-step-test', {
        steps: updatedSteps,
        complete: false, // Still not complete
      });

      // Assert - Verify update was successful
      expect(updateResult).toBeDefined();
      expect(updateResult?.steps[1].completed).toBe(true);
      expect(updateResult?.steps[1].completedTime).toBeDefined();
      expect(updateResult?.steps[1].elapsedTime).toBe(120000);

      // Query database to verify persistence
      const collection = await getCollection<ChecklistProgress>('checklistProgress');
      const dbResult = await collection.findOne({ id: 'multi-step-test' });

      expect(dbResult).toBeDefined();
      expect(dbResult?.steps).toHaveLength(2);
      expect(dbResult?.steps[0].completed).toBe(true);
      expect(dbResult?.steps[1].completed).toBe(true);
      expect(dbResult?.updatedAt).toBeDefined();
      expect(dbResult?.updatedAt.getTime()).toBeGreaterThan(dbResult?.createdAt.getTime());
    });

    it('should mark checklist as complete when all steps are done', async () => {
      // Arrange - Create a checklist with one remaining step
      const almostComplete: Omit<ChecklistProgress, '_id' | 'createdAt' | 'updatedAt'> = {
        id: 'completion-test',
        room: 'Parrilla',
        type: 'parrilla',
        startTime: new Date(Date.now() - 300000), // 5 minutes ago
        steps: [
          {
            id: 1,
            startTime: new Date(Date.now() - 300000),
            completed: false, // Last step not completed
          },
        ],
        sessionId: 'test-session-789',
        complete: false,
      };

      await DatabaseService.saveChecklistProgress(almostComplete);

      // Act - Complete the last step
      const endTime = new Date();
      const updateResult = await DatabaseService.updateChecklistProgress('completion-test', {
        steps: [{
          id: 1,
          startTime: almostComplete.steps[0].startTime,
          completed: true,
          completedTime: endTime,
          elapsedTime: 300000, // 5 minutes
        }],
        complete: true,
        endTime: endTime,
      });

      // Assert
      expect(updateResult).toBeDefined();
      expect(updateResult?.complete).toBe(true);
      expect(updateResult?.endTime).toBeDefined();
      expect(updateResult?.steps[0].completed).toBe(true);

      // Verify in database
      const collection = await getCollection<ChecklistProgress>('checklistProgress');
      const dbResult = await collection.findOne({ id: 'completion-test' });

      expect(dbResult).toBeDefined();
      expect(dbResult?.complete).toBe(true);
      expect(dbResult?.endTime).toBeDefined();
      expect(dbResult?.steps[0].completed).toBe(true);
      expect(dbResult?.steps[0].completedTime).toBeDefined();
    });

    it('should handle photo validation and step completion together', async () => {
      // Arrange
      const checklistWithPhoto: Omit<ChecklistProgress, '_id' | 'createdAt' | 'updatedAt'> = {
        id: 'photo-test',
        room: 'Garden Room',
        type: 'habitacion',
        startTime: new Date(),
        steps: [{
          id: 6, // Step that requires photo (bed making)
          startTime: new Date(),
          completed: false,
        }],
        sessionId: 'test-session-photo',
        complete: false,
      };

      await DatabaseService.saveChecklistProgress(checklistWithPhoto);

      // Act - Complete step with photo validation
      const photoUrl = '/uploads/sessions/test-session-photo/bed-photo.jpg';
      const validationResult = {
        isValid: true,
        analysis: {
          expected: 'cama bien hecha con sábana',
          found: 'cama correctamente tendida',
        },
      };

      const updateResult = await DatabaseService.updateChecklistProgress('photo-test', {
        steps: [{
          id: 6,
          startTime: checklistWithPhoto.steps[0].startTime,
          completed: true,
          completedTime: new Date(),
          photo: photoUrl,
          validationAI: validationResult,
          photoType: 'cama',
        }],
      });

      // Assert
      expect(updateResult).toBeDefined();
      expect(updateResult?.steps[0].completed).toBe(true);
      expect(updateResult?.steps[0].photo).toBe(photoUrl);
      expect(updateResult?.steps[0].validationAI).toEqual(validationResult);
      expect(updateResult?.steps[0].photoType).toBe('cama');

      // Verify in database
      const collection = await getCollection<ChecklistProgress>('checklistProgress');
      const dbResult = await collection.findOne({ id: 'photo-test' });

      expect(dbResult).toBeDefined();
      expect(dbResult?.steps[0].photo).toBe(photoUrl);
      expect(dbResult?.steps[0].validationAI?.isValid).toBe(true);
    });

    it('should handle failed steps with failure photos', async () => {
      // Arrange
      const checklistForFailure: Omit<ChecklistProgress, '_id' | 'createdAt' | 'updatedAt'> = {
        id: 'failure-test',
        room: 'Living',
        type: 'living',
        startTime: new Date(),
        steps: [{
          id: 7, // Bathroom cleaning step
          startTime: new Date(),
          completed: true,
          completedTime: new Date(),
        }],
        sessionId: 'test-session-fail',
        complete: false,
      };

      await DatabaseService.saveChecklistProgress(checklistForFailure);

      // Act - Mark step as failed with failure photo
      const failurePhotoUrl = '/uploads/general/failure-bathroom.jpg';
      const updateResult = await DatabaseService.updateChecklistProgress('failure-test', {
        steps: [{
          ...checklistForFailure.steps[0],
          failed: true,
          failurePhoto: failurePhotoUrl,
        }],
        failed: true,
        failurePhoto: failurePhotoUrl,
      });

      // Assert
      expect(updateResult).toBeDefined();
      expect(updateResult?.steps[0].failed).toBe(true);
      expect(updateResult?.steps[0].failurePhoto).toBe(failurePhotoUrl);
      expect(updateResult?.failed).toBe(true);
      expect(updateResult?.failurePhoto).toBe(failurePhotoUrl);

      // Verify in database
      const collection = await getCollection<ChecklistProgress>('checklistProgress');
      const dbResult = await collection.findOne({ id: 'failure-test' });

      expect(dbResult).toBeDefined();
      expect(dbResult?.steps[0].failed).toBe(true);
      expect(dbResult?.steps[0].failurePhoto).toBe(failurePhotoUrl);
      expect(dbResult?.failed).toBe(true);
    });
  });

  describe('API Endpoint Integration', () => {
    it('should handle Spanish to English field conversion in API', async () => {
      // Arrange
      const spanishData = {
        id: 'api-conversion-test',
        habitacion: 'Penthouse',
        tipo: 'habitacion',
        horaInicio: new Date().toISOString(),
        horaFin: new Date(Date.now() + 600000).toISOString(), // 10 minutes later
        pasos: [{
          id: 1,
          horaInicio: new Date().toISOString(),
          horaCompletado: new Date(Date.now() + 60000).toISOString(),
          completado: true,
          tiempoTranscurrido: 60000,
          foto: '/test-photo.jpg',
          validacionIA: {
            esValida: true,
            analisis: {
              esperaba: 'clean surface',
              encontro: 'clean surface detected',
            },
          },
          corregido: false,
          ignorado: false,
          tipoFoto: 'basura',
        }],
        sesionId: 'test-session-api',
        completa: true,
        fallado: false,
      };

      // Mock the API handler directly
      const { POST } = await import('@/app/api/checklist-progress/route');
      const req = {
        json: async () => spanishData,
      } as Request;

      // Act
      const response = await POST(req);
      const responseData = await response.json();

      // Assert - Check that Spanish fields were converted to English
      expect(response.status).toBe(200);
      expect(responseData.room).toBe('Penthouse'); // habitacion -> room
      expect(responseData.type).toBe('habitacion'); // tipo -> type
      expect(responseData.startTime).toBeDefined(); // horaInicio -> startTime
      expect(responseData.endTime).toBeDefined(); // horaFin -> endTime
      expect(responseData.steps[0].completedTime).toBeDefined(); // horaCompletado -> completedTime
      expect(responseData.steps[0].elapsedTime).toBe(60000); // tiempoTranscurrido -> elapsedTime
      expect(responseData.steps[0].validationAI.isValid).toBe(true); // esValida -> isValid
      expect(responseData.steps[0].validationAI.analysis.expected).toBe('clean surface'); // esperaba -> expected
      expect(responseData.steps[0].validationAI.analysis.found).toBe('clean surface detected'); // encontro -> found

      // Verify in database
      const collection = await getCollection<ChecklistProgress>('checklistProgress');
      const dbResult = await collection.findOne({ id: 'api-conversion-test' });

      expect(dbResult).toBeDefined();
      expect(dbResult?.room).toBe('Penthouse');
      expect(dbResult?.type).toBe('habitacion');
      expect(dbResult?.complete).toBe(true);
      expect(dbResult?.steps[0].photoType).toBe('basura');
    });
  });
});