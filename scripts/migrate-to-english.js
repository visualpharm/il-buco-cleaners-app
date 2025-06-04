#!/usr/bin/env node

/**
 * Migration script to convert Spanish database field names to English
 * while keeping the UI in Spanish.
 * 
 * This script:
 * 1. Renames collections if needed
 * 2. Transforms all documents to use English field names
 * 3. Creates indexes on new collections
 * 4. Validates the migration
 */

const { MongoClient } = require('mongodb');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/il-buco-cleaners';
const DRY_RUN = process.env.DRY_RUN === 'true';

// Field name mappings
const FIELD_MAPPINGS = {
  // Main document fields
  habitacion: 'room',
  tipo: 'type',
  horaInicio: 'startTime',
  horaFin: 'endTime',
  pasos: 'steps',
  sesionId: 'sessionId',
  completa: 'complete',
  fallado: 'failed',
  fotoFalla: 'failurePhoto',
  
  // Step fields (nested in pasos/steps array)
  horaCompletado: 'completedTime',
  tiempoTranscurrido: 'elapsedTime',
  tipoFoto: 'photoType'
};

// Collection mappings
const COLLECTION_MAPPINGS = {
  // Keep existing collections as they're already in English
  checklistProgress: 'checklistProgress',
  cleaningSessions: 'cleaningSessions',
  photos: 'photos',
  clickEvents: 'clickEvents'
};

/**
 * Transform a document by converting Spanish field names to English
 */
function transformDocument(doc) {
  const transformed = {};
  
  for (const [key, value] of Object.entries(doc)) {
    const newKey = FIELD_MAPPINGS[key] || key;
    
    if (key === 'pasos' && Array.isArray(value)) {
      // Transform steps array
      transformed[newKey] = value.map(step => transformDocument(step));
    } else {
      transformed[newKey] = value;
    }
  }
  
  return transformed;
}

/**
 * Migrate a collection
 */
async function migrateCollection(db, sourceCollection, targetCollection) {
  console.log(`\n🔄 Migrating collection: ${sourceCollection} -> ${targetCollection}`);
  
  const source = db.collection(sourceCollection);
  const target = db.collection(targetCollection);
  
  // Get total document count
  const totalDocs = await source.countDocuments();
  console.log(`📊 Found ${totalDocs} documents to migrate`);
  
  if (totalDocs === 0) {
    console.log('⚠️  No documents found, skipping...');
    return;
  }
  
  // Process documents in batches
  const batchSize = 100;
  let processed = 0;
  
  const cursor = source.find({});
  
  while (await cursor.hasNext()) {
    const batch = [];
    
    // Collect batch
    for (let i = 0; i < batchSize && await cursor.hasNext(); i++) {
      const doc = await cursor.next();
      const transformed = transformDocument(doc);
      batch.push(transformed);
    }
    
    if (batch.length === 0) break;
    
    if (!DRY_RUN) {
      // Insert transformed documents
      await target.insertMany(batch, { ordered: false });
    }
    
    processed += batch.length;
    console.log(`✅ Processed ${processed}/${totalDocs} documents`);
  }
  
  console.log(`✨ Migration completed for ${sourceCollection}`);
}

/**
 * Create indexes on new collections
 */
async function createIndexes(db) {
  console.log('\n📝 Creating indexes...');
  
  const checklistProgress = db.collection('checklistProgress');
  
  if (!DRY_RUN) {
    // Create useful indexes
    await checklistProgress.createIndex({ room: 1, startTime: -1 });
    await checklistProgress.createIndex({ sessionId: 1 });
    await checklistProgress.createIndex({ startTime: -1 });
    await checklistProgress.createIndex({ complete: 1 });
    await checklistProgress.createIndex({ failed: 1 });
  }
  
  console.log('✅ Indexes created');
}

/**
 * Validate migration
 */
async function validateMigration(db) {
  console.log('\n🔍 Validating migration...');
  
  const checklistProgress = db.collection('checklistProgress');
  
  // Check document count
  const count = await checklistProgress.countDocuments();
  console.log(`📊 Total documents in migrated collection: ${count}`);
  
  // Check for English field names
  const sampleDoc = await checklistProgress.findOne({});
  if (sampleDoc) {
    const hasEnglishFields = sampleDoc.room && sampleDoc.startTime && sampleDoc.steps;
    const hasSpanishFields = sampleDoc.habitacion || sampleDoc.horaInicio || sampleDoc.pasos;
    
    if (hasEnglishFields && !hasSpanishFields) {
      console.log('✅ Field names successfully converted to English');
    } else {
      console.log('❌ Migration validation failed - Spanish fields still present');
      console.log('Sample document keys:', Object.keys(sampleDoc));
    }
  }
}

/**
 * Main migration function
 */
async function runMigration() {
  console.log('🚀 Starting database migration to English field names');
  console.log(`📍 Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE MIGRATION'}`);
  console.log(`🔗 Database: ${MONGODB_URI}`);
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    
    // List existing collections
    const collections = await db.listCollections().toArray();
    console.log('\n📋 Current collections:', collections.map(c => c.name));
    
    // Check if we already have migrated data
    const hasChecklistProgress = collections.some(c => c.name === 'checklistProgress');
    
    if (hasChecklistProgress) {
      // Check if data is already in English format
      const sample = await db.collection('checklistProgress').findOne({});
      if (sample && sample.room) {
        console.log('✅ Data already appears to be in English format');
        
        if (!DRY_RUN) {
          console.log('🔄 Running validation anyway...');
          await validateMigration(db);
        }
        return;
      }
    }
    
    // Run migration
    if (hasChecklistProgress) {
      await migrateCollection(db, 'checklistProgress', 'checklistProgress_english');
      
      if (!DRY_RUN) {
        // Backup original collection
        await db.collection('checklistProgress').rename('checklistProgress_spanish_backup');
        // Move new collection to original name
        await db.collection('checklistProgress_english').rename('checklistProgress');
      }
    }
    
    // Create indexes
    await createIndexes(db);
    
    // Validate
    if (!DRY_RUN) {
      await validateMigration(db);
    }
    
    console.log('\n🎉 Migration completed successfully!');
    
    if (DRY_RUN) {
      console.log('\n⚠️  This was a DRY RUN. To apply changes, run:');
      console.log('MONGODB_URI=your_connection_string node scripts/migrate-to-english.js');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Usage: node scripts/migrate-to-english.js [options]

Options:
  --help, -h     Show this help message
  --dry-run      Run migration in dry-run mode (no changes made)

Environment variables:
  MONGODB_URI    MongoDB connection string (default: mongodb://localhost:27017/il-buco-cleaners)
  DRY_RUN        Set to 'true' for dry-run mode

Examples:
  # Dry run
  DRY_RUN=true node scripts/migrate-to-english.js
  
  # Live migration
  MONGODB_URI=mongodb://localhost:27017/il-buco-cleaners node scripts/migrate-to-english.js
  `);
  process.exit(0);
}

// Run migration
if (require.main === module) {
  runMigration().catch(console.error);
}

module.exports = { runMigration, transformDocument, FIELD_MAPPINGS };