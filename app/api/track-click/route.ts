import { NextResponse } from 'next/server';
import { trackClick } from '@/services/clickService';

// This will be replaced by the Cloudflare Workers environment
interface Env {
  DB: D1Database;
}

// This is a placeholder for the Cloudflare Workers environment
// In a Cloudflare Worker, this would be provided by the runtime
const env: Env = {
  get DB(): D1Database {
    throw new Error('DB not available in this environment');
  }
};

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Add user agent and other browser info
    const userAgent = request.headers.get('user-agent') || '';
    const referrer = request.headers.get('referer') || '';
    
    const clickData = {
      ...data,
      userAgent,
      referrer,
    };
    
    // In a Cloudflare Worker, the `env` object would be passed to the handler
    const result = await trackClick(env, clickData);
    
    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Failed to track click' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in track-click endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
