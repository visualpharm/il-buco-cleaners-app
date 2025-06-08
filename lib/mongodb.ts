import { MongoClient, Db, Collection, MongoClientOptions, Document, WithId } from 'mongodb';

console.log('MongoDB module loaded');

declare global {
  // This allows us to have a single connection across hot reloads
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/il-buco-cleaners';

console.log('MongoDB URI:', MONGODB_URI);

if (!MONGODB_URI) {
  const error = new Error('Please add your MongoDB URI to .env.local');
  console.error('MongoDB URI not found:', error);
  throw error;
}

// Connection options with retryWrites and server selection timeout
const mongoOptions: MongoClientOptions = {
  serverSelectionTimeoutMS: 10000, // 10 second timeout
  connectTimeoutMS: 15000, // 15 second connection timeout
  socketTimeoutMS: 30000,  // 30 second socket timeout
  retryWrites: true,
  retryReads: true,
  maxPoolSize: 10,
};

console.log('MongoDB connection options:', JSON.stringify(mongoOptions, null, 2));

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

try {
  if (process.env.NODE_ENV === 'development') {
    console.log('Running in development mode');
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    if (!global._mongoClientPromise) {
      console.log('Creating new MongoDB client');
      client = new MongoClient(MONGODB_URI, mongoOptions);
      global._mongoClientPromise = client.connect()
        .then(connectedClient => {
          console.log('Successfully connected to MongoDB');
          return connectedClient;
        })
        .catch(error => {
          console.error('Failed to connect to MongoDB:', error);
          throw error;
        });
    } else {
      console.log('Using existing MongoDB client from global');
    }
    clientPromise = global._mongoClientPromise;
  } else {
    console.log('Running in production mode');
    // In production mode, it's best to not use a global variable.
    client = new MongoClient(MONGODB_URI, mongoOptions);
    clientPromise = client.connect()
      .then(connectedClient => {
        console.log('Successfully connected to MongoDB (production)');
        return connectedClient;
      })
      .catch(error => {
        console.error('Failed to connect to MongoDB (production):', error);
        throw error;
      });
  }
} catch (error) {
  console.error('Error setting up MongoDB client:', error);
  throw error;
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
    console.log('Connecting to MongoDB...');
    const connectedClient = await clientPromise;
    console.log('MongoDB client connected');
    
    const db = connectedClient.db();
    console.log('Using database:', db.databaseName);
    
    // Test the connection
    try {
      console.log('Testing database connection...');
      await db.command({ ping: 1 });
      console.log('Successfully connected to MongoDB server');
    } catch (err) {
      console.error('MongoDB connection test failed:', err);
      throw new Error(`Failed to connect to MongoDB: ${err instanceof Error ? err.message : String(err)}`);
    }
    
    return {
      db,
      client: connectedClient,
      collection: <T extends Document = Document>(name: string) => {
        console.log(`Accessing collection: ${name}`);
        return db.collection<T>(name);
      }
    };
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw new Error('Failed to connect to database');
  }
}

export async function getCollection<T extends Document = Document>(name: string): Promise<Collection<T>> {
  console.log(`getCollection called for: ${name}`);
  try {
    console.log('Calling connectToDatabase...');
    const database = await connectToDatabase();
    console.log('connectToDatabase completed');
    
    console.log(`Getting collection: ${name}`);
    const collection = database.collection<T>(name);
    console.log(`Successfully got collection: ${name}`);
    
    // Test the collection
    try {
      console.log(`Testing collection ${name}...`);
      await collection.countDocuments({});
      console.log(`Successfully accessed collection: ${name}`);
    } catch (err) {
      console.error(`Error accessing collection ${name}:`, err);
      throw new Error(`Failed to access collection ${name}: ${err instanceof Error ? err.message : String(err)}`);
    }
    
    return collection;
  } catch (error) {
    console.error(`Error in getCollection(${name}):`, error);
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