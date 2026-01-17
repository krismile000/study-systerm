import { getDb } from '../db.js'
import { getStreakDays, getTotalSeconds } from './stats.js'

export function listAchievementDefs() {
  const db = getDb()
  return db.prepare('SELECT code, name, description, kind, target_value, icon, color FROM achievement_defs').all()
}

export function listUserUnlocked(userId) {
  const db = getDb()
  return db
    .prepare(
      `SELECT ua.code, ua.unlocked_at, d.name, d.description, d.kind, d.target_value, d.icon, d.color
       FROM user_achievements ua
       JOIN achievement_defs d ON d.code = ua.code
       WHERE ua.user_id = ?
       ORDER BY ua.unlocked_at DESC`
    )
    .all(userId)
}

export function computeProgress(userId) {
  const defs = listAchievementDefs()
  const unlocked = new Set(listUserUnlocked(userId).map((u) => u.code))

  const streak = getStreakDays(userId)
  const totalHours = Math.floor(getTotalSeconds(userId) / 3600)

  return defs.map((d) => {
    let current = 0
    if (d.kind === 'streak_days') current = streak
    if (d.kind === 'total_hours') current = totalHours
    // single_session_minutes: 由 session 写入时单独判断解锁，这里给 0/target 作为展示
    if (d.kind === 'single_session_minutes') current = 0

    return {
      ...d,
      unlocked: unlocked.has(d.code),
      current,
      target: d.target_value,
    }
  })
}

export function unlockIfEligibleAfterSession(userId, { durationSeconds }) {
  const db = getDb()
  const newlyUnlocked = []

  // 1) 单次专注类
  const minutes = Math.floor(durationSeconds / 60)
  const singleDefs = db
    .prepare(`SELECT code, target_value FROM achievement_defs WHERE kind = 'single_session_minutes'`)
    .all()

  for (const def of singleDefs) {
    if (minutes >= def.target_value) {
      const ok = tryUnlock(userId, def.code)
      if (ok) newlyUnlocked.push(def.code)
    }
  }

  // 2) 连续与总时长类
  const progress = computeProgress(userId)
  for (const p of progress) {
    if (p.unlocked) continue
    if (p.kind === 'streak_days' && p.current >= p.target) {
      const ok = tryUnlock(userId, p.code)
      if (ok) newlyUnlocked.push(p.code)
    }
    if (p.kind === 'total_hours' && p.current >= p.target) {
      const ok = tryUnlock(userId, p.code)
      if (ok) newlyUnlocked.push(p.code)
    }
  }

  return newlyUnlocked
}

function tryUnlock(userId, code) {
  const db = getDb()
  const result = db
    .prepare('INSERT OR IGNORE INTO user_achievements (user_id, code) VALUES (?, ?)')
    .run(userId, code)
  return result.changes > 0
}

