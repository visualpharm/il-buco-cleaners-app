interface ClickData {
  elementId: string;
  elementType: string;
  pageUrl: string;
  xPosition?: number;
  yPosition?: number;
  screenResolution?: string;
  userAgent?: string;
  referrer?: string;
}

export async function trackClick(clickData: ClickData): Promise<boolean> {
  try {
    const response = await fetch('https://ilbuco-cleaning.workers.dev/api/track-click', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...clickData,
        // Add any additional data you want to track
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to track click');
    }

    return true;
  } catch (error) {
    console.error('Error tracking click:', error);
    return false;
  }
}

export async function getAnalytics() {
  try {
    const response = await fetch('https://ilbuco-cleaning.workers.dev/api/analytics');
    
    if (!response.ok) {
      throw new Error('Failed to fetch analytics');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw error;
  }
}
