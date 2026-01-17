import express from 'express';
import serverless from 'serverless-http';
import cors from 'cors';
import dotenv from 'dotenv';

// 配置环境变量
dotenv.config();

const app = express();

// 配置CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json());

// 导入路由
import authRoutes from '../../../backend/src/routes/auth.js';
import meRoutes from '../../../backend/src/routes/me.js';
import sessionsRoutes from '../../../backend/src/routes/sessions.js';
import goalsRoutes from '../../../backend/src/routes/goals.js';
import reportsRoutes from '../../../backend/src/routes/reports.js';
import achievementsRoutes from '../../../backend/src/routes/achievements.js';

// 注册路由
app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'study-progress-api' });
});

app.use('/auth', authRoutes);
app.use('/me', meRoutes);
app.use('/sessions', sessionsRoutes);
app.use('/goals', goalsRoutes);
app.use('/reports', reportsRoutes);
app.use('/achievements', achievementsRoutes);

// 错误处理
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || '服务器错误',
  });
});

// 导出Serverless函数
export const handler = serverless(app);