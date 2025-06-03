-- Enable WAL mode for better concurrency
PRAGMA journal_mode=WAL;

CREATE TABLE IF NOT EXISTS cleaning_sessions (
  id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
  room_name TEXT NOT NULL,
  start_time TEXT NOT NULL, -- ISO8601 string
  end_time TEXT NOT NULL,   -- ISO8601 string
  steps_completed INTEGER NOT NULL,
  total_steps INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for querying by date
CREATE INDEX IF NOT EXISTS idx_cleaning_sessions_end_time ON cleaning_sessions(end_time);

-- Index for querying by room
CREATE INDEX IF NOT EXISTS idx_cleaning_sessions_room_name ON cleaning_sessions(room_name);
