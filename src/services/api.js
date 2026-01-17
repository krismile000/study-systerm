// 使用环境变量配置API地址，支持不同部署环境
const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || ''

export function getToken() {
  return localStorage.getItem('token')
}

export function setToken(token) {
  localStorage.setItem('token', token)
}

export function clearToken() {
  localStorage.removeItem('token')
}

export function getCurrentUser() {
  const raw = localStorage.getItem('user')
  return raw ? JSON.parse(raw) : null
}

export function setCurrentUser(user) {
  localStorage.setItem('user', JSON.stringify(user))
}

export function clearCurrentUser() {
  localStorage.removeItem('user')
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  const token = getToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const err = new Error(data.error || '请求失败')
    err.status = res.status
    throw err
  }

  return data
}

export const api = {
  health: () => request('/api/health'),
  me: () => request('/api/me'),

  register: (payload) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),

  sessions: {
    list: ({ from, to, limit } = {}) => {
      const qs = new URLSearchParams()
      if (from) qs.set('from', from)
      if (to) qs.set('to', to)
      if (limit) qs.set('limit', String(limit))
      const q = qs.toString()
      return request(`/api/sessions${q ? `?${q}` : ''}`)
    },
    create: (payload) => request('/api/sessions', { method: 'POST', body: JSON.stringify(payload) }),
  },

  goals: {
    list: () => request('/api/goals'),
    create: (payload) => request('/api/goals', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id, payload) => request(`/api/goals/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    remove: (id) => request(`/api/goals/${id}`, { method: 'DELETE' }),
  },

  reports: {
    summary: ({ from, to }) => {
      const qs = new URLSearchParams({ from, to })
      return request(`/api/reports/summary?${qs.toString()}`)
    },
    exportCsvUrl: ({ from, to }) => {
      const qs = new URLSearchParams({ from, to })
      // 需要带 token 时：用 fetch 下载更好；这里先返回 URL
      return `${API_BASE}/api/reports/export.csv?${qs.toString()}`
    },
  },

  achievements: {
    list: () => request('/api/achievements'),
  },
}

export function secondsToHM(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return { h, m }
}

export function formatHM(seconds) {
  const { h, m } = secondsToHM(seconds)
  if (h <= 0) return `${m} 分钟`
  return `${h} 小时 ${m} 分钟`
}
