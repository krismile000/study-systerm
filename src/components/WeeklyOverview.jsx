import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { formatHM } from '../services/api'
import './WeeklyOverview.css'

function WeeklyOverview({ data = [], totalSeconds = 0, completedTasks = 0 }) {
  const totalLabel = formatHM(totalSeconds)

  return (
    <div className="weekly-overview-card">
      <h3 className="card-title">每周概览</h3>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data}>
            <XAxis dataKey="day" tick={{ fill: '#b0b0b0', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
            <YAxis tick={{ fill: '#b0b0b0', fontSize: 12 }} axisLine={{ stroke: '#333' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#252525',
                border: '1px solid #333',
                borderRadius: '6px',
                color: '#ffffff',
              }}
            />
            <Bar dataKey="hours" fill="#14b8a6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="weekly-summary">
        <div className="summary-item">
          <span className="summary-value">{totalLabel}</span>
          <span className="summary-label">总时长</span>
        </div>
        <div className="summary-divider">/</div>
        <div className="summary-item">
          <span className="summary-value">{completedTasks}</span>
          <span className="summary-label">学习次数</span>
        </div>
      </div>
    </div>
  )
}

export default WeeklyOverview
