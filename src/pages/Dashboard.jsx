import { useEffect, useMemo, useState } from 'react'
import HeatmapCalendar from '../components/HeatmapCalendar'
import TodayGoal from '../components/TodayGoal'
import CurrentFocus from '../components/CurrentFocus'
import RecentAchievements from '../components/RecentAchievements'
import WeeklyOverview from '../components/WeeklyOverview'
import { api } from '../services/api'
import './Dashboard.css'

function Dashboard() {
  const [todayTotalSeconds, setTodayTotalSeconds] = useState(0)
  const [weeklyData, setWeeklyData] = useState([])
  const [weeklyTotalSeconds, setWeeklyTotalSeconds] = useState(0)
  const [weeklyTasks, setWeeklyTasks] = useState(0)
  const [recentUnlocked, setRecentUnlocked] = useState([])
  const [currentFocus, setCurrentFocus] = useState(null)

  const todayRange = useMemo(() => {
    const now = new Date()
    const day = now.toISOString().slice(0, 10)
    return {
      from: `${day}T00:00:00.000Z`,
      to: `${day}T23:59:59.999Z`,
      day,
    }
  }, [])

  const weekRange = useMemo(() => {
    const now = new Date()
    const day = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
    const dow = (day.getUTCDay() + 6) % 7 // Monday=0
    const start = new Date(day)
    start.setUTCDate(start.getUTCDate() - dow)
    const end = new Date(start)
    end.setUTCDate(end.getUTCDate() + 7)

    return { from: start.toISOString(), to: end.toISOString(), startDay: start.toISOString().slice(0, 10) }
  }, [])

  useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        // 今日 sessions
        const { sessions } = await api.sessions.list({ from: todayRange.from, to: todayRange.to, limit: 50 })
        const total = sessions.reduce((s, x) => s + (x.durationSeconds || 0), 0)
        if (mounted) {
          setTodayTotalSeconds(total)
          setCurrentFocus(sessions[0] || null)
        }

        // 本周 summary
        const summary = await api.reports.summary({ from: weekRange.from, to: weekRange.to })
        const totalWeek = summary.totalSeconds || 0
        const days = summary.daily || []

        // 组装周柱状图 7 天
        const data = []
        for (let i = 0; i < 7; i++) {
          const d = new Date(weekRange.from)
          d.setUTCDate(d.getUTCDate() + i)
          const key = d.toISOString().slice(0, 10)
          const found = days.find((x) => x.day === key)
          data.push({
            day: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][i],
            hours: Number(((found?.totalSeconds || 0) / 3600).toFixed(1)),
          })
        }

        if (mounted) {
          setWeeklyData(data)
          setWeeklyTotalSeconds(totalWeek)
        }

        // 本周任务数（用 sessions 数）
        const weekSessions = await api.sessions.list({ from: weekRange.from, to: weekRange.to, limit: 200 })
        if (mounted) setWeeklyTasks(weekSessions.sessions.length)

        // 成就
        const a = await api.achievements.list()
        if (mounted) setRecentUnlocked((a.unlocked || []).slice(0, 3))
      } catch {
        // ignore
      }
    })()

    return () => {
      mounted = false
    }
  }, [todayRange.from, todayRange.to, weekRange.from, weekRange.to])

  return (
    <div className="dashboard">
      <div className="dashboard-grid">
        <div className="dashboard-item today-goal">
          <TodayGoal todayTotalSeconds={todayTotalSeconds} />
        </div>
        <div className="dashboard-item heatmap">
          <HeatmapCalendar />
        </div>
        <div className="dashboard-item achievements">
          <RecentAchievements unlocked={recentUnlocked} />
        </div>
        <div className="dashboard-item current-focus">
          <CurrentFocus session={currentFocus} />
        </div>
        <div className="dashboard-item weekly">
          <WeeklyOverview data={weeklyData} totalSeconds={weeklyTotalSeconds} completedTasks={weeklyTasks} />
        </div>
      </div>
    </div>
  )
}

export default Dashboard
