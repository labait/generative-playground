-- Users (populated on first Microsoft SSO login)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  microsoft_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  role TEXT DEFAULT 'student',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);

CREATE TABLE IF NOT EXISTS quota_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  standard_monthly INTEGER DEFAULT 200,
  hires_monthly INTEGER DEFAULT 20,
  reset_day INTEGER DEFAULT 1,
  active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS usage_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  job_id TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt TEXT,
  params TEXT,
  status TEXT DEFAULT 'pending',
  image_url TEXT,
  local_path TEXT,
  media_access_token TEXT,
  cost_credits INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_usage_log_user ON usage_log(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_log_job ON usage_log(job_id);

CREATE TABLE IF NOT EXISTS quota_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  month TEXT NOT NULL,
  standard_used INTEGER DEFAULT 0,
  hires_used INTEGER DEFAULT 0,
  UNIQUE(user_id, month)
);
