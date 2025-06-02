import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { room_type, checklist_items } = await request.json();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create new cleaning session
      const sessionRes = await client.query(
        'INSERT INTO cleaning_sessions (room_type) VALUES ($1) RETURNING id',
        [room_type]
      );
      
      const sessionId = sessionRes.rows[0].id;
      
      // Insert checklist items
      for (const item of checklist_items) {
        await client.query(
          `INSERT INTO checklist_items 
           (session_id, item_id, category, text, is_completed) 
           VALUES ($1, $2, $3, $4, $5)`,
          [sessionId, item.id, item.categoria, item.texto, false]
        );
      }
      
      await client.query('COMMIT');
      
      return NextResponse.json({ sessionId }, { status: 201 });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
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
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
