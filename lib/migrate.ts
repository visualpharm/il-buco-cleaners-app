import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function runMigration() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Create cleaning_sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS cleaning_sessions (
        id SERIAL PRIMARY KEY,
        room_type VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'in_progress',
        started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP WITH TIME ZONE,
        notes TEXT
      );
    `);

    // Create checklist_items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS checklist_items (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES cleaning_sessions(id) ON DELETE CASCADE,
        item_id INTEGER NOT NULL,
        category VARCHAR(100) NOT NULL,
        text TEXT NOT NULL,
        is_completed BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMP WITH TIME ZONE,
        UNIQUE(session_id, item_id)
      );
    `);

    // Create photos table
    await client.query(`
      CREATE TABLE IF NOT EXISTS photos (
        id SERIAL PRIMARY KEY,
        session_id INTEGER REFERENCES cleaning_sessions(id) ON DELETE CASCADE,
        item_id INTEGER REFERENCES checklist_items(id) ON DELETE CASCADE,
        photo_url TEXT NOT NULL,
        uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query('COMMIT');
    console.log('Database migration completed successfully');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error during migration:', e);
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(console.error);
