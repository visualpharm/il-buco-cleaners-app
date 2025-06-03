import { NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (sessionId) {
      // Get photos for a specific session
      const photos = await DatabaseService.getPhotosBySession(sessionId);
      return NextResponse.json({ photos });
    } else {
      // Get all photos (could be paginated in the future)
      const photos = await DatabaseService.getPhotosBySession(''); // Empty string gets all photos
      return NextResponse.json({ photos });
    }
  } catch (error) {
    console.error('Error listing photos:', error);
    return NextResponse.json(
      { error: 'Error al listar las fotos' },
      { status: 500 }
    );
  }
}
