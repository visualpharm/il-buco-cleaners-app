import { NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

export async function GET() {
  try {
    const stats = await DatabaseService.getSessionStats();
    const sessions = await DatabaseService.getAllSessions();
    
    // Calculate total time from all sessions
    const totalTimeMinutes = sessions.reduce((total, session) => {
      if (session.startTime && session.endTime) {
        const duration = Math.round((session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60));
        return total + duration;
      }
      return total;
    }, 0);
    
    // Get last cleaned session
    const lastCleanedSession = sessions.length > 0 ? sessions[0] : null;
    
    return NextResponse.json({
      totalSpaces: stats.completed,
      totalTimeMinutes,
      lastCleaned: lastCleanedSession?.endTime?.toISOString() || null
    });
  } catch (error) {
    console.error('Error fetching cleaning stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cleaning stats' },
      { status: 500 }
    );
  }
}
