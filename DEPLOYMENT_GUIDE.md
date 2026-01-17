# 学习进度追踪应用部署指南

本指南将帮助您部署学习进度追踪应用，**前后端均使用Netlify**（不需要信用卡）。

## 技术栈回顾

- **前端**: React + Vite
- **后端**: Express + SQLite (迁移到Netlify Functions)
- **部署方案**: Netlify (前端 + 后端Functions)

## 准备工作

1. 确保您的代码已推送到GitHub或GitLab仓库
2. 创建Netlify账户
3. 准备必要的环境变量

## 部署方案说明

由于您没有信用卡，我们将采用**全Netlify部署方案**：

1. **前端**: 使用Netlify静态托管
2. **后端**: 使用Netlify Functions (Serverless API)
3. **数据库**: 使用SQLite (文件存储在Netlify Functions中)

## 后端迁移到Netlify Functions

### 步骤1: 查看当前Netlify Functions配置

Netlify Functions配置在项目根目录的`netlify.toml`文件中：

```toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "node-functions"

[[redirects]]
  from = "/api/*"
  to = ".netlify/functions/api/:splat"
  status = 200
```

### 步骤2: 检查Node Functions目录结构

确保`node-functions/api/`目录存在，用于存放Serverless函数。

### 步骤3: 创建Netlify Functions入口文件

创建`node-functions/api/index.js`文件：

```javascript
const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const dotenv = require('dotenv');

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
const authRoutes = require('../../backend/src/routes/auth.js');
const meRoutes = require('../../backend/src/routes/me.js');
const sessionsRoutes = require('../../backend/src/routes/sessions.js');
const goalsRoutes = require('../../backend/src/routes/goals.js');
const reportsRoutes = require('../../backend/src/routes/reports.js');
const achievementsRoutes = require('../../backend/src/routes/achievements.js');

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
module.exports.handler = serverless(app);
```

### 步骤4: 安装Serverless HTTP依赖

```bash
npm install serverless-http
```

### 步骤5: 更新数据库配置

修改`backend/src/db.js`文件以支持Netlify Functions：

```javascript
export function initDb() {
  // Netlify Functions使用的SQLite路径
  const dbPath = process.env.DB_PATH || '/tmp/data.sqlite';
  db = sqlite3(dbPath);
  // ... 其余代码不变
}
```

**注意**: Netlify Functions是无状态的，`/tmp`目录在函数执行结束后会被清除。对于生产环境，建议使用外部数据库服务。

## 前端部署（Netlify）

### 步骤1: 部署前端应用

1. 登录Netlify账户
2. 点击"Add new site" -> "Import an existing project"
3. 连接您的GitHub/GitLab仓库
4. 配置部署参数：
   - **Build Command**: `npm run build`
   - **Publish directory**: `dist`
   - **Environment Variables**:
     ```
     VITE_API_URL=https://your-netlify-site.netlify.app/api
     CORS_ORIGIN=https://your-netlify-site.netlify.app
     JWT_SECRET=your-jwt-secret-key
     ```
5. 点击"Deploy site"

### 步骤2: 配置自定义域名（可选）

1. 在Netlify的站点设置中，点击"Domain settings"
2. 点击"Add custom domain"
3. 按照提示配置DNS

## 环境变量配置

### 后端环境变量（Netlify Functions）

| 变量名 | 描述 | 默认值 |
|-------|------|-------|
| CORS_ORIGIN | 允许的前端域名 | http://localhost:5173 |
| JWT_SECRET | JWT签名密钥 | your-jwt-secret-key |
| DB_PATH | 数据库文件路径 | /tmp/data.sqlite |

### 前端环境变量

| 变量名 | 描述 | 默认值 |
|-------|------|-------|
| VITE_API_URL | 后端API地址 | http://localhost:8088 |

## 数据库注意事项

**重要**: Netlify Functions是无状态的，SQLite数据库文件会在每次函数执行后被清除。这意味着：

1. 开发环境：数据会持久化
2. 生产环境：数据会**临时存储**，在函数冷启动或重新部署后丢失

### 生产环境数据库解决方案

对于长期使用，建议使用以下免费数据库服务（不需要信用卡）：

1. **Supabase**: 提供免费的PostgreSQL数据库
   - 500MB存储空间
   - 每月10GB流量
   - 支持实时更新

2. **Neon.tech**: 提供免费的PostgreSQL数据库
   - 1GB存储空间
   - 无服务器架构

**迁移到Supabase示例**：

1. 创建Supabase账户
2. 创建新的PostgreSQL数据库
3. 更新后端代码使用pg模块连接PostgreSQL

## 部署后验证

1. 访问Netlify部署的前端应用
2. 尝试注册新用户
3. 创建学习记录
4. 检查数据是否正确保存

## 常见问题

### 1. 数据库数据丢失

- Netlify Functions的SQLite数据是临时的
- 考虑使用Supabase或Neon.tech等外部数据库

### 2. CORS错误

- 确保`CORS_ORIGIN`环境变量设置为您的Netlify站点域名
- 检查`netlify.toml`中的重定向配置

### 3. 函数冷启动延迟

- Netlify Functions可能有冷启动延迟（1-2秒）
- 这是Serverless架构的正常现象

### 4. API路由不工作

- 检查`netlify.toml`中的重定向规则
- 确保函数文件位于正确的目录
- 查看Netlify控制台的函数日志

## 维护建议

1. **开发环境**: 继续使用本地Express + SQLite
2. **生产环境**: 
   - 考虑升级到外部数据库（Supabase/Neon.tech）
   - 定期导出数据备份
   - 监控函数执行时间和错误

## 其他免费部署选项（不需要信用卡）

如果您想尝试其他平台：

### 1. Vercel

- 支持Next.js和Serverless Functions
- 每月100GB带宽
- 免费计划不需要信用卡

### 2. Railway.app

- 支持Node.js应用
- 500小时免费运行时间
- 某些功能不需要信用卡

### 3. PlanetScale

- 提供免费的MySQL数据库
- 不需要信用卡
- 与Netlify Functions兼容

如有任何问题，请参考相关平台的官方文档或提交Issue。