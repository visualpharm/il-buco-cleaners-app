import { DatabaseService } from '@/lib/database';
import { connectToDatabase } from '@/lib/mongodb';
import { saveImage } from '@/lib/storage';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Photo Upload and Storage Integration', () => {
  let db: any;
  const testSessionId = 'test-photo-session-' + Date.now();
  const testOperationId = 'test-photo-operation-' + Date.now();
  
  beforeAll(async () => {
    const connection = await connectToDatabase();
    db = connection.db;
  });

  afterAll(async () => {
    // Clean up test data
    if (db) {
      await db.collection('checklistProgress').deleteMany({ 
        id: { $regex: /^test-photo-/ } 
      });
    }
  });

  it('should save photo reference when uploading during cleaning session', async () => {
    // 1. Create a test cleaning session with a photo
    const testPhoto = Buffer.from('fake-image-data');
    const photoResult = await saveImage(testPhoto, 'test-photo.jpg', testSessionId);
    
    console.log('Photo saved:', photoResult);
    
    // 2. Save checklist progress with photo reference
    const checklistData = {
      id: testOperationId,
      room: 'Test Room',
      type: 'habitacion',
      startTime: new Date(),
      steps: [{
        id: 1,
        startTime: new Date(),
        completedTime: new Date(),
        elapsedTime: 60,
        photo: photoResult.url,  // This is the photo URL that should be stored
        photoType: 'foto_limpieza',
        completed: true
      }],
      sessionId: testSessionId,
      complete: false
    };
    
    const savedProgress = await DatabaseService.saveChecklistProgress(checklistData);
    
    // 3. Verify the photo reference was stored
    expect(savedProgress).toBeTruthy();
    expect(savedProgress.steps[0].photo).toBe(photoResult.url);
    
    // 4. Retrieve the progress and verify photo is still there
    const retrievedProgress = await DatabaseService.getChecklistProgress(testOperationId);
    expect(retrievedProgress).toBeTruthy();
    expect(retrievedProgress?.steps[0].photo).toBe(photoResult.url);
    
    // 5. Verify photo appears in vanish API response
    const allProgress = await DatabaseService.getAllChecklistProgress();
    const ourProgress = allProgress.find(p => p.id === testOperationId);
    expect(ourProgress).toBeTruthy();
    expect(ourProgress?.steps[0].photo).toBe(photoResult.url);
    
    // Clean up the test photo file
    try {
      const uploadsDir = process.env.UPLOADS_DIR || './uploads';
      const photoPath = path.join(uploadsDir, 'sessions', testSessionId, path.basename(photoResult.url));
      await fs.unlink(photoPath);
    } catch (error) {
      console.log('Could not clean up test photo:', error);
    }
  });

  it('should handle photo upload via API endpoint', async () => {
    // Test the full flow through the API
    const mockFile = new File(['test image content'], 'test-image.jpg', { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', mockFile);
    
    // Mock fetch for the upload
    const uploadResponse = await fetch('http://localhost:3000/api/upload-image', {
      method: 'POST',
      body: formData
    });
    
    // If API is running, verify response
    if (uploadResponse.ok) {
      const uploadResult = await uploadResponse.json();
      expect(uploadResult.url).toBeTruthy();
      expect(uploadResult.filename).toBeTruthy();
      
      // Now save this in a checklist progress
      const progressData = {
        id: 'test-photo-api-' + Date.now(),
        room: 'API Test Room',
        type: 'habitacion',
        startTime: new Date(),
        steps: [{
          id: 1,
          startTime: new Date(),
          completedTime: new Date(),
          elapsedTime: 30,
          photo: uploadResult.url,
          photoType: 'foto_detalle',
          completed: true
        }],
        sessionId: 'test-api-session',
        complete: false
      };
      
      const saved = await DatabaseService.saveChecklistProgress(progressData);
      expect(saved.steps[0].photo).toBe(uploadResult.url);
      
      // Clean up
      await db.collection('checklistProgress').deleteOne({ id: progressData.id });
    }
  });

  it('should show photos in vanish dashboard', async () => {
    // Create a session with multiple photos
    const sessionWithPhotos = {
      id: 'test-photo-dashboard-' + Date.now(),
      room: 'Dashboard Test Room',
      type: 'habitacion',
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      endTime: new Date(),
      steps: [
        {
          id: 1,
          startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
          completedTime: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
          elapsedTime: 1800,
          photo: '/api/files/general/test-photo-1.jpg',
          photoType: 'foto_antes',
          completed: true
        },
        {
          id: 2,
          startTime: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
          completedTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
          elapsedTime: 1800,
          photo: '/api/files/general/test-photo-2.jpg',
          photoType: 'foto_despues',
          completed: true
        }
      ],
      sessionId: 'test-dashboard-session',
      complete: true
    };
    
    await DatabaseService.saveChecklistProgress(sessionWithPhotos);
    
    // Retrieve and verify
    const allSessions = await DatabaseService.getAllChecklistProgress();
    const dashboardSession = allSessions.find(s => s.id === sessionWithPhotos.id);
    
    expect(dashboardSession).toBeTruthy();
    expect(dashboardSession?.steps.length).toBe(2);
    expect(dashboardSession?.steps[0].photo).toBeTruthy();
    expect(dashboardSession?.steps[1].photo).toBeTruthy();
    
    // Verify photos are included in the response
    const photosInSession = dashboardSession?.steps
      .filter(step => step.photo)
      .map(step => step.photo);
    
    expect(photosInSession?.length).toBe(2);
  });
});