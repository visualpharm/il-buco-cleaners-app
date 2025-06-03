import { NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    const { status, notes, beforePhoto, afterPhoto } = await request.json();
    
    const updates: any = {};
    if (status) updates.status = status;
    if (notes) updates.notes = notes;
    if (beforePhoto) updates.beforePhoto = beforePhoto;
    if (afterPhoto) updates.afterPhoto = afterPhoto;
    if (status === 'completed') updates.endTime = new Date();
    
    const session = await DatabaseService.updateSession(sessionId, updates);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(session);
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
    const session = await DatabaseService.getSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(session);
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}
