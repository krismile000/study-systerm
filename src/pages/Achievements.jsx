import { useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'
import './Achievements.css'

function Achievements() {
  const [activeTab, setActiveTab] = useState('unlocked')
  const [all, setAll] = useState([])
  const [unlocked, setUnlocked] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const data = await api.achievements.list()
        if (!mounted) return
        setAll(data.all || [])
        setUnlocked(data.unlocked || [])
      } catch (e) {
        if (mounted) setError(e.message || '加载失败')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  const unlockedList = useMemo(() => all.filter((a) => a.unlocked), [all])
  const inProgressList = useMemo(() => all.filter((a) => !a.unlocked), [all])

  const list = useMemo(() => {
    if (activeTab === 'unlocked') return unlockedList
    if (activeTab === 'in-progress') return inProgressList
    return all
  }, [activeTab, all, inProgressList, unlockedList])

  return (
    <div className="achievements-page">
      <div className="achievements-header">
        <h1 className="page-title">成就展示</h1>
      </div>

      <div className="achievements-tabs">
        <button className={`tab-btn ${activeTab === 'unlocked' ? 'active' : ''}`} onClick={() => setActiveTab('unlocked')}>
          已解锁
        </button>
        <button className={`tab-btn ${activeTab === 'in-progress' ? 'active' : ''}`} onClick={() => setActiveTab('in-progress')}>
          进行中
        </button>
        <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
          全部
        </button>
      </div>

      {loading && <div className="achievements-hint">加载中...</div>}
      {error && <div className="achievements-error">{error}</div>}

      <div className="achievements-content">
        {activeTab === 'in-progress' && inProgressList.length > 0 && (
          <div className="in-progress-details">
            {inProgressList.slice(0, 2).map((a) => {
              const percent = Math.min((a.current / a.target) * 100, 100)
              return (
                <div className="progress-card" key={a.code}>
                  <div className="progress-card-header">
                    <div className="progress-icon">{a.icon || '🏆'}</div>
                    <h3 className="progress-title">{a.name}</h3>
                  </div>
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
                        strokeDashoffset={`${2 * Math.PI * 50 * (1 - percent / 100)}`}
                        strokeLinecap="round"
                        transform="rotate(-90 60 60)"
                      />
                    </svg>
                    <div className="progress-text">
                      <span className="progress-percent">{Math.round(percent)}%</span>
                    </div>
                  </div>
                  <div className="progress-info">
                    <div className="progress-text-info">
                      {a.current}/{a.target}
                    </div>
                    <div className="progress-timer">{a.description}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="achievements-grid">
          {list.map((achievement) => {
            const locked = !achievement.unlocked
            const percent = achievement.target ? Math.min((achievement.current / achievement.target) * 100, 100) : 0
            return (
              <div key={achievement.code} className={`achievement-card ${locked ? 'locked' : ''} ${locked ? 'in-progress' : 'unlocked'}`}>
                <div className="achievement-hexagon" style={{ backgroundColor: locked ? '#4a4a4a' : achievement.color || '#14b8a6' }}>
                  <span className="achievement-icon">{achievement.icon || '🏆'}</span>
                  {!locked && <div className="achievement-check">✓</div>}
                </div>
                <div className="achievement-name">{achievement.name}</div>
                {locked && (
                  <div className="achievement-progress">{achievement.kind === 'single_session_minutes' ? `目标：${achievement.target}分钟` : `${achievement.current}/${achievement.target}`}</div>
                )}
                {!locked && <div className="achievement-progress">已解锁</div>}
              </div>
            )
          })}
          {list.length === 0 && !loading && <div style={{ color: '#b0b0b0' }}>暂无成就数据</div>}
        </div>
      </div>
    </div>
  )
}

export default Achievements
