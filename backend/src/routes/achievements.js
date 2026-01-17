import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { computeProgress, listUserUnlocked } from '../services/achievements.js'

const router = Router()

router.get('/', requireAuth, (req, res) => {
  const all = computeProgress(req.user.id)
  const unlocked = listUserUnlocked(req.user.id)
  res.json({ all, unlocked })
})

export default router

