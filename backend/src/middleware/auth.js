import { verifyToken } from '../utils/jwt.js'

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const [type, token] = header.split(' ')

  if (type !== 'Bearer' || !token) {
    return res.status(401).json({ error: '未登录' })
  }

  try {
    const payload = verifyToken(token)
    // token payload: { sub, email, username, iat, exp }
    req.user = {
      id: Number(payload.sub),
      email: payload.email,
      username: payload.username,
    }
    next()
  } catch (e) {
    return res.status(401).json({ error: '登录已失效，请重新登录' })
  }
}

