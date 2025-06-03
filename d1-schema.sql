-- D1 Schema for Il Buco Cleaning App

-- Cleaning Sessions Table
CREATE TABLE IF NOT EXISTS cleaning_sessions (
  id TEXT PRIMARY KEY,
  room_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  notes TEXT
);

-- Checklist Items Table
CREATE TABLE IF NOT EXISTS checklist_items (
  id INTEGER PRIMARY KEY,
  session_id TEXT NOT NULL,
  item_id INTEGER NOT NULL,
  category TEXT NOT NULL,
  text TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES cleaning_sessions(id) ON DELETE CASCADE,
  UNIQUE(session_id, item_id)
);

-- Photos Table
CREATE TABLE IF NOT EXISTS photos (
  id INTEGER PRIMARY KEY,
  session_id TEXT NOT NULL,
  item_id INTEGER NOT NULL,
  photo_url TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES cleaning_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES checklist_items(id) ON DELETE CASCADE
);

-- Clicks Table (for analytics)
CREATE TABLE IF NOT EXISTS clicks (
  id INTEGER PRIMARY KEY,
  element_id TEXT NOT NULL,
  element_type TEXT NOT NULL,
  page_url TEXT NOT NULL,
  x_position INTEGER,
  y_position INTEGER,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_agent TEXT,
  screen_resolution TEXT,
  referrer TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_checklist_session ON checklist_items(session_id);
CREATE INDEX IF NOT EXISTS idx_photos_session ON photos(session_id);
CREATE INDEX IF NOT EXISTS idx_clicks_element ON clicks(element_id);
