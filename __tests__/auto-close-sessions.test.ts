import { DatabaseService } from '@/lib/database';
import { connectToDatabase } from '@/lib/mongodb';

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

describe('Auto-close sessions functionality', () => {
  let db: any;

  beforeAll(async () => {
    const connection = await connectToDatabase();
    db = connection.db;
  });

  afterAll(async () => {
    // Clean up test data
    if (db) {
      await db.collection('checklistProgress').deleteMany({ 
        id: { $regex: /^test-auto-close-/ } 
      });
    }
  });

  it('should auto-close sessions older than 12 hours', async () => {
    // Create a test session that started 13 hours ago
    const thirteenHoursAgo = new Date(Date.now() - (13 * 60 * 60 * 1000));
    
    await DatabaseService.saveChecklistProgress({
      id: 'test-auto-close-1',
      room: 'Test Room',
      type: 'habitacion',
      startTime: thirteenHoursAgo,
      steps: [{
        id: 1,
        startTime: thirteenHoursAgo,
        completedTime: new Date(thirteenHoursAgo.getTime() + 60000),
        elapsedTime: 60
      }],
      complete: false
    });

    // Call the auto-close endpoint
    const response = await fetch('http://localhost:3000/api/auto-close-sessions', {
      method: 'POST'
    });

    expect(response.status).toBe(200);
    const result = await response.json();
    
    expect(result.success).toBe(true);
    expect(result.closedSessions.length).toBeGreaterThan(0);
    
    // Verify the session was closed in the database
    const closedSession = await DatabaseService.getChecklistProgress('test-auto-close-1');
    expect(closedSession).toBeTruthy();
    expect(closedSession?.endTime).toBeTruthy();
    expect(closedSession?.complete).toBe(true);
    expect(closedSession?.reason).toBe('Auto-closed: Session exceeded 12 hours');
  });

  it('should NOT auto-close sessions younger than 12 hours', async () => {
    // Create a test session that started 5 hours ago
    const fiveHoursAgo = new Date(Date.now() - (5 * 60 * 60 * 1000));
    
    await DatabaseService.saveChecklistProgress({
      id: 'test-auto-close-2',
      room: 'Test Room 2',
      type: 'habitacion',
      startTime: fiveHoursAgo,
      steps: [{
        id: 1,
        startTime: fiveHoursAgo,
        completedTime: new Date(fiveHoursAgo.getTime() + 60000),
        elapsedTime: 60
      }],
      complete: false
    });

    // Check which sessions would be closed
    const response = await fetch('http://localhost:3000/api/auto-close-sessions', {
      method: 'GET'
    });

    expect(response.status).toBe(200);
    const result = await response.json();
    
    // The 5-hour session should NOT be in the list
    const foundSession = result.sessions.find((s: any) => s.id === 'test-auto-close-2');
    expect(foundSession).toBeUndefined();
  });

  it('should not affect already completed sessions', async () => {
    // Create a completed session from 20 hours ago
    const twentyHoursAgo = new Date(Date.now() - (20 * 60 * 60 * 1000));
    const endTime = new Date(twentyHoursAgo.getTime() + (2 * 60 * 60 * 1000)); // 2 hours duration
    
    await DatabaseService.saveChecklistProgress({
      id: 'test-auto-close-3',
      room: 'Test Room 3',
      type: 'habitacion',
      startTime: twentyHoursAgo,
      endTime: endTime,
      steps: [{
        id: 1,
        startTime: twentyHoursAgo,
        completedTime: endTime,
        elapsedTime: 7200
      }],
      complete: true
    });

    // Call the auto-close endpoint
    const response = await fetch('http://localhost:3000/api/auto-close-sessions', {
      method: 'POST'
    });

    expect(response.status).toBe(200);
    const result = await response.json();
    
    // The completed session should not be in the closed sessions
    const closedSession = result.closedSessions.find((s: any) => s.id === 'test-auto-close-3');
    expect(closedSession).toBeUndefined();
  });
});

describe('Auto-close on save', () => {
  it('should auto-close when saving a session that started over 12 hours ago', async () => {
    const fourteenHoursAgo = new Date(Date.now() - (14 * 60 * 60 * 1000));
    
    const requestData = {
      id: 'test-auto-close-save',
      habitacion: 'Test Room Save',
      tipo: 'habitacion',
      horaInicio: fourteenHoursAgo.toISOString(),
      pasos: [{
        id: 1,
        horaInicio: fourteenHoursAgo.toISOString(),
        horaCompletado: new Date(fourteenHoursAgo.getTime() + 60000).toISOString(),
        tiempoTranscurrido: 60
      }],
      completa: false
    };

    const response = await fetch('http://localhost:3000/api/checklist-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });

    expect(response.status).toBe(200);
    const result = await response.json();
    
    // Verify the session was auto-closed
    expect(result.endTime).toBeTruthy();
    expect(result.complete).toBe(true);
    expect(result.reason).toBe('Auto-closed: Session exceeded 12 hours');
  });
});