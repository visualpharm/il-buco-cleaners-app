// This file will be used in the Cloudflare Workers environment
// with access to the D1 database through the `env` object

interface ClickData {
  elementId: string;
  elementType: string;
  pageUrl: string;
  xPosition?: number;
  yPosition?: number;
  userAgent?: string;
  screenResolution?: string;
  referrer?: string;
}

export interface Env {
  DB: D1Database;
}

export async function trackClick(env: Env, clickData: ClickData) {
  try {
    await env.DB.prepare(
      `INSERT INTO clicks (
        element_id,
        element_type,
        page_url,
        x_position,
        y_position,
        user_agent,
        screen_resolution,
        referrer
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      clickData.elementId,
      clickData.elementType,
      clickData.pageUrl,
      clickData.xPosition || null,
      clickData.yPosition || null,
      clickData.userAgent || '',
      clickData.screenResolution || '',
      clickData.referrer || ''
    ).run();
    
    return { success: true };
  } catch (error) {
    console.error('Error tracking click:', error);
    return { success: false, error };
  }
}

export async function getClickAnalytics(env: Env) {
  try {
    const { results } = await env.DB.prepare(
      `SELECT 
        element_id as elementId,
        element_type as elementType,
        page_url as pageUrl,
        COUNT(*) as clickCount,
        MAX(timestamp) as lastClicked
      FROM clicks
      GROUP BY element_id, element_type, page_url
      ORDER BY clickCount DESC`
    ).all();
    
    return { success: true, data: results };
  } catch (error) {
    console.error('Error fetching click analytics:', error);
    return { success: false, error };
  }
}
