import { Link, useNavigate } from 'react-router-dom'
import { clearToken, clearCurrentUser, getCurrentUser } from '../services/api'
import './Header.css'

function Header() {
  const navigate = useNavigate()
  const user = getCurrentUser()

  const handleLogout = () => {
    clearToken()
    clearCurrentUser()
    navigate('/login')
  }

  return (
    <header className="header">
      <div className="header-left">
        <Link to="/" className="header-logo">
          <span>✈️</span>
        </Link>
      </div>
      <div className="header-right">
        {user ? (
          <div className="header-user">
            <span className="header-username">{user.username}</span>
            <img 
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=14b8a6&color=fff`} 
              alt={user.username} 
              className="header-avatar"
            />
            <button onClick={handleLogout} className="header-logout">
              退出
            </button>
          </div>
        ) : (
          <div className="header-auth">
            <Link to="/login" className="header-login-btn">
              登录
            </Link>
            <Link to="/register" className="header-register-btn">
              注册
            </Link>
          </div>
        )}
        
        <Link to="/timer" className="quick-start-btn">
          快速开始
        </Link>
      </div>
    </header>
  )
}

export default Header

