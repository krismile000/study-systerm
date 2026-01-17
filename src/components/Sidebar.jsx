import { Link, useLocation } from 'react-router-dom'
import './Sidebar.css'

const menuItems = [
  { path: '/', label: '仪表盘', icon: '📊' },
  { path: '/timer', label: '计时器', icon: '⏱️' },
  { path: '/reports', label: '报告', icon: '📈' },
  { path: '/achievements', label: '成就', icon: '🏆' },
  { path: '/goals', label: '目标', icon: '🎯' },
  { path: '/settings', label: '设置', icon: '⚙️' },
]

function Sidebar() {
  const location = useLocation()

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-icon">✈️</span>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="user-avatar">
          <img src="https://ui-avatars.com/api/?name=User&background=14b8a6&color=fff" alt="User" />
        </div>
      </div>
    </aside>
  )
}

export default Sidebar

