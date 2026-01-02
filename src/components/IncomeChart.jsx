import React, { useState, useEffect, useMemo } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachWeekOfInterval, isWithinInterval } from 'date-fns'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabase'
import '../css/IncomeChart.css'

const IncomeChart = () => {
  const { user } = useAuth()
  const [period, setPeriod] = useState('weekly') // 'weekly' or 'monthly'
  const [payments, setPayments] = useState([])
  const [profiles, setProfiles] = useState({})
  const [loading, setLoading] = useState(true)
  const [breakdownView, setBreakdownView] = useState('agent') // 'agent' or 'team'

  useEffect(() => {
    fetchIncomeData()
  }, [user])

  const fetchIncomeData = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('payments')
        .select('amount, date, status, user_id')
        .eq('status', 'verified')

      // Role-based filtering
      if (user?.role === 'manager') {
        // Fetch team members
        const { data: team } = await supabase
          .from('profiles')
          .select('id')
          .eq('manager_id', user.id)

        const ids = [user.id, ...(team?.map(t => t.id) || [])]
        query = query.in('user_id', ids)
      } else if (user?.role === 'user') {
        query = query.eq('user_id', user.id)
      }

      const { data, error } = await query
      if (error) throw error
      setPayments(data || [])

      // Fetch profiles for names
      const { data: profileData } = await supabase.from('profiles').select('id, username, role, manager_id')
      if (profileData) {
        const profileMap = {}
        profileData.forEach(p => { profileMap[p.id] = p })
        setProfiles(profileMap)
      }
    } catch (err) {
      console.error('Error fetching income:', err.message)
    } finally {
      setLoading(false)
    }
  }

  const chartData = useMemo(() => {
    const now = new Date()

    if (period === 'weekly') {
      const monthStart = startOfMonth(now)
      const monthEnd = endOfMonth(now)

      const weeks = []
      for (let i = 0; i < 5; i++) {
        const startDay = (i * 7) + 1
        if (startDay > monthEnd.getDate()) break

        const wStart = new Date(now.getFullYear(), now.getMonth(), startDay)
        let endDay = (i + 1) * 7
        if (endDay > monthEnd.getDate() || i === 4) endDay = monthEnd.getDate()

        const wEnd = new Date(now.getFullYear(), now.getMonth(), endDay, 23, 59, 59)

        const total = payments
          .filter(p => {
            const d = new Date(p.date)
            return d >= wStart && d <= wEnd
          })
          .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)

        weeks.push({
          period: `${format(wStart, 'dd')}-${format(wEnd, 'dd')} ${format(wStart, 'MMM')}`,
          income: total
        })

        if (endDay === monthEnd.getDate()) break
      }
      return weeks
    } else {
      // Monthly - Last 6 months
      const result = []
      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - i, 1))
        const monthEnd = endOfMonth(monthStart)

        const total = payments
          .filter(p => {
            const d = new Date(p.date)
            return d >= monthStart && d <= monthEnd
          })
          .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)

        result.push({
          period: format(monthStart, 'MMM yyyy'),
          income: total
        })
      }
      return result
    }
  }, [period, payments])

  const grandTotal = useMemo(() => {
    return payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
  }, [payments])

  const breakdownData = useMemo(() => {
    if (!payments.length) return []

    if (breakdownView === 'agent') {
      const agentTotals = {}
      payments.forEach(p => {
        if (!agentTotals[p.user_id]) agentTotals[p.user_id] = 0
        agentTotals[p.user_id] += parseFloat(p.amount || 0)
      })

      return Object.entries(agentTotals).map(([uid, total]) => ({
        id: uid,
        name: profiles[uid]?.username || 'Unknown',
        role: profiles[uid]?.role || '-',
        manager: profiles[profiles[uid]?.manager_id]?.username || '-',
        amount: total
      })).sort((a, b) => b.amount - a.amount)
    } else {
      // Team Breakdown (Aggregation by Manager)
      const teamTotals = {}
      payments.forEach(p => {
        const agent = profiles[p.user_id]
        if (!agent) return

        // If agent is a manager, they are their own team leader effectively, or we group strictly by manager_id
        // Let's group by "Team Lead" (manager_id). If manager_id is null, maybe they are the top admin or independent.
        // Identify the Team Lead:
        let leaderId = agent.manager_id
        if (!leaderId && agent.role === 'manager') leaderId = agent.id // If self is manager
        if (!leaderId) leaderId = 'unassigned'

        if (!teamTotals[leaderId]) teamTotals[leaderId] = 0
        teamTotals[leaderId] += parseFloat(p.amount || 0)
      })

      return Object.entries(teamTotals).map(([lid, total]) => ({
        id: lid,
        name: lid === 'unassigned' ? 'Unassigned/Admins' : (profiles[lid]?.username || 'Unknown'),
        role: 'Team Lead',
        amount: total
      })).sort((a, b) => b.amount - a.amount)
    }
  }, [payments, profiles, breakdownView])

  if (loading) return <div className="income-chart-loading">Updating Financials...</div>

  return (
    <div className="income-chart-container">
      <div className="chart-header">
        <h2>Income Analytics</h2>
        <div className="period-toggle">
          <button className={period === 'weekly' ? 'active' : ''} onClick={() => setPeriod('weekly')}>Weekly</button>
          <button className={period === 'monthly' ? 'active' : ''} onClick={() => setPeriod('monthly')}>Monthly</button>
        </div>
      </div>

      <div className="chart-summary">
        <div className="summary-card">
          <h3>Total Verified Collection</h3>
          <p className="amount">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          <span className="summary-subtitle">Based on approved payment requests</span>
        </div>
      </div>

      {(user?.role === 'admin' || user?.role === 'manager') && (
        <div className="breakdown-section">
          <div className="breakdown-header">
            <h3>Performance Breakdown</h3>
            <div className="view-toggles">
              <button
                className={breakdownView === 'agent' ? 'active' : ''}
                onClick={() => setBreakdownView('agent')}
              >
                By Agent
              </button>
              {user.role === 'admin' && (
                <button
                  className={breakdownView === 'team' ? 'active' : ''}
                  onClick={() => setBreakdownView('team')}
                >
                  By Team
                </button>
              )}
            </div>
          </div>

          <div className="breakdown-table-wrapper">
            <table className="breakdown-table">
              <thead>
                <tr>
                  <th>Name</th>
                  {breakdownView === 'agent' && <th>Role</th>}
                  {breakdownView === 'agent' && <th>Team Lead</th>}
                  <th>Total Collection</th>
                </tr>
              </thead>
              <tbody>
                {breakdownData.map(item => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    {breakdownView === 'agent' && <td><span className={`role-badge role-${item.role}`}>{item.role}</span></td>}
                    {breakdownView === 'agent' && <td>{item.manager}</td>}
                    <td className="amount-cell">₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                {breakdownData.length === 0 && <tr><td colSpan="4" className="no-data">No data available</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={350}>
          {period === 'weekly' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="period" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
              <Tooltip formatter={(v) => `₹${parseFloat(v).toFixed(2)}`} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Line type="monotone" dataKey="income" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
            </LineChart>
          ) : (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="period" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => `₹${parseFloat(v).toFixed(2)}`} />
              <Bar dataKey="income" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default IncomeChart
