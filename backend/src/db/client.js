import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || "postgres://laba:laba@localhost:5432/laba",
});

export async function query(text, params) {
  return pool.query(text, params);
}

export async function getOne(text, params) {
  const { rows } = await pool.query(text, params);
  return rows[0] || null;
}

export async function getAll(text, params) {
  const { rows } = await pool.query(text, params);
  return rows;
}

export async function run(text, params) {
  const result = await pool.query(text, params);
  return { rowCount: result.rowCount, rows: result.rows };
}

export async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      microsoft_id TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      display_name TEXT,
      role TEXT DEFAULT 'student',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      last_login TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS quota_config (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      standard_monthly INTEGER DEFAULT 200,
      hires_monthly INTEGER DEFAULT 20,
      reset_day INTEGER DEFAULT 1,
      active BOOLEAN DEFAULT TRUE
    );

    CREATE TABLE IF NOT EXISTS usage_log (
      id SERIAL PRIMARY KEY,
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
      created_at TIMESTAMPTZ DEFAULT NOW(),
      completed_at TIMESTAMPTZ
    );

    CREATE INDEX IF NOT EXISTS idx_usage_log_user ON usage_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_usage_log_job ON usage_log(job_id);

    CREATE TABLE IF NOT EXISTS quota_usage (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) NOT NULL,
      month TEXT NOT NULL,
      standard_used INTEGER DEFAULT 0,
      hires_used INTEGER DEFAULT 0,
      UNIQUE(user_id, month)
    );
  `);
}

export { pool };
