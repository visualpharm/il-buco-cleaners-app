import { trackClick, getClickAnalytics } from '../services/clickService';

// Handle incoming requests
async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleOptions(request);
  }

  // Route requests
  if (path === '/api/track-click' && request.method === 'POST') {
    return handleTrackClick(request, env);
  } else if (path === '/api/analytics' && request.method === 'GET') {
    return handleGetAnalytics(request, env);
  }

  // Return 404 for unknown routes
  return new Response('Not found', { status: 404 });
}

// Handle CORS preflight requests
function handleOptions(request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
  return new Response(null, { headers });
}

// Handle click tracking
async function handleTrackClick(request, env) {
  try {
    const data = await request.json();
    const result = await trackClick(env, data);
    
    if (!result.success) {
      throw new Error('Failed to track click');
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error tracking click:', error);
    return new Response(JSON.stringify({ error: 'Failed to track click' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

// Handle analytics requests
async function handleGetAnalytics(request, env) {
  try {
    const result = await getClickAnalytics(env);
    
    if (!result.success) {
      throw new Error('Failed to fetch analytics');
    }
    
    return new Response(JSON.stringify(result.data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch analytics' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

// Export the worker
const worker = {
  async fetch(request, env) {
    return handleRequest(request, env);
  },
};

export default worker;
