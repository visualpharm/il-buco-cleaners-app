/**
 * Test configuration:
 * - USE_REAL_DB_FOR_TESTS: If set to 'true', tests will use the real MongoDB URI from process.env.MONGODB_URI instead of an in-memory server.
 * - DISABLE_TEST_DB_CLEANUP: If set to 'true', the test database will NOT be cleaned up after each test (test data will remain).
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectToDatabase } from '@/lib/mongodb';
import { DatabaseService } from '@/lib/database';
import { Collection, Db } from 'mongodb';

export interface TestDB {
  db: Db;
  close: () => Promise<void>;
  cleanup: () => Promise<void>;
}

let mongoServer: MongoMemoryServer;

/**
 * Set up an in-memory MongoDB instance for testing
 * @returns {Promise<TestDB>} Database connection and cleanup functions
 */
export const setupTestDB = async (): Promise<TestDB> => {
  const useRealDb = process.env.USE_REAL_DB_FOR_TESTS === 'true';
  let db: Db;
  let close: () => Promise<void> = async () => {};

  if (useRealDb) {
    // Use the real MongoDB URI
    const { db: realDb } = await connectToDatabase();
    db = realDb;
    close = async () => {};
  } else {
    // In-memory MongoDB
    mongoServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'test-db',
        port: 27037, // Use different port to avoid conflicts
      },
    });
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;
    const { db: memDb } = await connectToDatabase();
    db = memDb;
    close = async () => {
      try {
        if (mongoServer) {
          await mongoServer.stop();
        }
      } catch (error) {
        console.error('Error closing test database:', error);
        throw error;
      }
    };
  }

  return {
    db,
    close,
    async cleanup(): Promise<void> {
      if (process.env.DISABLE_TEST_DB_CLEANUP === 'true') {
        // Don't cleanup, leave test data
        return;
      }
      try {
        const collections = await db.collections();
        await Promise.all(
          collections.map(collection => 
            collection.deleteMany({}).catch(error => 
              console.error(`Error cleaning collection ${collection.collectionName}:`, error)
            )
          )
        );
        // Ensure all operations are complete
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('Error during cleanup:', error);
        throw error;
      }
    }
  };
};

/**
 * Interface for checklist progress data
 */
export interface TestChecklistProgress {
  id: string;
  room: string;
  type: string;
  startTime: Date;
  steps: Array<{
    id: number;
    startTime: Date;
    completed?: boolean;
    completedTime?: Date;
    [key: string]: any;
  }>;
  complete: boolean;
  [key: string]: any;
}

/**
 * Create a test checklist progress in the database
 * @param data - Partial checklist progress data to override defaults
 * @returns The created checklist progress with _id
 */
export const createTestChecklistProgress = async (
  data: Partial<TestChecklistProgress> = {}
): Promise<TestChecklistProgress & { _id: any }> => {
  const now = new Date();
  const defaultData: TestChecklistProgress = {
    id: `test-id-${Math.random().toString(36).substr(2, 9)}`,
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
    ...data,
  };

  const collection = await getCollection<TestChecklistProgress>('checklistProgress');
  const result = await collection.insertOne(defaultData);
  
  return { 
    ...defaultData, 
    _id: result.insertedId 
  };
};

/**
 * Get a MongoDB collection with proper typing
 * @param name - Name of the collection
 * @returns The MongoDB collection
 */
export const getCollection = async <T extends object>(
  name: string
): Promise<Collection<T>> => {
  try {
    const { db } = await connectToDatabase();
    return db.collection<T>(name);
  } catch (error) {
    console.error(`Error getting collection ${name}:`, error);
    throw error;
  }
};

/**
 * Utility to wait for a specific amount of time
 * @param ms - Time to wait in milliseconds
 * @returns A promise that resolves after the specified time
 */
export const wait = (ms: number): Promise<void> => 
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Utility to wait for a condition to be true
 * @param condition - Function that returns a boolean
 * @param timeout - Maximum time to wait in milliseconds (default: 5000ms)
 * @param interval - Interval to check the condition in milliseconds (default: 100ms)
 * @returns A promise that resolves when the condition is true or rejects on timeout
 */
export const waitForCondition = async (
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> => {
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    if (await condition()) {
      return;
    }
    await wait(interval);
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
};
