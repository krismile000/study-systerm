import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, setToken, setCurrentUser } from '../services/api'
import './Auth.css'

export default function Register() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.register({ email, username, password })
      setToken(data.token)
      setCurrentUser(data.user)
      navigate('/')
    } catch (err) {
      setError(err.message || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">✈️</div>
          <h1 className="auth-title">注册</h1>
          <p className="auth-subtitle">创建账号以同步你的学习数据</p>
        </div>

        <form className="auth-form" onSubmit={onSubmit}>
          <div className="auth-field">
            <label>邮箱</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="请输入邮箱" required />
          </div>
          <div className="auth-field">
            <label>用户名</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} type="text" placeholder="请输入用户名（2-20字）" required />
          </div>
          <div className="auth-field">
            <label>密码</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="请输入密码（至少6位）" required />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button className="auth-submit" disabled={loading}>
            {loading ? '注册中...' : '注册'}
          </button>

          <div className="auth-footer">
            已有账号？ <Link to="/login">去登录</Link>
          </div>
        </form>
      </div>
    </div>
  )
}

