import { NextResponse } from 'next/server';
import { getD1Client } from '@/lib/d1';

// Add runtime configuration
export const runtime = 'edge'; // Use edge runtime for D1 compatibility

// Helper function to handle database errors
function handleDatabaseError(error: unknown, context: string) {
  console.error(`Database error in ${context}:`, error);
  return NextResponse.json(
    { error: `Failed to ${context}` },
    { status: 500 }
  );
}

export async function GET() {
  try {
    const d1 = getD1Client();
    
    // First, get all cleaning sessions
    const sessionsQuery = `
      SELECT 
        id, 
        room_type as roomName,
        status,
        started_at as startTime,
        completed_at as endTime,
        notes
      FROM cleaning_sessions
      ORDER BY started_at DESC
    `;
    
    const sessionsResult = await d1.query<{
      id: string;
      roomName: string;
      status: string;
      startTime: string;
      endTime: string;
      notes: string | null;
    }>(sessionsQuery);

    if (!sessionsResult.results || sessionsResult.results.length === 0) {
      return NextResponse.json([]);
    }

    // For each session, get its checklist items and photos
    const sessions = await Promise.all(
      sessionsResult.results.map(async (session) => {
        try {
          const itemsQuery = `
            SELECT 
              ci.id,
              ci.item_id as itemId,
              ci.category,
              ci.text,
              ci.is_completed as isCompleted,
              ci.completed_at as completedAt,
              (SELECT photo_url FROM photos p WHERE p.item_id = ci.id LIMIT 1) as photo
            FROM checklist_items ci
            WHERE ci.session_id = ?
          `;
          
          const itemsResult = await d1.query<{
            id: number;
            itemId: number;
            category: string;
            text: string;
            isCompleted: boolean;
            completedAt: string | null;
            photo: string | null;
          }>(itemsQuery, [session.id]);
          
          return {
            ...session,
            checklistItems: itemsResult.results || []
          };
        } catch (error) {
          console.error(`Error fetching items for session ${session.id}:`, error);
          return {
            ...session,
            checklistItems: [],
            checklistError: (error instanceof Error ? error.message : String(error))
          };
        }
      })
    );

    // Transform the data to match the frontend's expected format
    const formattedSessions = sessions.map((session) => {
      try {
        return {
          id: session.id,
          habitacion: session.roomName,
          horaInicio: new Date(session.startTime),
          horaFin: new Date(session.endTime),
          pasos: (session.checklistItems || []).map((item) => ({
            id: item.itemId,
            tipoFoto: item.category,
            horaInicio: new Date(session.startTime),
            horaCompletado: item.isCompleted && item.completedAt ? new Date(item.completedAt) : undefined,
            foto: item.photo || undefined,
            validacionIA: item.isCompleted ? { 
              esValida: true, 
              analisis: { 
                esperaba: item.text, 
                encontro: item.text 
              } 
            } : undefined
          })),
          tipo: getRoomType(session.roomName)
        };
      } catch (error) {
        console.error(`Error formatting session ${session.id}:`, error);
        return null;
      }
    }).filter(Boolean); // Remove any null entries from failed formatting

    return NextResponse.json(formattedSessions);
  } catch (error) {
    console.error('API /api/vanish error:', error);
    // Return error details in response for debugging
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)), stack: (error instanceof Error ? error.stack : undefined) }, { status: 500 });
  }
}

// Helper function to determine room type
function getRoomType(roomName: string): string {
  const lowerName = roomName.toLowerCase();
  if (lowerName.includes('parrilla')) return 'parrilla';
  if (lowerName.includes('escalera')) return 'escalera';
  return 'habitacion';
}

export async function DELETE() {
  const d1 = getD1Client();
  
  try {
    // Start a transaction
    await d1.execute('BEGIN TRANSACTION');
    
    try {
      // Delete photos first due to foreign key constraints
      await d1.execute('DELETE FROM photos');
      
      // Then delete checklist items
      await d1.execute('DELETE FROM checklist_items');
      
      // Finally delete the sessions
      const result = await d1.execute('DELETE FROM cleaning_sessions');
      
      // Commit the transaction
      await d1.execute('COMMIT');
      
      return NextResponse.json({ 
        success: true, 
        deletedCount: result.meta.changes 
      });
    } catch (error) {
      // Rollback on error
      await d1.execute('ROLLBACK');
      throw error;
    }
  } catch (error) {
    return handleDatabaseError(error, 'delete cleaning sessions');
  }
}
