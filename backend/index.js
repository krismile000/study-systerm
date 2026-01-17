import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { initDb } from './src/db.js'

// 导入路由
import authRoutes from './src/routes/auth.js'
// ... 其他路由

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// 初始化数据库
initDb()

// 配置CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  }),
)
app.use(express.json())

// 配置路由
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'study-progress-api' })
})

app.use('/api/auth', authRoutes)
// ... 其他路由

// 错误处理
app.use((err, req, res, next) => {
  console.error(err)
  const status = err.status || 500
  res.status(status).json({
    error: err.message || '服务器错误',
  })
})

// 导出为EdgeOne Functions格式
export default async (event, context) => {
  // 处理HTTP请求
  if (event.type === 'http') {
    return app(event, context)
  }
  
  // 其他事件类型处理
  return {
    statusCode: 400,
    body: JSON.stringify({ error: 'Unsupported event type' })
  }
}