// 数据库初始化
import sqlite3 from 'better-sqlite3';

let db = null;

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDb first.');
  }
  return db;
}

export function initDb() {
  // 使用环境变量或默认路径的SQLite数据库
  // Netlify Functions使用/tmp目录存储临时文件
  const dbPath = process.env.DB_PATH || './backend/data.sqlite';
  db = sqlite3(dbPath);

  // 创建users表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT,
      avatar_url TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);

  // 创建sessions表（学习记录会话）
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      task TEXT NOT NULL,
      category TEXT NOT NULL,
      started_at TEXT NOT NULL,
      ended_at TEXT NOT NULL,
      duration_seconds INTEGER NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 创建goals表
  db.exec(`
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      target_value INTEGER NOT NULL,
      due_date TEXT,
      status TEXT DEFAULT 'in_progress',
      created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      completed_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 创建achievement_defs表
  db.exec(`
    CREATE TABLE IF NOT EXISTS achievement_defs (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      kind TEXT NOT NULL,
      target_value INTEGER NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL
    );
  `);

  // 创建user_achievements表
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_achievements (
      user_id INTEGER NOT NULL,
      code TEXT NOT NULL,
      unlocked_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (code) REFERENCES achievement_defs(code) ON DELETE CASCADE,
      UNIQUE(user_id, code)
    );
  `);

  // 索引优化
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);
    CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
  `);

  // 初始化成就数据
  seedAchievements();
}

// 初始化成就数据
function seedAchievements() {
  const db = getDb();

  // 检查是否已有成就数据
  const existingAchievements = db.prepare('SELECT COUNT(*) as count FROM achievement_defs').get();
  if (existingAchievements.count > 0) {
    return; // 已有数据，跳过初始化
  }

  // 插入初始成就
  const achievements = [
    {
      code: 'first_session',
      name: '学习新手',
      description: '完成第一次学习记录',
      kind: 'total_hours',
      target_value: 1,
      icon: '📚',
      color: '#4CAF50'
    },
    {
      code: 'learner_10h',
      name: '学习达人',
      description: '累计学习10小时',
      kind: 'total_hours',
      target_value: 10,
      icon: '🏆',
      color: '#FFC107'
    },
    {
      code: 'expert_50h',
      name: '学习专家',
      description: '累计学习50小时',
      kind: 'total_hours',
      target_value: 50,
      icon: '🎓',
      color: '#2196F3'
    },
    {
      code: 'master_100h',
      name: '学习大师',
      description: '累计学习100小时',
      kind: 'total_hours',
      target_value: 100,
      icon: '👑',
      color: '#9C27B0'
    },
    {
      code: 'streak_3d',
      name: '连续学习者',
      description: '连续学习3天',
      kind: 'streak_days',
      target_value: 3,
      icon: '🔥',
      color: '#FF5722'
    },
    {
      code: 'single_30m',
      name: '专注达人',
      description: '单次学习30分钟',
      kind: 'single_session_minutes',
      target_value: 30,
      icon: '⏱️',
      color: '#795548'
    },
    {
      code: 'single_60m',
      name: '专注大师',
      description: '单次学习60分钟',
      kind: 'single_session_minutes',
      target_value: 60,
      icon: '✨',
      color: '#FF9800'
    },
    {
      code: 'streak_7d',
      name: '学习习惯养成',
      description: '连续学习7天',
      kind: 'streak_days',
      target_value: 7,
      icon: '🌱',
      color: '#8BC34A'
    }
  ];

  // 批量插入成就
  const stmt = db.prepare(`
    INSERT INTO achievement_defs (code, name, description, kind, target_value, icon, color)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const achievement of achievements) {
    stmt.run(
      achievement.code,
      achievement.name,
      achievement.description,
      achievement.kind,
      achievement.target_value,
      achievement.icon,
      achievement.color
    );
  }

  // 移除finalize()调用，better-sqlite3会自动处理资源释放
}
