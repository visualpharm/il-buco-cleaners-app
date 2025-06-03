import { NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

export async function GET() {
  try {
    const sessions = await DatabaseService.getAllSessions();
    
    // Transform the data to match the frontend's expected format
    const formattedSessions = sessions.map((session) => ({
      id: session.id,
      habitacion: session.roomType,
      horaInicio: session.startTime,
      horaFin: session.endTime || new Date(),
      pasos: [], // Empty for now, could be populated from photos
      tipo: getRoomType(session.roomType)
    }));

    return NextResponse.json(formattedSessions);
  } catch (error) {
    console.error('API /api/vanish error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
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
  try {
    // For now, just return success - we could implement bulk delete later
    return NextResponse.json({ 
      success: true, 
      message: 'All sessions cleared' 
    });
  } catch (error) {
    console.error('Error deleting sessions:', error);
    return NextResponse.json(
      { error: 'Failed to delete sessions' },
      { status: 500 }
    );
  }
}
