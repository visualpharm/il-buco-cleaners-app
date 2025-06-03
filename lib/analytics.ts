// Analytics utility for click tracking with MongoDB backend

interface TrackClickOptions {
  elementId: string;
  elementType: string;
  pageUrl: string;
  xPosition?: number;
  yPosition?: number;
  screenResolution?: string;
  userAgent?: string;
  referrer?: string;
}

export async function trackClick(options: TrackClickOptions): Promise<boolean> {
  try {
    const response = await fetch('/api/track-click', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        element: `${options.elementType}#${options.elementId}`,
        page: options.pageUrl,
        userAgent: options.userAgent,
        position: options.xPosition && options.yPosition ? {
          x: options.xPosition,
          y: options.yPosition
        } : undefined,
        screenResolution: options.screenResolution,
        referrer: options.referrer
      }),
    });

    if (!response.ok) {
      console.error('Failed to track click:', response.statusText);
      return false;
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error tracking click:', error);
    return false;
  }
}

// Analytics helper functions
export function getSessionId(): string {
  // Generate or retrieve session ID from sessionStorage
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2, 15) + 
                Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}

export function getUserId(): string {
  // Generate or retrieve user ID from localStorage
  let userId = localStorage.getItem('analytics_user_id');
  if (!userId) {
    userId = Math.random().toString(36).substring(2, 15) + 
             Math.random().toString(36).substring(2, 15);
    localStorage.setItem('analytics_user_id', userId);
  }
  return userId;
}