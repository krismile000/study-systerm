import { Link } from 'react-router-dom'
import './RecentAchievements.css'

function RecentAchievements({ unlocked = [] }) {
  const badges = unlocked.length
    ? unlocked.map((a) => ({
        id: a.code,
        icon: a.icon || '🏆',
        unlocked: true,
        color: a.color || '#f59e0b',
        name: a.name,
      }))
    : [
        { id: 'empty1', icon: '🔒', unlocked: false, color: '#4a4a4a', name: '暂无成就' },
        { id: 'empty2', icon: '🔒', unlocked: false, color: '#4a4a4a', name: '暂无成就' },
        { id: 'empty3', icon: '🔒', unlocked: false, color: '#4a4a4a', name: '暂无成就' },
      ]

  const title = unlocked[0]?.name || '暂无新成就'
  const detail = unlocked[0]?.description || '完成一次专注即可开始解锁'

  return (
    <div className="recent-achievements-card">
      <div className="recent-achievements-header">
        <h3 className="card-title">近期成就</h3>
        <Link className="view-all-link" to="/achievements">
          查看全部
        </Link>
      </div>
      <div className="achievements-grid">
        {badges.slice(0, 3).map((achievement) => (
          <div
            key={achievement.id}
            className={`achievement-badge ${achievement.unlocked ? 'unlocked' : 'locked'}`}
            style={{ backgroundColor: achievement.color }}
            title={achievement.name}
          >
            <span className="achievement-icon">{achievement.icon}</span>
          </div>
        ))}
      </div>
      <div className="achievement-description">
        <div className="achievement-name">{title}</div>
        <div className="achievement-detail">{detail}</div>
      </div>
    </div>
  )
}

export default RecentAchievements
