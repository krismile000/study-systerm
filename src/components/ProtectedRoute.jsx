import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { api, clearCurrentUser, clearToken, getCurrentUser, getToken, setCurrentUser } from '../services/api'

export default function ProtectedRoute({ children }) {
  const location = useLocation()
  const token = getToken()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let mounted = true

    async function check() {
      if (!token) {
        if (mounted) setChecking(false)
        return
      }

      // 若本地没 user，则尝试从后端拉取一次
      const localUser = getCurrentUser()
      if (localUser) {
        if (mounted) setChecking(false)
        return
      }

      try {
        const { user } = await api.me()
        setCurrentUser(user)
      } catch {
        // token 失效
        clearToken()
        clearCurrentUser()
      } finally {
        if (mounted) setChecking(false)
      }
    }

    check()
    return () => {
      mounted = false
    }
  }, [token])

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (checking) {
    return (
      <div style={{ padding: 40, color: '#b0b0b0' }}>
        正在验证登录状态...
      </div>
    )
  }

  return children
}
