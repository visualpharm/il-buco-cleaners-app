import pool from './db';
import { CleaningSession, ChecklistItem, Photo } from '@/types/database';

export async function createCleaningSession(roomType: string, checklistItems: any[]) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Create new cleaning session
    const sessionRes = await client.query(
      'INSERT INTO cleaning_sessions (room_type) VALUES ($1) RETURNING id',
      [roomType]
    );
    
    const sessionId = sessionRes.rows[0].id;
    
    // Insert checklist items
    for (const item of checklistItems) {
      await client.query(
        `INSERT INTO checklist_items 
         (session_id, item_id, category, text, is_completed) 
         VALUES ($1, $2, $3, $4, $5)`,
        [sessionId, item.id, item.categoria, item.texto, false]
      );
    }
    
    await client.query('COMMIT');
    return sessionId;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function getCleaningSession(sessionId: number): Promise<CleaningSession | null> {
  const result = await pool.query(
    `SELECT cs.*, 
            json_agg(ci.*) as checklist_items,
            (SELECT json_agg(p.*) 
             FROM photos p 
             WHERE p.session_id = cs.id) as photos
     FROM cleaning_sessions cs
     LEFT JOIN checklist_items ci ON ci.session_id = cs.id
     WHERE cs.id = $1
     GROUP BY cs.id`,
    [sessionId]
  );
  
  return result.rows[0] || null;
}

export async function updateChecklistItem(
  sessionId: number, 
  itemId: number, 
  isCompleted: boolean, 
  photoUrl?: string
): Promise<void> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Update checklist item status
    await client.query(
      `UPDATE checklist_items 
       SET is_completed = $1, completed_at = $2
       WHERE session_id = $3 AND id = $4`,
      [isCompleted, isCompleted ? new Date() : null, sessionId, itemId]
    );
    
    // If there's a photo URL, save it
    if (photoUrl) {
      await client.query(
        `INSERT INTO photos (session_id, item_id, photo_url)
         VALUES ($1, $2, $3)`,
        [sessionId, itemId, photoUrl]
      );
    }
    
    // If marking as complete, check if all items are complete
    if (isCompleted) {
      const result = await client.query(
        `SELECT COUNT(*) as total, 
                SUM(CASE WHEN is_completed = true THEN 1 ELSE 0 END) as completed
         FROM checklist_items 
         WHERE session_id = $1`,
        [sessionId]
      );
      
      const { total, completed } = result.rows[0];
      
      if (total === completed) {
        await client.query(
          `UPDATE cleaning_sessions 
           SET status = 'completed', completed_at = CURRENT_TIMESTAMP 
           WHERE id = $1`,
          [sessionId]
        );
      }
    }
    
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function getCleaningSessions(): Promise<CleaningSession[]> {
  const result = await pool.query(
    `SELECT cs.*, 
            json_agg(ci.*) as checklist_items,
            (SELECT json_agg(p.*) 
             FROM photos p 
             WHERE p.session_id = cs.id) as photos
     FROM cleaning_sessions cs
     LEFT JOIN checklist_items ci ON ci.session_id = cs.id
     GROUP BY cs.id
     ORDER BY cs.started_at DESC`
  );
  
  return result.rows;
}
