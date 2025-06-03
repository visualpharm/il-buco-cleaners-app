-- Create clicks table to track user interactions
CREATE TABLE IF NOT EXISTS clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  element_id TEXT NOT NULL,
  element_type TEXT NOT NULL,
  page_url TEXT NOT NULL,
  x_position INTEGER,
  y_position INTEGER,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  user_agent TEXT,
  screen_resolution TEXT,
  referrer TEXT
);

-- Create an index for faster lookups by element_id
CREATE INDEX IF NOT EXISTS idx_clicks_element_id ON clicks(element_id);

-- Create an index for time-based queries
CREATE INDEX IF NOT EXISTS idx_clicks_timestamp ON clicks(timestamp);
