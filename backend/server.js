import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { initDb } from './src/db.js'

import authRoutes from './src/routes/auth.js'
import meRoutes from './src/routes/me.js'
import sessionsRoutes from './src/routes/sessions.js'
import goalsRoutes from './src/routes/goals.js'
import reportsRoutes from './src/routes/reports.js'
import achievementsRoutes from './src/routes/achievements.js'

dotenv.config({ path: new URL('../.env', import.meta.url) })

const app = express()
const PORT = process.env.PORT || 8088

// init db
initDb()

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  }),
)
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'study-progress-api' })
})

app.use('/api/auth', authRoutes)
app.use('/api/me', meRoutes)
app.use('/api/sessions', sessionsRoutes)
app.use('/api/goals', goalsRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/achievements', achievementsRoutes)

// basic error handler
app.use((err, req, res, next) => {
  console.error(err)
  const status = err.status || 500
  res.status(status).json({
    error: err.message || '服务器错误',
  })
})

app.listen(PORT, () => {
  console.log(`[API] listening on http://localhost:${PORT}`)
})
