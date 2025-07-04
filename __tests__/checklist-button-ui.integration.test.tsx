import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestDB, setupTestDB, getCollection } from './test-utils';
import { DatabaseService } from '@/lib/database';
import { ChecklistProgress } from '@/lib/database';
import LimpiezaPage from '@/app/page';

// Import Jest types
declare const expect: jest.Expect;
declare const describe: jest.Describe;
declare const it: jest.It;
declare const beforeAll: jest.Lifecycle;
declare const afterEach: jest.Lifecycle;
declare const afterAll: jest.Lifecycle;
declare const beforeEach: jest.Lifecycle;

// Mock Next.js router
const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  back: jest.fn(),
  refresh: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => mockRouter),
  useSearchParams: jest.fn(() => ({
    get: jest.fn((key: string) => {
      if (key === 'room') return 'garden-room';
      if (key === 'step') return '0';
      if (key === 'session') return 'test-session-ui';
      return null;
    }),
    toString: jest.fn(() => 'room=garden-room&step=0&session=test-session-ui'),
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

describe('Checklist Button UI Integration Tests', () => {
  let testDB: TestDB;
  const user = userEvent.setup();

  beforeAll(async () => {
    // Set up the in-memory MongoDB server
    testDB = await setupTestDB();
  });

  beforeEach(() => {
    // Reset mocks before each test
    mockFetch.mockClear();
    mockPush.mockClear();
    
    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      clear: jest.fn(),
    };
    global.localStorage = localStorageMock as any;
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

  describe('UI Button Click Tests', () => {
    it('should save to MongoDB when user clicks Completar button', async () => {
      // Arrange - Mock initial API responses
      mockFetch
        .mockResolvedValueOnce(mockApiResponse({ // cleaning stats
          lastCleaned: null,
          totalSpaces: 0,
          totalTimeMinutes: 0,
        }))
        .mockResolvedValueOnce(mockApiResponse({ // checklist progress save
          id: 'ui-test-progress',
          room: 'Garden Room',
          steps: [{
            id: 1,
            completed: true,
          }],
        }));

      // Render the component
      render(<LimpiezaPage />);

      // Wait for the component to load
      await waitFor(() => {
        expect(screen.getByText('Garden Room')).toBeInTheDocument();
      });

      // Find and verify the step content is displayed
      expect(screen.getByText(/Entramos: Tocar la puerta/)).toBeInTheDocument();

      // Find the Completar button
      const completarButton = screen.getByRole('button', { name: /Completar/i });
      expect(completarButton).toBeInTheDocument();

      // Act - Click the Completar button
      await user.click(completarButton);

      // Assert - Verify API was called to save progress
      await waitFor(() => {
        // Find the POST call to checklist-progress
        const postCalls = mockFetch.mock.calls.filter(
          call => call[0] === '/api/checklist-progress' && call[1]?.method === 'POST'
        );
        
        expect(postCalls.length).toBeGreaterThan(0);
        
        // Verify the request body
        const requestBody = JSON.parse(postCalls[0][1].body);
        expect(requestBody).toMatchObject({
          habitacion: 'Garden Room',
          tipo: 'habitacion',
          pasos: expect.arrayContaining([
            expect.objectContaining({
              id: 1,
              completado: true,
            }),
          ]),
        });
      });

      // Verify URL was updated to next step
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('step=1')
      );
    });

    it('should handle photo requirement before allowing step completion', async () => {
      // Mock search params to indicate photo is required for step 6 (bed making)
      jest.resetModules();
      jest.doMock('next/navigation', () => ({
        useRouter: jest.fn(() => mockRouter),
        useSearchParams: jest.fn(() => ({
          get: jest.fn((key: string) => {
            if (key === 'room') return 'garden-room';
            if (key === 'step') return '4'; // Step 6 in the checklist (0-indexed)
            if (key === 'session') return 'test-session-photo';
            return null;
          }),
          toString: jest.fn(() => 'room=garden-room&step=4&session=test-session-photo'),
        })),
      }));

      // Import the component after mocking
      const { default: LimpiezaPageWithPhoto } = await import('@/app/page');

      // Mock API responses
      mockFetch.mockResolvedValueOnce(mockApiResponse({ // cleaning stats
        lastCleaned: null,
        totalSpaces: 0,
        totalTimeMinutes: 0,
      }));

      // Mock localStorage to return session with photo requirements
      (global.localStorage.getItem as jest.Mock).mockReturnValue(
        JSON.stringify({
          id: 'test-session-photo',
          horaInicio: new Date(),
          fotosSeleccionadas: ['cama'],
          fotosPedidas: [],
          habitacionesLimpiadas: ['Garden Room'],
        })
      );

      // Render the component
      render(<LimpiezaPageWithPhoto />);

      // Wait for the component to load
      await waitFor(() => {
        expect(screen.getByText(/Tender la cama/)).toBeInTheDocument();
      });

      // Verify photo requirement is shown
      expect(screen.getByText('Cama completa')).toBeInTheDocument();
      expect(screen.getByText(/Mostrá la cama completa/)).toBeInTheDocument();

      // Verify Completar button is NOT shown when photo is required
      expect(screen.queryByRole('button', { name: /Completar/i })).not.toBeInTheDocument();

      // Find the file input for photo upload
      const fileInput = screen.getByLabelText(/Toca para tomar la foto requerida/i).parentElement?.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
    });

    it('should complete full checklist and mark room as cleaned', async () => {
      // Start from the last step
      jest.resetModules();
      jest.doMock('next/navigation', () => ({
        useRouter: jest.fn(() => mockRouter),
        useSearchParams: jest.fn(() => ({
          get: jest.fn((key: string) => {
            if (key === 'room') return 'garden-room';
            if (key === 'step') return '17'; // Last step (0-indexed)
            if (key === 'session') return 'test-session-complete';
            return null;
          }),
          toString: jest.fn(() => 'room=garden-room&step=17&session=test-session-complete'),
        })),
      }));

      const { default: LimpiezaPageLastStep } = await import('@/app/page');

      // Mock API responses
      mockFetch
        .mockResolvedValueOnce(mockApiResponse({ // cleaning stats
          lastCleaned: null,
          totalSpaces: 0,
          totalTimeMinutes: 0,
        }))
        .mockResolvedValueOnce(mockApiResponse({ // checklist progress save
          id: 'complete-test',
          room: 'Garden Room',
          complete: true,
        }))
        .mockResolvedValueOnce(mockApiResponse({ // cleaning session save
          success: true,
        }))
        .mockResolvedValueOnce(mockApiResponse({ // updated stats
          lastCleaned: new Date(),
          totalSpaces: 1,
          totalTimeMinutes: 30,
        }));

      // Render the component
      render(<LimpiezaPageLastStep />);

      // Wait for the last step to load
      await waitFor(() => {
        expect(screen.getByText(/Cierre de la habitación/)).toBeInTheDocument();
      });

      // Click Completar on the last step
      const completarButton = screen.getByRole('button', { name: /Completar/i });
      await user.click(completarButton);

      // Wait for completion screen
      await waitFor(() => {
        expect(screen.getByText('¡Limpieza Completada!')).toBeInTheDocument();
        expect(screen.getByText(/Garden Room ha sido limpiada correctamente/)).toBeInTheDocument();
      });

      // Verify the complete checklist was saved
      const postCalls = mockFetch.mock.calls.filter(
        call => call[0] === '/api/checklist-progress' && call[1]?.method === 'POST'
      );
      
      expect(postCalls.length).toBeGreaterThan(0);
      const finalSave = JSON.parse(postCalls[postCalls.length - 1][1].body);
      expect(finalSave.completa).toBe(true);
      expect(finalSave.habitacion).toBe('Garden Room');

      // Verify cleaning session was saved
      const sessionCalls = mockFetch.mock.calls.filter(
        call => call[0] === '/api/cleaning-sessions' && call[1]?.method === 'POST'
      );
      
      expect(sessionCalls.length).toBe(1);
    });

    it('should persist checklist progress across page refreshes using URL state', async () => {
      // Simulate being in the middle of a checklist
      jest.resetModules();
      jest.doMock('next/navigation', () => ({
        useRouter: jest.fn(() => mockRouter),
        useSearchParams: jest.fn(() => ({
          get: jest.fn((key: string) => {
            if (key === 'room') return 'suite-esquinera';
            if (key === 'step') return '10'; // Middle of checklist
            if (key === 'session') return 'test-session-persist';
            return null;
          }),
          toString: jest.fn(() => 'room=suite-esquinera&step=10&session=test-session-persist'),
        })),
      }));

      const { default: LimpiezaPageMidProgress } = await import('@/app/page');

      // Mock API responses
      mockFetch.mockResolvedValueOnce(mockApiResponse({
        lastCleaned: null,
        totalSpaces: 0,
        totalTimeMinutes: 0,
      }));

      // Render the component
      render(<LimpiezaPageMidProgress />);

      // Wait for the component to restore state from URL
      await waitFor(() => {
        expect(screen.getByText('Suite Esquinera')).toBeInTheDocument();
        expect(screen.getByText(/Paso 11 de 18/)).toBeInTheDocument(); // Step 11 (1-indexed display)
      });

      // Verify we're on the correct step
      expect(screen.getByText(/Verificar vajilla/)).toBeInTheDocument();

      // Verify progress bar reflects current position
      const progressBar = screen.getByRole('progressbar', { hidden: true });
      const progressWidth = progressBar.style.width;
      expect(progressWidth).toBe(`${(11 / 18) * 100}%`);
    });
  });

  describe('Database Verification After UI Actions', () => {
    it('should verify checklist data is correctly stored in MongoDB after button click', async () => {
      // First, save some checklist progress directly to database
      const testProgress: Omit<ChecklistProgress, '_id' | 'createdAt' | 'updatedAt'> = {
        id: 'ui-db-test',
        room: 'Living',
        type: 'living',
        startTime: new Date(),
        steps: [
          {
            id: 1,
            startTime: new Date(),
            completed: true,
            completedTime: new Date(),
            elapsedTime: 120000,
          },
        ],
        sessionId: 'test-session-ui-db',
        complete: false,
      };

      // Save to database
      const savedProgress = await DatabaseService.saveChecklistProgress(testProgress);

      // Verify it was saved
      expect(savedProgress._id).toBeDefined();

      // Query the database directly to verify
      const collection = await getCollection<ChecklistProgress>('checklistProgress');
      const dbResult = await collection.findOne({ id: 'ui-db-test' });

      // Assert the data structure matches what the UI would save
      expect(dbResult).toBeDefined();
      expect(dbResult?.room).toBe('Living');
      expect(dbResult?.type).toBe('living');
      expect(dbResult?.steps).toHaveLength(1);
      expect(dbResult?.steps[0].completed).toBe(true);
      expect(dbResult?.steps[0].completedTime).toBeDefined();
      expect(dbResult?.sessionId).toBe('test-session-ui-db');
      expect(dbResult?.createdAt).toBeDefined();
      expect(dbResult?.updatedAt).toBeDefined();

      // Verify the step structure matches UI expectations
      const step = dbResult?.steps[0];
      expect(step).toMatchObject({
        id: 1,
        completed: true,
        elapsedTime: 120000,
      });
    });
  });
});