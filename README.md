# 学习进度追踪与激励系统

一个现代化的学习进度追踪与激励系统，帮助用户追踪学习进度、管理目标、获得成就激励。

## 功能特性

- 📊 **仪表盘**: 热力图日历、今日目标、当前专注、近期成就、每周概览
- ⏱️ **计时器**: 专注计时、任务管理、专注模式设置
- 📈 **数据报告**: 学习时长趋势、任务分布、专注统计
- 🏆 **成就系统**: 成就展示、进度追踪、解锁激励
- 🎯 **目标管理**: 目标创建、进度追踪、完成管理

## 技术栈

- React 18
- React Router 6
- Vite
- Recharts (数据可视化)
- CSS3

## 安装和运行

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

应用将在 `http://localhost:5173` 启动

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 项目结构

```
study-progress-tracker/
├── src/
│   ├── components/          # 共享组件
│   │   ├── Layout.jsx       # 布局组件
│   │   ├── Sidebar.jsx      # 侧边栏
│   │   ├── Header.jsx       # 顶部栏
│   │   ├── HeatmapCalendar.jsx  # 热力图日历
│   │   ├── TodayGoal.jsx    # 今日目标
│   │   ├── CurrentFocus.jsx # 当前专注
│   │   ├── RecentAchievements.jsx  # 近期成就
│   │   └── WeeklyOverview.jsx  # 每周概览
│   ├── pages/               # 页面组件
│   │   ├── Dashboard.jsx    # 仪表盘
│   │   ├── Timer.jsx        # 计时器
│   │   ├── Reports.jsx      # 报告
│   │   ├── Achievements.jsx # 成就
│   │   ├── Goals.jsx       # 目标
│   │   └── Settings.jsx     # 设置
│   ├── App.jsx              # 主应用
│   ├── main.jsx            # 入口文件
│   └── index.css           # 全局样式
├── index.html
├── package.json
└── vite.config.js
```

## 设计特点

- **深色主题**: 护眼的深色界面设计
- **青色强调色**: 使用 #14b8a6 作为主要强调色
- **响应式设计**: 适配不同屏幕尺寸
- **数据可视化**: 丰富的图表展示学习数据
- **游戏化激励**: 成就系统增强学习动力

## 页面说明

### 仪表盘 (Dashboard)
- 热力图日历展示学习活动
- 今日目标进度环形图
- 当前专注任务显示
- 近期成就展示
- 每周学习概览柱状图

### 计时器 (Timer)
- 大型圆形计时器
- 任务输入和管理
- 开始/暂停/停止控制
- 专注模式设置（背景音乐、白噪音）

### 报告 (Reports)
- 学习时长趋势图
- 科目/任务分布饼图
- 专注时长统计
- 时间范围筛选（周/月/年/自定义）

### 成就 (Achievements)
- 已解锁成就展示
- 进行中成就进度
- 全部成就浏览
- 成就详情和进度追踪

### 目标 (Goals)
- 目标列表展示
- 进度条可视化
- 目标创建和管理
- 完成状态标记

## 开发计划

- [ ] 后端API集成
- [ ] 用户认证系统
- [ ] 数据持久化
- [ ] 更多图表类型
- [ ] 社交功能
- [ ] 移动端优化

## 许可证

MIT License

