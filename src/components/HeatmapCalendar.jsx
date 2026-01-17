import { useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'
import './HeatmapCalendar.css'

function HeatmapCalendar() {
  const [selectedDate, setSelectedDate] = useState(null)
  const [dailyMap, setDailyMap] = useState(new Map())

  const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

  const range = useMemo(() => {
    // 过去 12 周（84 天）
    const today = new Date()
    const end = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() + 1)) // 明天 00:00Z
    const start = new Date(end)
    start.setUTCDate(start.getUTCDate() - 84)
    return {
      from: start.toISOString(),
      to: end.toISOString(),
    }
  }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { daily } = await api.reports.summary(range)
        const map = new Map()
        for (const d of daily) {
          // d.day = YYYY-MM-DD
          map.set(d.day, d.totalSeconds)
        }
        if (mounted) setDailyMap(map)
      } catch {
        // ignore
      }
    })()
    return () => {
      mounted = false
    }
  }, [range])

  const weeks = useMemo(() => {
    const weeks = []
    const end = new Date(range.to)
    const lastDay = new Date(end)
    lastDay.setUTCDate(lastDay.getUTCDate() - 1)

    for (let week = 11; week >= 0; week--) {
      const weekData = []
      for (let day = 0; day < 7; day++) {
        const date = new Date(lastDay)
        date.setUTCDate(date.getUTCDate() - (week * 7 + (6 - day)))
        const key = date.toISOString().slice(0, 10)
        const totalSeconds = dailyMap.get(key) || 0
        const hours = totalSeconds / 3600
        weekData.push({
          date: key,
          hours: Number(hours.toFixed(1)),
          totalSeconds,
          intensity: hours >= 4 ? 4 : hours >= 2 ? 3 : hours >= 1 ? 2 : hours > 0 ? 1 : 0,
        })
      }
      weeks.push(weekData)
    }

    return weeks
  }, [dailyMap, range.to])

  const getIntensityColor = (intensity) => {
    const colors = ['#1a1a1a', '#0d9488', '#14b8a6', '#2dd4bf', '#5eead4']
    return colors[intensity] || colors[0]
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
  }

  return (
    <div className="heatmap-calendar-card">
      <h3 className="card-title">学习热力图</h3>
      <div className="heatmap-container">
        <div className="heatmap-weekdays">
          {weekDays.map((day, index) => (
            <div key={index} className="weekday-label">
              {day}
            </div>
          ))}
        </div>
        <div className="heatmap-grid">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="heatmap-week">
              {week.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className="heatmap-cell"
                  style={{ backgroundColor: getIntensityColor(day.intensity) }}
                  onMouseEnter={() => setSelectedDate(day)}
                  onMouseLeave={() => setSelectedDate(null)}
                  title={day.hours > 0 ? `${formatDate(day.date)}：${day.hours} 小时` : formatDate(day.date)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {selectedDate && (
        <div className="heatmap-tooltip">
          {formatDate(selectedDate.date)}：{selectedDate.hours} 小时
        </div>
      )}

      <div className="heatmap-legend">
        <span className="legend-label">少</span>
        <div className="legend-colors">
          {[0, 1, 2, 3, 4].map((intensity) => (
            <div key={intensity} className="legend-color" style={{ backgroundColor: getIntensityColor(intensity) }} />
          ))}
        </div>
        <span className="legend-label">多</span>
      </div>
    </div>
  )
}

export default HeatmapCalendar
