import { getDb } from '../db.js'

export function getTotalSeconds(userId, { from, to } = {}) {
  const db = getDb()

  if (from && to) {
    const row = db
      .prepare(
        `SELECT COALESCE(SUM(duration_seconds), 0) AS total
         FROM sessions
         WHERE user_id = ? AND started_at >= ? AND started_at < ?`
      )
      .get(userId, from, to)
    return Number(row.total || 0)
  }

  const row = db
    .prepare('SELECT COALESCE(SUM(duration_seconds), 0) AS total FROM sessions WHERE user_id = ?')
    .get(userId)
  return Number(row.total || 0)
}

export function getDailyTotals(userId, { from, to }) {
  const db = getDb()
  return db
    .prepare(
      `SELECT substr(started_at, 1, 10) AS day, COALESCE(SUM(duration_seconds), 0) AS total
       FROM sessions
       WHERE user_id = ? AND started_at >= ? AND started_at < ?
       GROUP BY substr(started_at, 1, 10)
       ORDER BY day ASC`
    )
    .all(userId, from, to)
    .map((r) => ({ day: r.day, totalSeconds: Number(r.total) }))
}

export function getCategoryTotals(userId, { from, to }) {
  const db = getDb()
  return db
    .prepare(
      `SELECT category, COALESCE(SUM(duration_seconds), 0) AS total
       FROM sessions
       WHERE user_id = ? AND started_at >= ? AND started_at < ?
       GROUP BY category
       ORDER BY total DESC`
    )
    .all(userId, from, to)
    .map((r) => ({ category: r.category, totalSeconds: Number(r.total) }))
}

export function getLongestSessionSeconds(userId, { from, to }) {
  const db = getDb()
  const row = db
    .prepare(
      `SELECT COALESCE(MAX(duration_seconds), 0) AS max
       FROM sessions
       WHERE user_id = ? AND started_at >= ? AND started_at < ?`
    )
    .get(userId, from, to)
  return Number(row.max || 0)
}

export function getAvgSessionSeconds(userId, { from, to }) {
  const db = getDb()
  const row = db
    .prepare(
      `SELECT COALESCE(AVG(duration_seconds), 0) AS avg
       FROM sessions
       WHERE user_id = ? AND started_at >= ? AND started_at < ?`
    )
    .get(userId, from, to)
  return Math.round(Number(row.avg || 0))
}

export function getStreakDays(userId) {
  // streak: 从今天往前连续有学习记录的天数
  const db = getDb()
  const days = db
    .prepare(
      `SELECT DISTINCT substr(started_at, 1, 10) AS day
       FROM sessions
       WHERE user_id = ?
       ORDER BY day DESC`
    )
    .all(userId)
    .map((r) => r.day)

  if (days.length === 0) return 0

  const today = new Date()
  const toDayStr = (d) => d.toISOString().slice(0, 10)

  let streak = 0
  let cursor = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()))

  const set = new Set(days)
  while (set.has(toDayStr(cursor))) {
    streak += 1
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }
  return streak
}

