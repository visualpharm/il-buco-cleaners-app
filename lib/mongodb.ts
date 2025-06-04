import { MongoClient, Db, Collection, MongoClientOptions, Document, WithId } from 'mongodb';

declare global {
  // This allows us to have a single connection across hot reloads
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/il-buco-cleaners';

if (!MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

// Connection options with retryWrites and server selection timeout
const mongoOptions: MongoClientOptions = {
  serverSelectionTimeoutMS: 5000, // 5 second timeout
  connectTimeoutMS: 10000, // 10 second connection timeout
  retryWrites: true,
  retryReads: true
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(MONGODB_URI, mongoOptions);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(MONGODB_URI, mongoOptions);
  clientPromise = client.connect();
}

export interface DatabaseConnection {
  db: Db;
  client: MongoClient;
  collection: <T extends Document = Document>(name: string) => Collection<T>;
}

export async function connectToDatabase(): Promise<DatabaseConnection> {
  try {
    // If we're in a build context, return a mock db
    const isBuildProcess = process.env.NEXT_PHASE === 'phase-production-build' || process.env.NODE_ENV === 'production';
    
    if (isBuildProcess) {
      console.log('Build process detected, using mock database connection');
      const mockDb = {
        databaseName: 'mock-db',
        options: {},
        // Add other required Db properties with mock implementations
        listCollections: () => ({
          toArray: async () => [],
        }),
        collection: <T extends Document = Document>() => ({
          find: () => ({
            toArray: async (): Promise<WithId<T>[]> => [],
            sort: () => ({
              toArray: async (): Promise<WithId<T>[]> => []
            })
          }),
          findOne: async (): Promise<WithId<T> | null> => null,
          insertOne: async (): Promise<any> => ({}),
          updateOne: async (): Promise<any> => ({}),
          deleteOne: async (): Promise<any> => ({}),
          countDocuments: async (): Promise<number> => 0,
          aggregate: () => ({
            toArray: async () => [],
          }),
          listIndexes: () => ({
            toArray: async () => [],
          })
        } as unknown as Collection<T>)
      } as unknown as Db;

      return { 
        db: mockDb, 
        client: new MongoClient(MONGODB_URI, mongoOptions),
        collection: <T extends Document = Document>(name: string) => mockDb.collection<T>(name)
      };
    }

    // In development or production, return the real database connection
    const connectedClient = await clientPromise;
    const db = connectedClient.db();
    
    return { 
      db, 
      client: connectedClient,
      collection: <T extends Document = Document>(name: string) => db.collection<T>(name)
    };
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw new Error('Failed to connect to database');
  }
}

export async function getCollection<T extends Document = Document>(name: string): Promise<Collection<T>> {
  try {
    const database = await connectToDatabase();
    return database.collection<T>(name);
  } catch (error) {
    console.error(`Error getting collection ${name}:`, error);
    throw error;
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  if (client) {
    await client.close();
    console.log('MongoDB connection closed (SIGINT)');
    process.exit(0);
  }
});

process.on('SIGTERM', async () => {
  if (client) {
    await client.close();
    console.log('MongoDB connection closed (SIGTERM)');
  }
  process.exit(0);
});