import { formatHM } from '../services/api'
import './CurrentFocus.css'

function CurrentFocus({ session }) {
  if (!session) {
    return (
      <div className="current-focus-card">
        <div className="focus-icon">🎓</div>
        <h3 className="focus-task">暂无专注记录</h3>
        <div className="focus-category">今天开始一次专注吧</div>
      </div>
    )
  }

  return (
    <div className="current-focus-card">
      <div className="focus-icon">🎓</div>
      <h3 className="focus-task">{session.task}</h3>
      <div className="focus-category">
        <span className="check-icon">✓</span>
        {session.category}
      </div>
      <div className="focus-timer">{formatHM(session.durationSeconds || 0)}</div>
    </div>
  )
}

export default CurrentFocus
