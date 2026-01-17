import Database from 'better-sqlite3'

let db

export function getDb() {
  if (!db) {
    db = new Database('backend/data.sqlite')
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
  }
  return db
}

export function initDb() {
  const db = getDb()

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

    -- 学习会话（专注记录）
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      task TEXT NOT NULL,
      category TEXT NOT NULL,
      started_at TEXT NOT NULL,
      ended_at TEXT NOT NULL,
      duration_seconds INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_user_started ON sessions(user_id, started_at);

    -- 目标
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('daily_minutes','deadline_hours')),
      target_value INTEGER NOT NULL,
      due_date TEXT,
      status TEXT NOT NULL DEFAULT 'in_progress' CHECK(status IN ('in_progress','completed','expired')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_goals_user_status ON goals(user_id, status);

    -- 成就定义（固定表，按 code 唯一）
    CREATE TABLE IF NOT EXISTS achievement_defs (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      kind TEXT NOT NULL,
      target_value INTEGER NOT NULL,
      icon TEXT,
      color TEXT
    );

    -- 用户已解锁成就
    CREATE TABLE IF NOT EXISTS user_achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      code TEXT NOT NULL,
      unlocked_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, code),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(code) REFERENCES achievement_defs(code) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
  `)

  seedAchievements(db)
}

function seedAchievements(db) {
  const defs = [
    // streak
    { code: 'streak_3', name: '连续学习 3 天', description: '连续学习 3 天', kind: 'streak_days', target_value: 3, icon: '🔥', color: '#f59e0b' },
    { code: 'streak_7', name: '连续学习 7 天', description: '连续学习 7 天', kind: 'streak_days', target_value: 7, icon: '🔥', color: '#f59e0b' },
    { code: 'streak_30', name: '连续学习 30 天', description: '连续学习 30 天', kind: 'streak_days', target_value: 30, icon: '🔥', color: '#f59e0b' },

    // total hours
    { code: 'total_10h', name: '累计 10 小时', description: '累计学习达到 10 小时', kind: 'total_hours', target_value: 10, icon: '⏱️', color: '#14b8a6' },
    { code: 'total_50h', name: '累计 50 小时', description: '累计学习达到 50 小时', kind: 'total_hours', target_value: 50, icon: '⏱️', color: '#14b8a6' },
    { code: 'total_100h', name: '累计 100 小时', description: '累计学习达到 100 小时', kind: 'total_hours', target_value: 100, icon: '⏱️', color: '#14b8a6' },

    // single session minutes
    { code: 'single_45m', name: '专注 45 分钟', description: '单次专注达到 45 分钟', kind: 'single_session_minutes', target_value: 45, icon: '🎯', color: '#3b82f6' },
    { code: 'single_90m', name: '专注 90 分钟', description: '单次专注达到 90 分钟', kind: 'single_session_minutes', target_value: 90, icon: '🎯', color: '#3b82f6' },
  ]

  const insert = db.prepare(`
    INSERT INTO achievement_defs (code, name, description, kind, target_value, icon, color)
    VALUES (@code, @name, @description, @kind, @target_value, @icon, @color)
    ON CONFLICT(code) DO NOTHING
  `)

  const tx = db.transaction((rows) => {
    for (const row of rows) insert.run(row)
  })

  tx(defs)
}
