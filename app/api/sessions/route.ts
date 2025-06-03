import { NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const { roomType, cleanerId, notes } = await request.json();
    
    const session = await DatabaseService.createSession({
      id: uuidv4(),
      cleanerId: cleanerId || 'default',
      roomType,
      startTime: new Date(),
      notes,
      status: 'in_progress'
    });
    
    return NextResponse.json({ sessionId: session.id }, { status: 201 });
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
    const sessions = await DatabaseService.getAllSessions();
    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
