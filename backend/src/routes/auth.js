import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { getDb } from '../db.js'
import { signToken } from '../utils/jwt.js'

const router = Router()

const registerSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  username: z.string().min(2, '用户名至少2个字符').max(20, '用户名最多20个字符'),
  password: z.string().min(6, '密码至少6位').max(72, '密码过长'),
})

const loginSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(1, '请输入密码'),
})

router.post('/register', async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || '参数错误' })
    }

    const { email, username, password } = parsed.data
    const db = getDb()

    const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
    if (exists) {
      return res.status(409).json({ error: '该邮箱已注册' })
    }

    const password_hash = await bcrypt.hash(password, 10)
    const result = db
      .prepare('INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)')
      .run(email, username, password_hash)

    const user = { id: result.lastInsertRowid, email, username }
    const token = signToken({ sub: user.id, email: user.email, username: user.username })

    return res.json({ user, token })
  } catch (e) {
    next(e)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || '参数错误' })
    }

    const { email, password } = parsed.data
    const db = getDb()

    const row = db.prepare('SELECT id, email, username, password_hash FROM users WHERE email = ?').get(email)
    if (!row) {
      return res.status(401).json({ error: '邮箱或密码错误' })
    }

    const ok = await bcrypt.compare(password, row.password_hash)
    if (!ok) {
      return res.status(401).json({ error: '邮箱或密码错误' })
    }

    const user = { id: row.id, email: row.email, username: row.username }
    const token = signToken({ sub: user.id, email: user.email, username: user.username })

    return res.json({ user, token })
  } catch (e) {
    next(e)
  }
})

export default router

