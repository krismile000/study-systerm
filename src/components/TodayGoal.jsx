import { useEffect, useState } from 'react'
import { api } from '../services/api'
import './TodayGoal.css'

function TodayGoal({ todayTotalSeconds }) {
  const [targetMinutes, setTargetMinutes] = useState(120) // Default
  const [goalTitle, setGoalTitle] = useState('每日学习')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { goals } = await api.goals.list()
        const daily = goals.find((g) => g.type === 'daily_minutes' && g.status === 'in_progress')
        if (daily && mounted) {
          setTargetMinutes(daily.targetValue)
          setGoalTitle(daily.title)
        }
      } catch {
        // ignore
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const currentMinutes = Math.floor((todayTotalSeconds || 0) / 60)
  const progress = targetMinutes > 0 ? Math.min((currentMinutes / targetMinutes) * 100, 100) : 0

  const currentHours = (currentMinutes / 60).toFixed(1)
  const targetHours = (targetMinutes / 60).toFixed(1)

  return (
    <div className="today-goal-card">
      <h3 className="card-title">今日目标</h3>
      <div className="progress-circle-container">
        <svg className="progress-circle" viewBox="0 0 120 120">
          <circle
            className="progress-circle-bg"
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="#2a2a2a"
            strokeWidth="10"
          />
          <circle
            className="progress-circle-fill"
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="#14b8a6"
            strokeWidth="10"
            strokeDasharray={`${2 * Math.PI * 50}`}
            strokeDashoffset={`${2 * Math.PI * 50 * (1 - progress / 100)}`}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
          />
        </svg>
        <div className="progress-text">
          <span className="progress-percent">{Math.round(progress)}%</span>
        </div>
      </div>
      <div className="progress-info">
        <div className="time-info">
          {currentHours}/{targetHours} 小时
        </div>
        <div className="goal-text">{goalTitle}</div>
      </div>
    </div>
  )
}

export default TodayGoal
