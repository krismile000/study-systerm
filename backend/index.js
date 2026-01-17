import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// 导入依赖
const express = require('express');
const cors = require('cors');
const { initDb } = require('../../backend/src/db.js');

// 导入路由
const authRoutes = require('../../backend/src/routes/auth.js');
const meRoutes = require('../../backend/src/routes/me.js');
const sessionsRoutes = require('../../backend/src/routes/sessions.js');
const goalsRoutes = require('../../backend/src/routes/goals.js');
const reportsRoutes = require('../../backend/src/routes/reports.js');
const achievementsRoutes = require('../../backend/src/routes/achievements.js');

// 初始化数据库
initDb();

// 创建Express应用
const app = express();

// 配置CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());

// 配置路由
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'study-progress-api' });
});

app.use('/api/auth', authRoutes);
app.use('/api/me', meRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/achievements', achievementsRoutes);

// 错误处理
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || '服务器错误',
  });
});

// EdgeOne Node Functions入口
export async function onRequest(context) {
  // 将Request对象转换为Express可以处理的格式
  const { request } = context;
  
  // 使用Express处理请求
  return new Promise((resolve, reject) => {
    // 创建模拟的Express响应对象
    const mockRes = {
      status: (code) => {
        mockRes.statusCode = code;
        return mockRes;
      },
      json: (body) => {
        resolve(new Response(JSON.stringify(body), {
          status: mockRes.statusCode || 200,
          headers: {
            'Content-Type': 'application/json',
            ...mockRes.headers
          }
        }));
      },
      send: (body) => {
        resolve(new Response(body, {
          status: mockRes.statusCode || 200,
          headers: mockRes.headers
        }));
      },
      set: (header, value) => {
        if (!mockRes.headers) mockRes.headers = {};
        mockRes.headers[header] = value;
        return mockRes;
      },
      headers: {}
    };
    
    // 使用Express中间件处理请求
    app(request, mockRes, (err) => {
      if (err) reject(err);
    });
  });
}