import { getCollection } from './mongodb';
import { ObjectId } from 'mongodb';

// Types
export interface CleaningSession {
  _id?: ObjectId;
  id: string;
  cleanerId: string;
  roomType: string;
  startTime: Date;
  endTime?: Date;
  beforePhoto?: string;
  afterPhoto?: string;
  notes?: string;
  status: 'in_progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface Photo {
  _id?: ObjectId;
  id: string;
  sessionId: string;
  type: 'before' | 'after';
  filename: string;
  url: string;
  uploadedAt: Date;
}

export interface ClickEvent {
  _id?: ObjectId;
  id: string;
  element: string;
  page: string;
  timestamp: Date;
  userAgent?: string;
  sessionId?: string;
}

// Database operations
export class DatabaseService {
  // Cleaning Sessions
  static async createSession(sessionData: Omit<CleaningSession, '_id' | 'createdAt' | 'updatedAt'>): Promise<CleaningSession> {
    const collection = await getCollection<CleaningSession>('cleaningSessions');
    const now = new Date();
    const session = {
      ...sessionData,
      createdAt: now,
      updatedAt: now
    };
    
    const result = await collection.insertOne(session);
    return { ...session, _id: result.insertedId };
  }

  static async getSession(id: string): Promise<CleaningSession | null> {
    const collection = await getCollection<CleaningSession>('cleaningSessions');
    return await collection.findOne({ id });
  }

  static async updateSession(id: string, updates: Partial<CleaningSession>): Promise<CleaningSession | null> {
    const collection = await getCollection<CleaningSession>('cleaningSessions');
    const result = await collection.findOneAndUpdate(
      { id },
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );
    return result;
  }

  static async getAllSessions(): Promise<CleaningSession[]> {
    const collection = await getCollection<CleaningSession>('cleaningSessions');
    return await collection.find({}).sort({ createdAt: -1 }).toArray();
  }

  static async getSessionsByDateRange(startDate: Date, endDate: Date): Promise<CleaningSession[]> {
    const collection = await getCollection<CleaningSession>('cleaningSessions');
    return await collection.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).sort({ createdAt: -1 }).toArray();
  }

  // Photos
  static async savePhoto(photoData: Omit<Photo, '_id'>): Promise<Photo> {
    const collection = await getCollection<Photo>('photos');
    const result = await collection.insertOne(photoData);
    return { ...photoData, _id: result.insertedId };
  }

  static async getPhotosBySession(sessionId: string): Promise<Photo[]> {
    const collection = await getCollection<Photo>('photos');
    if (sessionId === '') {
      // Return all photos
      return await collection.find({}).sort({ uploadedAt: -1 }).toArray();
    }
    return await collection.find({ sessionId }).toArray();
  }

  static async getPhoto(id: string): Promise<Photo | null> {
    const collection = await getCollection<Photo>('photos');
    return await collection.findOne({ id });
  }

  // Click tracking
  static async saveClickEvent(clickData: Omit<ClickEvent, '_id'>): Promise<ClickEvent> {
    const collection = await getCollection<ClickEvent>('clickEvents');
    const result = await collection.insertOne(clickData);
    return { ...clickData, _id: result.insertedId };
  }

  static async getClickEvents(startDate?: Date, endDate?: Date): Promise<ClickEvent[]> {
    const collection = await getCollection<ClickEvent>('clickEvents');
    const query = startDate && endDate ? 
      { timestamp: { $gte: startDate, $lte: endDate } } : {};
    return await collection.find(query).sort({ timestamp: -1 }).toArray();
  }

  // Analytics helpers
  static async getSessionStats() {
    const collection = await getCollection<CleaningSession>('cleaningSessions');
    
    const [total, completed, inProgress] = await Promise.all([
      collection.countDocuments(),
      collection.countDocuments({ status: 'completed' }),
      collection.countDocuments({ status: 'in_progress' })
    ]);

    return { total, completed, inProgress };
  }
}