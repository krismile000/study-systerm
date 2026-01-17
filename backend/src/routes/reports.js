import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.js'
import {
  getDailyTotals,
  getCategoryTotals,
  getTotalSeconds,
  getAvgSessionSeconds,
  getLongestSessionSeconds,
  getStreakDays,
} from '../services/stats.js'

const router = Router()

const rangeSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
})

router.get('/summary', requireAuth, (req, res) => {
  const parsed = rangeSchema.safeParse(req.query)
  if (!parsed.success) {
    return res.status(400).json({ error: '请提供 from/to（ISO 时间字符串）' })
  }

  const { from, to } = parsed.data

  const totalSeconds = getTotalSeconds(req.user.id, { from, to })
  const avgSeconds = getAvgSessionSeconds(req.user.id, { from, to })
  const longestSeconds = getLongestSessionSeconds(req.user.id, { from, to })
  const streakDays = getStreakDays(req.user.id)

  const daily = getDailyTotals(req.user.id, { from, to })
  const categories = getCategoryTotals(req.user.id, { from, to })

  res.json({
    totalSeconds,
    avgSeconds,
    longestSeconds,
    streakDays,
    daily,
    categories,
  })
})

router.get('/export.csv', requireAuth, (req, res) => {
  const parsed = rangeSchema.safeParse(req.query)
  if (!parsed.success) {
    return res.status(400).json({ error: '请提供 from/to（ISO 时间字符串）' })
  }

  const { from, to } = parsed.data
  // 直接用 summary 的 daily/categories 导出简单 CSV
  const daily = getDailyTotals(req.user.id, { from, to })

  const lines = ['date,totalSeconds']
  for (const r of daily) {
    lines.push(`${r.day},${r.totalSeconds}`)
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="report.csv"')
  res.send(lines.join('\n'))
})

export default router

