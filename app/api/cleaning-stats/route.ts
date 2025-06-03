import { NextResponse } from 'next/server';
import { getTodaysCleaningStats } from '@/lib/cleaningSessions';

export async function GET() {
  try {
    // In a real implementation, you would get the D1 database from the environment
    // const db = (process.env as any).DB as D1Database;
    // For now, we'll return mock data
    
    // Mock data - replace with actual database call
    const mockData = {
      totalSpaces: 3,
      totalTimeMinutes: 135, // 2h 15m
      lastCleaned: new Date().toISOString()
    };
    
    return NextResponse.json(mockData);
    
    // Uncomment this when D1 is set up:
    // const stats = await getTodaysCleaningStats(db);
    // return NextResponse.json({
    //   spacesCleaned: stats.totalSpaces,
    //   totalTimeMinutes: stats.totalTimeMinutes,
    //   lastCleaned: stats.lastCleaned?.toISOString() || null
    // });
  } catch (error) {
    console.error('Error fetching cleaning stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cleaning stats' },
      { status: 500 }
    );
  }
}
