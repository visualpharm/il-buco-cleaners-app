import { NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    const session = await DatabaseService.createSession({
      id: uuidv4(),
      cleanerId: 'default',
      roomType: data.roomName,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      status: 'completed',
      notes: `Completed ${data.stepsCompleted}/${data.totalSteps} steps in ${data.durationMinutes} minutes`
    });
    
    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error('Error saving cleaning session:', error);
    return NextResponse.json(
      { error: 'Failed to save cleaning session' },
      { status: 500 }
    );
  }
}
