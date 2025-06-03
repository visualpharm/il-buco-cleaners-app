import { NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Add user agent and other browser info
    const userAgent = request.headers.get('user-agent') || '';
    
    const clickEvent = await DatabaseService.saveClickEvent({
      id: uuidv4(),
      element: data.element || '',
      page: data.page || '',
      timestamp: new Date(),
      userAgent,
      sessionId: data.sessionId
    });
    
    return NextResponse.json({ success: true, id: clickEvent.id });
  } catch (error) {
    console.error('Error in track-click endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
