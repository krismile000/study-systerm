# 学习进度追踪器部署指南（Netlify + Cloudflare Workers+D1）

本指南将帮助您将学习进度追踪器应用部署到Netlify（前端）和Cloudflare Workers+D1（后端）。这个方案的免费层都**不需要信用卡**。

## 前置条件

1. **Git安装**：确保您的电脑已安装Git
2. **GitHub账号**：用于存储代码仓库
3. **Cloudflare账号**：用于部署后端（Worker + D1数据库）
4. **Netlify账号**：用于部署前端

## 一、后端部署：Cloudflare Workers + D1

### 1. 安装Wrangler CLI

Wrangler是Cloudflare Workers的命令行工具：

```bash
npm install -g wrangler
```

### 2. 配置Wrangler

登录Cloudflare账号：

```bash
wrangler login
```

### 3. 创建D1数据库

创建一个新的D1数据库：

```bash
wrangler d1 create study-progress-db
```

记下返回的`database_id`，稍后需要用到。

### 4. 更新Wrangler配置

编辑项目根目录下的`wrangler.toml`文件，填入您的数据库ID：

```toml
[[d1_databases]]
binding = "DB"  # 绑定到Worker的变量名
name = "study-progress-db"  # 数据库名称
database_id = "YOUR_DATABASE_ID_HERE"  # 替换为您的数据库ID
```

### 5. 运行数据库迁移

```bash
wrangler d1 migrations apply study-progress-db
```

### 6. 部署Worker

```bash
wrangler deploy
```

部署成功后，您将获得一个Worker的URL，类似于：`https://study-progress-tracker-api.YOUR_USERNAME.workers.dev`

记下这个URL，稍后前端配置需要用到。

## 二、前端部署：Netlify

### 1. 创建GitHub仓库

将代码推送到GitHub：

```bash
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/study-progress-tracker.git
git push -u origin main
```

### 2. 部署到Netlify

1. 访问 [Netlify](https://netlify.com) 并登录
2. 点击"Add new site" → "Import an existing project"
3. 选择"GitHub"并授权
4. 选择您的`study-progress-tracker`仓库
5. Netlify会自动检测到`netlify.toml`配置文件
6. 点击"Deploy site"

### 3. 配置环境变量

部署完成后：

1. 进入Netlify站点的"Site settings" → "Environment variables"
2. 添加以下环境变量：
   - `VITE_API_URL`：填入您的Cloudflare Worker URL（如：`https://study-progress-tracker-api.YOUR_USERNAME.workers.dev`）
3. 点击"Save"
4. 重新部署站点以应用新的环境变量

## 三、验证部署

1. 访问Netlify提供的站点URL（如：`https://your-site.netlify.app`）
2. 注册一个新账号
3. 创建一个学习会话
4. 验证数据是否正确保存

## 四、常见问题

### 1. CORS错误

如果遇到CORS错误，请检查：
- Cloudflare Worker是否正确处理了CORS
- Netlify环境变量是否正确设置

### 2. 数据库连接问题

确保：
- D1数据库已正确创建
- 数据库迁移已成功运行
- Worker配置中的数据库ID正确

### 3. 构建失败

如果Netlify构建失败：
- 检查package.json中的依赖是否正确
- 确保Node.js版本符合要求（>=18）

## 五、项目结构说明

- `src/`：前端源代码
- `backend/`：后端API代码（已适配Cloudflare Workers）
- `migrations/`：D1数据库迁移文件
- `netlify.toml`：Netlify前端部署配置
- `wrangler.toml`：Cloudflare Worker配置

## 六、更新部署

### 更新前端

只需将更改推送到GitHub，Netlify会自动重新部署。

### 更新后端

```bash
wrangler deploy
```

### 更新数据库结构

1. 在`migrations/`目录下创建新的迁移文件
2. 运行迁移：
   ```bash
   wrangler d1 migrations apply study-progress-db
   ```
3. 重新部署Worker：
   ```bash
   wrangler deploy
   ```

---

部署完成后，您就可以与他人分享Netlify提供的站点URL，他们可以注册账号并使用您的学习进度追踪器了！