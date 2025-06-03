import { NextResponse } from 'next/server';
import { getD1Client } from '@/lib/d1';

export async function GET() {
  try {
    const d1 = getD1Client();
    
    // Test the database connection with a simple query
    const result = await d1.query('SELECT name FROM sqlite_master WHERE type = ?', ['table']);
    
    return NextResponse.json({
      success: true,
      tables: result.results || [],
      meta: result.meta
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to connect to database',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
