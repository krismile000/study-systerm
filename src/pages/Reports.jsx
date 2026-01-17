import { useEffect, useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts'
import TodayGoal from '../components/TodayGoal'
import CurrentFocus from '../components/CurrentFocus'
import RecentAchievements from '../components/RecentAchievements'
import { api, formatHM, getToken } from '../services/api'
import './Reports.css'

function Reports() {
  const [timeRange, setTimeRange] = useState('week')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const [summary, setSummary] = useState(null)
  const [todayTotalSeconds, setTodayTotalSeconds] = useState(0)
  const [recentUnlocked, setRecentUnlocked] = useState([])
  const [currentFocus, setCurrentFocus] = useState(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const range = useMemo(() => {
    const now = new Date()
    const startOfDay = (d) => new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))

    if (timeRange === 'week') {
      const day = startOfDay(now)
      const dow = (day.getUTCDay() + 6) % 7
      const start = new Date(day)
      start.setUTCDate(start.getUTCDate() - dow)
      const end = new Date(start)
      end.setUTCDate(end.getUTCDate() + 7)
      return { from: start.toISOString(), to: end.toISOString() }
    }

    if (timeRange === 'month') {
      const start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1))
      const end = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1))
      return { from: start.toISOString(), to: end.toISOString() }
    }

    if (timeRange === 'year') {
      const start = new Date(Date.UTC(now.getFullYear(), 0, 1))
      const end = new Date(Date.UTC(now.getFullYear() + 1, 0, 1))
      return { from: start.toISOString(), to: end.toISOString() }
    }

    // custom
    if (customFrom && customTo) {
      const from = new Date(customFrom).toISOString()
      const to = new Date(customTo).toISOString()
      return { from, to }
    }

    // fallback: week
    const day = startOfDay(now)
    const dow = (day.getUTCDay() + 6) % 7
    const start = new Date(day)
    start.setUTCDate(start.getUTCDate() - dow)
    const end = new Date(start)
    end.setUTCDate(end.getUTCDate() + 7)
    return { from: start.toISOString(), to: end.toISOString() }
  }, [timeRange, customFrom, customTo])

  const todayRange = useMemo(() => {
    const now = new Date()
    const day = now.toISOString().slice(0, 10)
    return {
      from: `${day}T00:00:00.000Z`,
      to: `${day}T23:59:59.999Z`,
      day,
    }
  }, [])

  useEffect(() => {
    let mounted = true

    ;(async () => {
      setLoading(true)
      setError('')
      try {
        // 1) 当前筛选区间 summary
        const data = await api.reports.summary(range)
        if (mounted) setSummary(data)

        // 2) 右侧：近期成就
        const a = await api.achievements.list()
        if (mounted) setRecentUnlocked((a.unlocked || []).slice(0, 3))

        // 3) 右侧：当前专注（取今日最新一条 session） + 今日目标所需今日总时长
        const { sessions } = await api.sessions.list({ from: todayRange.from, to: todayRange.to, limit: 50 })
        const total = sessions.reduce((s, x) => s + (x.durationSeconds || 0), 0)
        if (mounted) {
          setTodayTotalSeconds(total)
          setCurrentFocus(sessions[0] || null)
        }
      } catch (e) {
        if (mounted) setError(e.message || '加载失败')
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [range, todayRange.from, todayRange.to])

  const learningTrendData = useMemo(() => {
    const daily = summary?.daily || []
    return daily.map((d) => ({
      day: d.day,
      hours: Number((d.totalSeconds / 3600).toFixed(2)),
    }))
  }, [summary])

  const distributionData = useMemo(() => {
    const cats = summary?.categories || []
    const palette = ['#14b8a6', '#f59e0b', '#6b7280', '#3b82f6', '#a855f7']
    return cats.map((c, idx) => ({
      name: c.category,
      value: Number((c.totalSeconds / 60).toFixed(0)),
      color: palette[idx % palette.length],
      totalSeconds: c.totalSeconds,
    }))
  }, [summary])

  const downloadCsv = async () => {
    const token = getToken()
    const qs = new URLSearchParams({ from: range.from, to: range.to })
    const url = `${import.meta.env.VITE_API_BASE || 'http://localhost:3001'}/api/reports/export.csv?${qs.toString()}`

    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) {
      const msg = await res.text().catch(() => '')
      throw new Error(msg || '导出失败')
    }
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'report.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="reports-page">
      <div className="reports-header">
        <h1 className="page-title">数据报告</h1>
        <div className="time-range-selector">
          <button className={`range-btn ${timeRange === 'week' ? 'active' : ''}`} onClick={() => setTimeRange('week')}>
            周
          </button>
          <button className={`range-btn ${timeRange === 'month' ? 'active' : ''}`} onClick={() => setTimeRange('month')}>
            月
          </button>
          <button className={`range-btn ${timeRange === 'year' ? 'active' : ''}`} onClick={() => setTimeRange('year')}>
            年
          </button>
          <button className={`range-btn ${timeRange === 'custom' ? 'active' : ''}`} onClick={() => setTimeRange('custom')}>
            自定义范围
          </button>
        </div>
      </div>

      {timeRange === 'custom' && (
        <div className="custom-range">
          <div className="custom-field">
            <span>从</span>
            <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
          </div>
          <div className="custom-field">
            <span>到</span>
            <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
          </div>
          <button className="export-btn" onClick={() => downloadCsv().catch((e) => setError(e.message))}>
            导出 CSV
          </button>
        </div>
      )}

      {timeRange !== 'custom' && (
        <div className="reports-actions">
          <button className="export-btn" onClick={() => downloadCsv().catch((e) => setError(e.message))}>
            导出 CSV
          </button>
        </div>
      )}

      {loading && <div className="reports-hint">加载中...</div>}
      {error && <div className="reports-error">{error}</div>}

      <div className="reports-grid">
        <div className="report-card today-goal-card">
          <TodayGoal todayTotalSeconds={todayTotalSeconds} />
        </div>

        <div className="report-card trend-chart">
          <h3 className="card-title">学习时长趋势</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={learningTrendData}>
                <XAxis dataKey="day" tick={{ fill: '#b0b0b0', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                <YAxis tick={{ fill: '#b0b0b0', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#252525',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#ffffff',
                  }}
                />
                <Line type="monotone" dataKey="hours" stroke="#14b8a6" strokeWidth={3} dot={{ fill: '#14b8a6', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="report-card achievements-card">
          <RecentAchievements unlocked={recentUnlocked} />
        </div>

        <div className="report-card current-focus-card">
          <CurrentFocus session={currentFocus} />
        </div>

        <div className="report-card distribution-chart">
          <h3 className="card-title">科目/任务分布</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={distributionData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(_, __, props) => {
                    const seconds = props?.payload?.totalSeconds || 0
                    return formatHM(seconds)
                  }}
                  contentStyle={{
                    backgroundColor: '#252525',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#ffffff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="distribution-legend">
            {distributionData.map((item, index) => (
              <div key={index} className="legend-item">
                <div className="legend-color" style={{ backgroundColor: item.color }} />
                <span className="legend-text">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="report-card focus-stats">
          <h3 className="card-title">专注时长统计</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-icon">🧾</div>
              <div className="stat-content">
                <div className="stat-value">{formatHM(summary?.totalSeconds || 0)}</div>
                <div className="stat-label">总专注时长</div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">📏</div>
              <div className="stat-content">
                <div className="stat-value">{formatHM(summary?.avgSeconds || 0)}</div>
                <div className="stat-label">平均专注时长</div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">🏁</div>
              <div className="stat-content">
                <div className="stat-value">{formatHM(summary?.longestSeconds || 0)}</div>
                <div className="stat-label">最长专注记录</div>
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon">🔥</div>
              <div className="stat-content">
                <div className="stat-value">{summary?.streakDays || 0} 天</div>
                <div className="stat-label">当前连续天数</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports
