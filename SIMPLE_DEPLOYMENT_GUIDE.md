# 简单部署指南：分享给他人使用

## 方案一：Render平台一键部署（推荐）

Render是一个简单易用的云平台，可以一键部署您的应用并提供公开URL。

### 步骤1：创建GitHub仓库

1. 登录GitHub (https://github.com/)
2. 点击"New repository"
3. 命名仓库（例如：study-progress-tracker）
4. 选择"Public"（公开仓库，Render免费版支持）
5. 点击"Create repository"

### 步骤2：推送代码到GitHub

在项目目录下执行以下命令：

```bash
# 初始化Git仓库
git init

# 配置用户信息
git config user.name "Your Name"
git config user.email "your.email@example.com"

# 添加所有文件
git add .

# 提交代码
git commit -m "Initial commit"

# 关联GitHub仓库
git remote add origin https://github.com/your-username/study-progress-tracker.git

# 推送代码到GitHub
git push -u origin main
```

### 步骤3：一键部署到Render

1. 登录Render平台 (https://render.com/)
2. 点击"New +" -> "From Blueprint"
3. 粘贴您的GitHub仓库URL
4. 点击"Apply Blueprint"
5. 等待部署完成（大约5-10分钟）
6. 部署完成后，您将获得两个公开URL：
   - 前端：https://study-progress-tracker-frontend.onrender.com
   - 后端：https://study-progress-tracker-api.onrender.com

### 步骤4：分享给他人

直接将前端URL分享给他人，他们就可以访问和使用您的应用了！

## 方案二：本地部署 + ngrok（临时分享）

如果您不想使用云平台，可以使用ngrok将本地服务暴露给他人访问。

### 步骤1：安装ngrok

1. 访问https://ngrok.com/download
2. 下载并安装适合您系统的版本
3. 注册ngrok账号并获取认证令牌

### 步骤2：启动本地服务

```bash
# 安装依赖
npm install

# 同时启动前端和后端
npm run dev:all
```

### 步骤3：使用ngrok暴露服务

```bash
# 认证ngrok
ngrok config add-authtoken YOUR_AUTH_TOKEN

# 暴露前端服务（端口5173）
ngrok http 5173
```

### 步骤4：分享给他人

ngrok会提供一个公开URL（例如：https://xxxx-xx-xx-xx-xx.ngrok-free.app），将这个URL分享给他人即可。

**注意**：ngrok免费版的URL会定期变化，适合临时分享。

## 方案三：Vercel + Railway（替代云平台）

### Vercel部署前端

1. 访问Vercel (https://vercel.com/)
2. 登录并连接GitHub仓库
3. 选择您的项目仓库
4. 点击"Deploy"

### Railway部署后端

1. 访问Railway (https://railway.app/)
2. 登录并点击"New Project"
3. 选择"Deploy from GitHub repo"
4. 选择您的项目仓库
5. 配置环境变量：
   - PORT: 8088
   - JWT_SECRET: 生成一个随机字符串
6. 点击"Deploy"

### 配置前端API地址

在Vercel项目的环境变量中设置：
- VITE_API_URL: 您的Railway后端URL

## 注意事项

1. **数据持久化**：目前应用使用SQLite数据库，部署后数据会保存在服务器上，但免费版云平台可能会在一段时间无活动后休眠，导致数据丢失。

2. **性能**：免费版云平台可能有性能限制，如果使用人数较多，建议升级到付费计划。

3. **安全**：确保您的JWT_SECRET是安全的随机字符串，不要泄露给他人。

4. **CORS配置**：render.yaml已配置CORS_ORIGIN，确保前端能正确访问后端API。