import { DatabaseService } from '@/lib/database';
import { connectToDatabase } from '@/lib/mongodb';

describe('Photo Dashboard Integration', () => {
  let db: any;
  
  beforeAll(async () => {
    const connection = await connectToDatabase();
    db = connection.db;
  });

  afterAll(async () => {
    // Clean up test data
    if (db) {
      await db.collection('checklistProgress').deleteMany({ 
        id: { $regex: /^test-dashboard-/ } 
      });
    }
  });

  it('should display photos in vanish dashboard after completing a cleaning session', async () => {
    // Simulate a complete cleaning session with photos
    const sessionId = 'test-dashboard-session-' + Date.now();
    const operationId = 'test-dashboard-op-' + Date.now();
    
    // Create a cleaning session with multiple steps including photos
    const cleaningSession = {
      id: operationId,
      room: 'Test Dashboard Room',
      type: 'habitacion',
      startTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      endTime: new Date(),
      steps: [
        {
          id: 1,
          startTime: new Date(Date.now() - 30 * 60 * 1000),
          completedTime: new Date(Date.now() - 25 * 60 * 1000),
          elapsedTime: 300,
          photo: '/api/files/sessions/' + sessionId + '/step1-photo.jpg',
          photoType: 'foto_antes',
          completed: true
        },
        {
          id: 5,
          startTime: new Date(Date.now() - 25 * 60 * 1000),
          completedTime: new Date(Date.now() - 20 * 60 * 1000),
          elapsedTime: 300,
          photo: null, // No photo for this step
          completed: true
        },
        {
          id: 11,
          startTime: new Date(Date.now() - 20 * 60 * 1000),
          completedTime: new Date(Date.now() - 15 * 60 * 1000),
          elapsedTime: 300,
          photo: '/api/files/sessions/' + sessionId + '/step11-photo.jpg',
          photoType: 'foto_despues',
          validationAI: {
            isValid: true,
            analysis: {
              expected: 'Cubiertos organizados',
              found: 'Cubiertos organizados correctamente'
            }
          },
          completed: true
        }
      ],
      sessionId: sessionId,
      complete: true
    };
    
    // Save the session
    const saved = await DatabaseService.saveChecklistProgress(cleaningSession);
    expect(saved).toBeTruthy();
    expect(saved._id).toBeTruthy();
    
    // Retrieve all sessions (simulating vanish dashboard fetch)
    const allSessions = await DatabaseService.getAllChecklistProgress();
    
    // Find our test session
    const testSession = allSessions.find(s => s.id === operationId);
    expect(testSession).toBeTruthy();
    
    // Verify photos are present
    const photosInSession = testSession?.steps.filter(s => s.photo).map(s => s.photo);
    expect(photosInSession).toHaveLength(2);
    expect(photosInSession).toContain('/api/files/sessions/' + sessionId + '/step1-photo.jpg');
    expect(photosInSession).toContain('/api/files/sessions/' + sessionId + '/step11-photo.jpg');
    
    // Verify the session appears complete with correct metadata
    expect(testSession?.complete).toBe(true);
    expect(testSession?.sessionId).toBe(sessionId);
    
    // Test the vanish API endpoint transformation
    const response = await fetch('http://localhost:3000/api/vanish');
    if (response.ok) {
      const vanishData = await response.json();
      const vanishSession = vanishData.find((s: any) => s.id === operationId);
      
      if (vanishSession) {
        // Verify Spanish field mapping
        expect(vanishSession.habitacion).toBe('Test Dashboard Room');
        expect(vanishSession.completa).toBe(true);
        expect(vanishSession.pasos).toHaveLength(3);
        
        // Verify photos in Spanish format
        const spanishPhotos = vanishSession.pasos.filter((p: any) => p.foto).map((p: any) => p.foto);
        expect(spanishPhotos).toHaveLength(2);
      }
    }
  });

  it('should handle sessions without photos correctly', async () => {
    const noPhotoSession = {
      id: 'test-dashboard-no-photos-' + Date.now(),
      room: 'No Photo Room',
      type: 'escalera',
      startTime: new Date(Date.now() - 10 * 60 * 1000),
      endTime: new Date(),
      steps: [
        {
          id: 1,
          startTime: new Date(Date.now() - 10 * 60 * 1000),
          completedTime: new Date(Date.now() - 5 * 60 * 1000),
          elapsedTime: 300,
          completed: true
        }
      ],
      sessionId: 'no-photo-session',
      complete: true
    };
    
    const saved = await DatabaseService.saveChecklistProgress(noPhotoSession);
    expect(saved).toBeTruthy();
    
    const retrieved = await DatabaseService.getChecklistProgress(noPhotoSession.id);
    expect(retrieved).toBeTruthy();
    expect(retrieved?.steps[0].photo).toBeUndefined();
  });
});