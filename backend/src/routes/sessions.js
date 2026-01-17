import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import { getDb } from '../db.js'
import { unlockIfEligibleAfterSession } from '../services/achievements.js'

const router = Router()

const createSchema = z.object({
  task: z.string().min(1, '请输入任务').max(100, '任务太长'),
  category: z.string().min(1, '请选择分类').max(50),
  startedAt: z.string().min(1),
  endedAt: z.string().min(1),
  durationSeconds: z.number().int().min(1),
})

router.get('/', requireAuth, (req, res) => {
  const { from, to, limit } = req.query
  const db = getDb()

  const lim = Math.min(Number(limit || 50), 200)
  const f = from || '0000-01-01'
  const t = to || '9999-12-31'

  const rows = db
    .prepare(
      `SELECT id, task, category, started_at AS startedAt, ended_at AS endedAt, duration_seconds AS durationSeconds
       FROM sessions
       WHERE user_id = ? AND started_at >= ? AND started_at < ?
       ORDER BY started_at DESC
       LIMIT ?`
    )
    .all(req.user.id, f, t, lim)

  res.json({ sessions: rows })
})

router.post('/', requireAuth, (req, res) => {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || '参数错误' })
  }

  const { task, category, startedAt, endedAt, durationSeconds } = parsed.data
  const db = getDb()

  const result = db
    .prepare(
      `INSERT INTO sessions (user_id, task, category, started_at, ended_at, duration_seconds)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(req.user.id, task, category, startedAt, endedAt, durationSeconds)

  const newlyUnlocked = unlockIfEligibleAfterSession(req.user.id, { durationSeconds })

  res.json({
    id: result.lastInsertRowid,
    newlyUnlocked,
  })
})

export default router

