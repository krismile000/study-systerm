import { useEffect, useMemo, useState } from 'react'
import { api, formatHM } from '../services/api'
import './Goals.css'

function Goals() {
  const [activeTab, setActiveTab] = useState('all')
  const [showModal, setShowModal] = useState(false)

  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const reload = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await api.goals.list()
      setGoals(data.goals || [])
    } catch (e) {
      setError(e.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [])

  const filtered = useMemo(() => {
    if (activeTab === 'in-progress') return goals.filter((g) => g.status === 'in_progress')
    if (activeTab === 'completed') return goals.filter((g) => g.status === 'completed')
    return goals
  }, [activeTab, goals])

  return (
    <div className="goals-page">
      <div className="goals-header">
        <div className="header-left">
          <h1 className="page-title">目标</h1>
        </div>
        <button className="create-goal-btn" onClick={() => setShowModal(true)}>
          + 创建新目标
        </button>
      </div>

      <div className="goals-tabs">
        <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
          所有目标
        </button>
        <button className={`tab-btn ${activeTab === 'in-progress' ? 'active' : ''}`} onClick={() => setActiveTab('in-progress')}>
          进行中
        </button>
        <button className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`} onClick={() => setActiveTab('completed')}>
          已完成
        </button>
      </div>

      {loading && <div className="goals-hint">加载中...</div>}
      {error && <div className="goals-error">{error}</div>}

      <div className="goals-content">
        <div className="goals-grid">
          {filtered.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onChanged={reload} />
          ))}
          {filtered.length === 0 && !loading && <div className="goals-empty">暂无目标</div>}
        </div>
      </div>

      {showModal && <CreateGoalModal onClose={() => setShowModal(false)} onCreated={reload} />}
    </div>
  )
}

function GoalCard({ goal, onChanged }) {
  const progressSeconds = goal.progress || 0

  const { current, target, unitLabel, percent } = useMemo(() => {
    if (goal.type === 'daily_minutes') {
      const currentMin = Math.floor(progressSeconds / 60)
      const targetMin = goal.targetValue
      return {
        current: currentMin,
        target: targetMin,
        unitLabel: '分钟',
        percent: Math.min((currentMin / targetMin) * 100, 100),
      }
    }

    // deadline_hours
    const currentHours = Number((progressSeconds / 3600).toFixed(1))
    const targetHours = goal.targetValue
    return {
      current: currentHours,
      target: targetHours,
      unitLabel: '小时',
      percent: Math.min((currentHours / targetHours) * 100, 100),
    }
  }, [goal.targetValue, goal.type, progressSeconds])

  const markCompleted = async () => {
    await api.goals.update(goal.id, { status: 'completed' })
    onChanged?.()
  }

  const remove = async () => {
    if (!confirm('确定删除该目标吗？')) return
    await api.goals.remove(goal.id)
    onChanged?.()
  }

  return (
    <div className="goal-card">
      <div className="goal-header">
        <div className="goal-icon">{goal.type === 'daily_minutes' ? '🎯' : '📅'}</div>
        <div className="goal-info">
          <h3 className="goal-name">{goal.title}</h3>
          <div className="goal-due">{goal.dueDate ? `截止: ${goal.dueDate.slice(0, 10)}` : goal.type === 'daily_minutes' ? '每日目标' : '截止目标'}</div>
        </div>
      </div>

      <div className="goal-progress">
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
        </div>
        <div className="progress-text">
          {current}/{target} {unitLabel}
        </div>
      </div>

      <div className="goal-actions">
        {goal.status === 'completed' ? (
          <span className="completed-badge">已完成</span>
        ) : (
          <button className="goal-done-btn" onClick={markCompleted}>
            标记完成
          </button>
        )}

        <button className="goal-delete-btn" onClick={remove}>
          删除
        </button>
      </div>
    </div>
  )
}

function CreateGoalModal({ onClose, onCreated }) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState('daily_minutes')
  const [targetValue, setTargetValue] = useState(120)
  const [dueDate, setDueDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api.goals.create({
        title,
        type,
        targetValue: Number(targetValue),
        dueDate: type === 'deadline_hours' ? new Date(dueDate).toISOString() : null,
      })
      onClose()
      onCreated?.()
    } catch (e) {
      setError(e.message || '创建失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">创建新目标</h2>
        <form className="goal-form" onSubmit={submit}>
          <div className="form-group">
            <label>目标名称</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} type="text" placeholder="输入目标名称" required />
          </div>

          <div className="form-group">
            <label>目标类型</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="daily_minutes">每日目标（分钟）</option>
              <option value="deadline_hours">截止目标（小时）</option>
            </select>
          </div>

          <div className="form-group">
            <label>目标值</label>
            <input value={targetValue} onChange={(e) => setTargetValue(e.target.value)} type="number" min="1" required />
          </div>

          {type === 'deadline_hours' && (
            <div className="form-group">
              <label>截止日期</label>
              <input value={dueDate} onChange={(e) => setDueDate(e.target.value)} type="date" required />
            </div>
          )}

          {error && <div className="goals-error">{error}</div>}

          <div className="form-actions">
            <button type="button" onClick={onClose}>
              取消
            </button>
            <button type="submit" disabled={saving}>
              {saving ? '创建中...' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Goals
