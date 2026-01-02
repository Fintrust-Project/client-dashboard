import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabase'
import { format, startOfMonth } from 'date-fns'
import '../css/Attendance.css'

const Attendance = () => {
  const { user } = useAuth()
  const [attendance, setAttendance] = useState([])
  const [teamAttendance, setTeamAttendance] = useState([])
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [viewMode, setViewMode] = useState('own') // 'own' or 'team'
  const [loading, setLoading] = useState(true)
  const [teamMembers, setTeamMembers] = useState([])

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    try {
      setLoading(true)

      // 1. Load Own Attendance
      const { data: own, error: ownErr } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)

      if (ownErr) throw ownErr
      setAttendance(own || [])

      // 2. Load Team Data if Manager
      if (user?.role === 'manager' || user?.role === 'admin') {
        const { data: members } = await supabase
          .from('profiles')
          .select('id, username')
          .eq('manager_id', user.id)

        setTeamMembers(members || [])

        const memberIds = members?.map(m => m.id) || []
        if (memberIds.length > 0) {
          const { data: team } = await supabase
            .from('attendance')
            .select('*')
            .in('user_id', memberIds)
          setTeamAttendance(team || [])
        }
      }
    } catch (err) {
      console.error('Attendance Load Error:', err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAttendance = async () => {
    const existing = attendance.find(a => a.date === selectedDate)

    try {
      if (existing) {
        // Delete
        await supabase.from('attendance').delete().eq('id', existing.id)
      } else {
        // Insert
        await supabase.from('attendance').insert([{
          user_id: user.id,
          date: selectedDate,
          status: 'present'
        }])
      }
      loadData()
    } catch (err) {
      alert('Failed to update attendance')
    }
  }

  // Stats Logic
  const stats = useMemo(() => {
    const currentItems = viewMode === 'team' ? teamAttendance : attendance
    const monthStr = format(new Date(), 'yyyy-MM')
    const monthItems = currentItems.filter(a => a.date.startsWith(monthStr))
    const totalDaysInMonth = new Date().getDate()

    return {
      presentCount: monthItems.length,
      currentDay: totalDaysInMonth,
      rate: totalDaysInMonth > 0 ? Math.round((monthItems.length / totalDaysInMonth) * 100) : 0
    }
  }, [viewMode, attendance, teamAttendance])

  if (loading) return <div className="loading">Updating Timesheets...</div>

  return (
    <div className="attendance-container">
      <div className="attendance-header">
        <h2>Attendance Tracking</h2>
        {user?.role !== 'user' && (
          <div className="view-toggle">
            <button className={viewMode === 'own' ? 'active' : ''} onClick={() => setViewMode('own')}>My Log</button>
            <button className={viewMode === 'team' ? 'active' : ''} onClick={() => setViewMode('team')}>Team Log</button>
          </div>
        )}
      </div>

      <div className="attendance-stats">
        <div className="stat-card">
          <h3>Days Present</h3>
          <p className="stat-value">{stats.presentCount} / {stats.currentDay}</p>
          <p className="stat-label">This Month</p>
        </div>
        <div className="stat-card">
          <h3>Attendance Rate</h3>
          <p className="stat-value">{stats.rate}%</p>
          <p className="stat-label">Efficiency</p>
        </div>
      </div>

      {viewMode === 'own' && (
        <div className="attendance-actions">
          <div className="date-picker-group">
            <label>Date:</label>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          </div>
          <button
            className={`mark-btn ${attendance.some(a => a.date === selectedDate) ? 'present' : ''}`}
            onClick={handleToggleAttendance}
          >
            {attendance.some(a => a.date === selectedDate) ? '✓ Marked Present' : 'Mark Attendance'}
          </button>
        </div>
      )}

      <div className="attendance-history">
        <h3>{viewMode === 'team' ? 'Team Activity' : 'Recent Logs'}</h3>
        {viewMode === 'own' ? (
          <div className="attendance-list-premium">
            {attendance.sort((a, b) => new Date(b.date) - new Date(a.date)).map(a => (
              <div key={a.id} className="log-item">
                <span className="log-date">{format(new Date(a.date), 'MMM dd, yyyy')}</span>
                <span className="log-status">PRESENT</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="team-attendance-grid">
            {teamMembers.map(member => {
              const memberLogs = teamAttendance.filter(a => a.user_id === member.id)
              return (
                <div key={member.id} className="member-attendance-card">
                  <div className="member-info">
                    <strong>{member.username}</strong>
                    <span>{memberLogs.length} days present</span>
                  </div>
                  <div className="member-dots">
                    {memberLogs.slice(-10).map(l => (
                      <span key={l.id} className="dot" title={l.date}></span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Attendance
