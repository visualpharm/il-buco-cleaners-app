import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    const { itemId, isCompleted, photoUrl } = await request.json();
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
      return NextResponse.json({ success: true });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
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
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}
