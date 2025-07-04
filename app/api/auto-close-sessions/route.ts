import { NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

export async function POST() {
  try {
    // Get all checklist progress records
    const allProgress = await DatabaseService.getAllChecklistProgress();
    
    const now = new Date();
    let closedCount = 0;
    const closedSessions = [];

    // Filter and close sessions that:
    // 1. Don't have an endTime (still in progress)
    // 2. Have been running for more than 12 hours
    for (const progress of allProgress) {
      if (!progress.endTime && progress.startTime) {
        const sessionDuration = now.getTime() - new Date(progress.startTime).getTime();
        
        if (sessionDuration > TWELVE_HOURS_MS) {
          // Auto-close the session
          const updated = await DatabaseService.updateChecklistProgress(progress.id, {
            endTime: now,
            complete: true,
            reason: 'Auto-closed: Session exceeded 12 hours'
          });
          
          if (updated) {
            closedCount++;
            closedSessions.push({
              id: progress.id,
              room: progress.room,
              startTime: progress.startTime,
              endTime: now,
              duration: sessionDuration / 1000 / 60 / 60 // hours
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Auto-closed ${closedCount} session(s) exceeding 12 hours`,
      closedSessions,
      timestamp: now.toISOString()
    });
  } catch (error) {
    console.error('Error auto-closing sessions:', error);
    return NextResponse.json(
      { 
        error: 'Failed to auto-close sessions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check which sessions would be auto-closed without actually closing them
export async function GET() {
  try {
    const allProgress = await DatabaseService.getAllChecklistProgress();
    const now = new Date();
    const longRunningSessions = [];

    for (const progress of allProgress) {
      if (!progress.endTime && progress.startTime) {
        const sessionDuration = now.getTime() - new Date(progress.startTime).getTime();
        
        if (sessionDuration > TWELVE_HOURS_MS) {
          longRunningSessions.push({
            id: progress.id,
            room: progress.room,
            startTime: progress.startTime,
            duration: sessionDuration / 1000 / 60 / 60, // hours
            wouldBeClosedAt: now.toISOString()
          });
        }
      }
    }

    return NextResponse.json({
      count: longRunningSessions.length,
      sessions: longRunningSessions,
      message: `Found ${longRunningSessions.length} session(s) exceeding 12 hours`
    });
  } catch (error) {
    console.error('Error checking long-running sessions:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check long-running sessions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}