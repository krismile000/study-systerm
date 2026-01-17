import { verifyToken } from '../utils/jwt.js'
import { getDb } from '../db.js'

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const [type, token] = header.split(' ')

  if (type !== 'Bearer' || !token) {
    return res.status(401).json({ error: '未登录' })
  }

  try {
    const payload = verifyToken(token)
    // token payload: { sub, email, username, iat, exp }
    const userId = Number(payload.sub)
    const db = getDb()
    
    // 检查用户是否真的存在于数据库中
    const user = db.prepare('SELECT id, email, username FROM users WHERE id = ?').get(userId)
    if (!user) {
      return res.status(401).json({ error: '用户不存在，请重新登录' })
    }
    
    req.user = user
    next()
  } catch (e) {
    return res.status(401).json({ error: '登录已失效，请重新登录' })
  }
}

