import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { createYoga } from 'graphql-yoga';
import { buildSubgraphSchema } from '@apollo/subgraph';

// 导入路由
import authRoutes from '../backend/src/routes/auth.js';
import meRoutes from '../backend/src/routes/me.js';
import sessionsRoutes from '../backend/src/routes/sessions.js';
import goalsRoutes from '../backend/src/routes/goals.js';
import reportsRoutes from '../backend/src/routes/reports.js';
import achievementsRoutes from '../backend/src/routes/achievements.js';

// 创建Express应用
const app = express();

// 配置CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
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

// Cloudflare Workers入口
export default {
  async fetch(request, env, ctx) {
    // 将D1数据库绑定到全局对象，以便路由和服务可以访问
    globalThis.DB = env.DB;
    
    // 创建模拟的Express响应对象
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
      
      // 使用Express处理请求
      app(request, mockRes, (err) => {
        if (err) reject(err);
      });
    });
  },
};