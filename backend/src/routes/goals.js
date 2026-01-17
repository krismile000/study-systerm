import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import { getDb } from '../db.js'

const router = Router()

const createSchema = z.object({
  title: z.string().min(1, '请输入目标名称').max(100),
  type: z.enum(['daily_minutes', 'deadline_hours']),
  targetValue: z.number().int().min(1),
  dueDate: z.string().nullable().optional(),
})

const updateSchema = createSchema.partial().extend({
  status: z.enum(['in_progress', 'completed', 'expired']).optional(),
})

router.get('/', requireAuth, (req, res) => {
  const db = getDb()
  const rows = db
    .prepare(
      `SELECT id, title, type, target_value AS targetValue, due_date AS dueDate,
              status, created_at AS createdAt, completed_at AS completedAt
       FROM goals
       WHERE user_id = ?
       ORDER BY created_at DESC`
    )
    .all(req.user.id)

  res.json({ goals: rows.map((g) => ({ ...g, progress: computeGoalProgressSeconds(req.user.id, g) })) })
})

router.post('/', requireAuth, (req, res) => {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || '参数错误' })
  }
  const { title, type, targetValue, dueDate } = parsed.data
  const db = getDb()

  const result = db
    .prepare(
      `INSERT INTO goals (user_id, title, type, target_value, due_date)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(req.user.id, title, type, targetValue, dueDate || null)

  res.json({ id: result.lastInsertRowid })
})

router.patch('/:id', requireAuth, (req, res) => {
  const parsed = updateSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || '参数错误' })
  }

  const id = Number(req.params.id)
  const db = getDb()
  const existing = db.prepare('SELECT * FROM goals WHERE id = ? AND user_id = ?').get(id, req.user.id)
  if (!existing) return res.status(404).json({ error: '目标不存在' })

  const next = {
    title: parsed.data.title ?? existing.title,
    type: parsed.data.type ?? existing.type,
    target_value: parsed.data.targetValue ?? existing.target_value,
    due_date: parsed.data.dueDate === undefined ? existing.due_date : parsed.data.dueDate,
    status: parsed.data.status ?? existing.status,
    completed_at: existing.completed_at,
  }

  if (parsed.data.status === 'completed' && existing.status !== 'completed') {
    next.completed_at = new Date().toISOString()
  }

  db.prepare(
    `UPDATE goals
     SET title = ?, type = ?, target_value = ?, due_date = ?, status = ?, completed_at = ?
     WHERE id = ? AND user_id = ?`
  ).run(next.title, next.type, next.target_value, next.due_date, next.status, next.completed_at, id, req.user.id)

  res.json({ ok: true })
})

router.delete('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id)
  const db = getDb()
  const result = db.prepare('DELETE FROM goals WHERE id = ? AND user_id = ?').run(id, req.user.id)
  if (result.changes === 0) return res.status(404).json({ error: '目标不存在' })
  res.json({ ok: true })
})

function computeGoalProgressSeconds(userId, goal) {
  const db = getDb()

  if (goal.type === 'daily_minutes') {
    // 今日已学习分钟
    const now = new Date()
    const day = now.toISOString().slice(0, 10)
    const from = `${day}T00:00:00.000Z`
    const to = `${day}T23:59:59.999Z`
    const row = db
      .prepare(
        `SELECT COALESCE(SUM(duration_seconds), 0) AS total
         FROM sessions
         WHERE user_id = ? AND started_at >= ? AND started_at <= ?`
      )
      .get(userId, from, to)
    return Number(row.total || 0)
  }

  if (goal.type === 'deadline_hours') {
    // 从创建开始累计到截止（如果有 dueDate）
    const from = goal.createdAt || goal.created_at
    const to = goal.dueDate || goal.due_date || '9999-12-31'
    const row = db
      .prepare(
        `SELECT COALESCE(SUM(duration_seconds), 0) AS total
         FROM sessions
         WHERE user_id = ? AND started_at >= ? AND started_at < ?`
      )
      .get(userId, from, to)
    return Number(row.total || 0)
  }

  return 0
}

export default router

