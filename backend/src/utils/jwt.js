import jwt from 'jsonwebtoken'

export function signToken(payload) {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    const err = new Error('JWT_SECRET 未配置')
    err.status = 500
    throw err
  }
  return jwt.sign(payload, secret, { expiresIn: '7d' })
}

export function verifyToken(token) {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    const err = new Error('JWT_SECRET 未配置')
    err.status = 500
    throw err
  }
  return jwt.verify(token, secret)
}

