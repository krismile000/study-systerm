import { useEffect, useMemo, useRef, useState } from 'react'
import { api, formatHM } from '../services/api'
import './Timer.css'

const CATEGORIES = ['工作课程', '副项目', '语言学习']

function Timer() {
  const DEFAULT_SECONDS = 45 * 60

  const [time, setTime] = useState(DEFAULT_SECONDS)
  const [isRunning, setIsRunning] = useState(false)
  const [task, setTask] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])

  const [sessionStartedAt, setSessionStartedAt] = useState(null)

  const [backgroundMusic, setBackgroundMusic] = useState(true)
  const [whiteNoise, setWhiteNoise] = useState(true)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [newlyUnlocked, setNewlyUnlocked] = useState([])

  const [todaySessions, setTodaySessions] = useState([])
  const intervalRef = useRef(null)

  const totalPlanned = DEFAULT_SECONDS
  const elapsed = totalPlanned - time
  const progress = (elapsed / totalPlanned) * 100

  const todayRange = useMemo(() => {
    const now = new Date()
    const day = now.toISOString().slice(0, 10)
    return {
      from: `${day}T00:00:00.000Z`,
      to: `${day}T23:59:59.999Z`,
    }
  }, [])

  const loadToday = async () => {
    try {
      const { sessions } = await api.sessions.list({ ...todayRange, limit: 50 })
      setTodaySessions(sessions)
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => {
    loadToday()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (isRunning && time > 0) {
      intervalRef.current = setInterval(() => {
        setTime((prev) => {
          if (prev <= 1) {
            setIsRunning(false)
            clearInterval(intervalRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }

    return () => clearInterval(intervalRef.current)
  }, [isRunning, time])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const handleStart = () => {
    setError('')
    if (!task.trim()) {
      setError('请输入任务名称')
      return
    }
    if (!sessionStartedAt) {
      setSessionStartedAt(new Date().toISOString())
    }
    setIsRunning(true)
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleStopAndSave = async () => {
    setError('')
    setNewlyUnlocked([])

    const startedAt = sessionStartedAt
    if (!startedAt) {
      // 没开始过就直接重置
      setIsRunning(false)
      setTime(DEFAULT_SECONDS)
      return
    }

    const durationSeconds = Math.max(1, elapsed)
    const endedAt = new Date().toISOString()

    setSaving(true)
    try {
      const { newlyUnlocked: unlocked } = await api.sessions.create({
        task: task.trim(),
        category,
        startedAt,
        endedAt,
        durationSeconds,
      })

      setNewlyUnlocked(unlocked || [])
      setIsRunning(false)
      setTime(DEFAULT_SECONDS)
      setSessionStartedAt(null)
      await loadToday()
    } catch (e) {
      setError(e.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const todayTotalSeconds = todaySessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0)

  return (
    <div className="timer-page">
      <div className="timer-layout">
        <div className="timer-left">
          <div className="today-goal-section">
            <TodayGoalDynamic todayTotalSeconds={todayTotalSeconds} />
          </div>
          <div className="current-focus-section">
            <CurrentFocus task={task} category={category} running={isRunning} />
          </div>

          <div className="today-list-section">
            <h3 className="section-title">今日记录</h3>
            <div className="today-list">
              {todaySessions.length === 0 ? (
                <div className="today-empty">今天还没有记录，开始一次专注吧。</div>
              ) : (
                todaySessions.map((s) => (
                  <div key={s.id} className="today-item">
                    <div className="today-item-title">{s.task}</div>
                    <div className="today-item-meta">
                      <span className="today-item-tag">{s.category}</span>
                      <span className="today-item-time">{formatHM(s.durationSeconds)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="timer-center">
          <div className="timer-container">
            <div className="timer-circle">
              <svg className="timer-svg" viewBox="0 0 200 200">
                <circle className="timer-bg" cx="100" cy="100" r="90" fill="none" stroke="#2a2a2a" strokeWidth="8" />
                <circle
                  className="timer-progress"
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="#14b8a6"
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 90}`}
                  strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress / 100)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 100 100)"
                />
              </svg>
              <div className="timer-display">{formatTime(time)}</div>
            </div>

            <div className="task-input-section">
              <input
                type="text"
                className="task-input"
                placeholder="输入你的任务..."
                value={task}
                onChange={(e) => setTask(e.target.value)}
                disabled={saving}
              />

              <div className="category-row">
                <span className="category-label">分类</span>
                <select className="category-select" value={category} onChange={(e) => setCategory(e.target.value)} disabled={saving}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {error && <div className="timer-error">{error}</div>}
              {newlyUnlocked.length > 0 && (
                <div className="timer-success">已解锁成就：{newlyUnlocked.join('、')}</div>
              )}
            </div>

            <div className="timer-controls">
              <button className="control-btn pause-btn" onClick={handlePause} disabled={!isRunning || saving} title="暂停">
                <span className="btn-icon">⏸</span>
              </button>
              <button className="control-btn start-btn" onClick={handleStart} disabled={saving} title="开始/继续">
                <span className="btn-icon">▶</span>
              </button>
              <button className="control-btn stop-btn" onClick={handleStopAndSave} disabled={saving}>
                {saving ? '保存中...' : '结束并保存'}
              </button>
            </div>
          </div>
        </div>

        <div className="timer-right">
          <div className="focus-mode-section">
            <h3 className="section-title">专注模式</h3>
            <div className="focus-option">
              <div className="option-label">
                <span className="option-icon">⭐</span>
                背景音乐
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={backgroundMusic} onChange={(e) => setBackgroundMusic(e.target.checked)} />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="focus-option">
              <div className="option-label">
                <span className="option-icon">🔒</span>
                白噪音
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={whiteNoise} onChange={(e) => setWhiteNoise(e.target.checked)} />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TodayGoalDynamic({ todayTotalSeconds }) {
  // 默认：取 goals 里 daily_minutes 的第一个作为今日目标，否则用 120 分钟
  const [targetMinutes, setTargetMinutes] = useState(120)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { goals } = await api.goals.list()
        const daily = goals.find((g) => g.type === 'daily_minutes' && g.status === 'in_progress')
        if (daily && mounted) setTargetMinutes(daily.targetValue)
      } catch {
        // ignore
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const currentMinutes = Math.floor(todayTotalSeconds / 60)
  const progress = Math.min((currentMinutes / targetMinutes) * 100, 100)

  return (
    <div className="today-goal-card">
      <h3 className="card-title">今日目标</h3>
      <div className="progress-circle-container">
        <svg className="progress-circle" viewBox="0 0 120 120">
          <circle className="progress-circle-bg" cx="60" cy="60" r="50" fill="none" stroke="#2a2a2a" strokeWidth="10" />
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
          {Math.floor(currentMinutes / 60)}.{String(currentMinutes % 60).padStart(2, '0')} / {Math.floor(targetMinutes / 60)}.{String(targetMinutes % 60).padStart(2, '0')} 小时
        </div>
        <div className="goal-text">今日学习目标：{targetMinutes} 分钟</div>
      </div>
    </div>
  )
}

function CurrentFocus({ task, category, running }) {
  return (
    <div className="current-focus-card">
      <div className="focus-icon">🎓</div>
      <h3 className="focus-task">{task ? task : '暂无任务'}</h3>
      {task && (
        <div className="focus-category">
          <span className="check-icon">✓</span>
          {category} {running ? '· 专注中' : '· 已暂停'}
        </div>
      )}
    </div>
  )
}

export default Timer
