export interface DBCleaningSession {
  id: string;
  room_name: string;
  start_time: string;
  end_time: string;
  steps_completed: number;
  total_steps: number;
  duration_minutes: number;
  created_at: string;
}

export interface CleaningSession {
  id: string;
  roomName: string;
  startTime: Date;
  endTime: Date;
  stepsCompleted: number;
  totalSteps: number;
  durationMinutes: number;
  createdAt: Date;
}

export async function saveCleaningSession(
  db: D1Database,
  session: Omit<CleaningSession, 'id'>
): Promise<CleaningSession> {
  const { roomName, startTime, endTime, stepsCompleted, totalSteps, durationMinutes } = session;
  
  const stmt = await db.prepare(
    `INSERT INTO cleaning_sessions 
     (room_name, start_time, end_time, steps_completed, total_steps, duration_minutes)
     VALUES (?, ?, ?, ?, ?, ?)
     RETURNING *`
  );
  
  const result = await stmt.bind(
    roomName,
    startTime.toISOString(),
    endTime.toISOString(),
    stepsCompleted,
    totalSteps,
    durationMinutes
  ).first<DBCleaningSession>();
  
  if (!result) throw new Error('Failed to save cleaning session');
  
  return {
    id: result.id,
    roomName: result.room_name,
    startTime: new Date(result.start_time),
    endTime: new Date(result.end_time),
    stepsCompleted: result.steps_completed,
    totalSteps: result.total_steps,
    durationMinutes: result.duration_minutes,
    createdAt: new Date(result.created_at)
  };
}

export async function getLastCleaningSession(db: D1Database): Promise<CleaningSession | null> {
  const stmt = await db.prepare(
    `SELECT * FROM cleaning_sessions 
     ORDER BY end_time DESC 
     LIMIT 1`
  );
  
  const result = await stmt.first<DBCleaningSession>();
  if (!result) return null;
  
  return {
    id: result.id,
    roomName: result.room_name,
    startTime: new Date(result.start_time),
    endTime: new Date(result.end_time),
    stepsCompleted: result.steps_completed,
    totalSteps: result.total_steps,
    durationMinutes: result.duration_minutes,
    createdAt: new Date(result.created_at)
  };
}

export async function getTodaysCleaningStats(db: D1Database): Promise<{
  totalSpaces: number;
  totalTimeMinutes: number;
  lastCleaned: Date | null;
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const stmt = await db.prepare(
    `SELECT 
       COUNT(DISTINCT room_name) as total_spaces,
       SUM(duration_minutes) as total_minutes,
       MAX(end_time) as last_cleaned
     FROM cleaning_sessions 
     WHERE DATE(end_time) = DATE(?)`
  );
  
  interface StatsResult {
    total_spaces: number;
    total_minutes: number;
    last_cleaned: string | null;
  }
  
  const result = await stmt.bind(today.toISOString().split('T')[0]).first<StatsResult>();
  
  return {
    totalSpaces: result?.total_spaces || 0,
    totalTimeMinutes: result?.total_minutes || 0,
    lastCleaned: result?.last_cleaned ? new Date(result.last_cleaned) : null
  };
}
