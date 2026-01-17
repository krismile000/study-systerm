-- 001_initial.sql - 初始数据库结构

-- 用户表
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

-- 插入初始成就数据
INSERT INTO achievement_defs (code, name, description, kind, target_value, icon, color)
VALUES 
  ('streak_3', '连续学习 3 天', '连续学习 3 天', 'streak_days', 3, '🔥', '#f59e0b'),
  ('streak_7', '连续学习 7 天', '连续学习 7 天', 'streak_days', 7, '🔥', '#f59e0b'),
  ('streak_30', '连续学习 30 天', '连续学习 30 天', 'streak_days', 30, '🔥', '#f59e0b'),
  ('total_10h', '累计 10 小时', '累计学习达到 10 小时', 'total_hours', 10, '⏱️', '#14b8a6'),
  ('total_50h', '累计 50 小时', '累计学习达到 50 小时', 'total_hours', 50, '⏱️', '#14b8a6'),
  ('total_100h', '累计 100 小时', '累计学习达到 100 小时', 'total_hours', 100, '⏱️', '#14b8a6'),
  ('single_45m', '专注 45 分钟', '单次专注达到 45 分钟', 'single_session_minutes', 45, '🎯', '#3b82f6'),
  ('single_90m', '专注 90 分钟', '单次专注达到 90 分钟', 'single_session_minutes', 90, '🎯', '#3b82f6')
ON CONFLICT(code) DO NOTHING;