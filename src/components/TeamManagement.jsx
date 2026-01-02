import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../supabase'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import '../css/TeamManagement.css'

const TeamManagement = () => {
  const { user } = useAuth()
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [period, setPeriod] = useState('weekly')
  const [teamMembers, setTeamMembers] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) loadTeamData()
  }, [user])

  const loadTeamData = async () => {
    try {
      setLoading(true)

      // 1. Fetch team members/profiles
      let membersQuery = supabase.from('profiles').select('id, username, role')

      if (user.role === 'admin') {
        membersQuery = membersQuery.neq('id', user.id)
      } else {
        membersQuery = membersQuery.eq('manager_id', user.id)
      }

      const { data: members, error: memErr } = await membersQuery
      if (memErr) throw memErr
      setTeamMembers(members || [])

      const memberIds = members?.map(m => m.id) || []
      const allTeamIds = [user.id, ...memberIds]

      // 2. Fetch verified payments where any team member is either owner or split recipient
      // This ensures we get all payments that might have a share for our team
      const { data: payData, error: payErr } = await supabase
        .from('payments')
        .select('id, amount, date, user_id')
        .eq('status', 'verified')
      // We'll fetch more than we need and filter in JS for simplicity/reliability

      if (payErr) throw payErr

      // 3. Fetch splits for ALL these payments
      const paymentIds = payData.map(p => p.id)
      let splits = []
      if (paymentIds.length > 0) {
        // Chunking the array if it's too large might be needed, but usually 1000 items is fine for .in()
        const { data: splitData, error: splitErr } = await supabase
          .from('payment_splits')
          .select('*')
          .in('payment_id', paymentIds)

        if (splitErr) throw splitErr
        splits = splitData || []
      }

      // 4. Process into Shares
      const shares = []
      payData.forEach(p => {
        const pSplits = splits.filter(s => s.payment_id === p.id)
        const fullAmount = parseFloat(p.amount || 0)

        if (pSplits.length === 0) {
          // No splits, belongs to owner
          shares.push({
            amount: fullAmount,
            date: p.date,
            user_id: p.user_id
          })
        } else {
          // Has splits
          pSplits.forEach(s => {
            shares.push({
              amount: parseFloat(s.amount),
              date: p.date,
              user_id: s.user_id
            })
          })

          // Remainder for owner
          const totalSplit = pSplits.reduce((sum, s) => sum + parseFloat(s.amount), 0)
          const remainder = fullAmount - totalSplit
          if (remainder > 0.01) {
            shares.push({
              amount: remainder,
              date: p.date,
              user_id: p.user_id
            })
          }
        }
      })

      // 5. Filter shares for the team
      const teamShares = shares.filter(s => allTeamIds.includes(s.user_id))
      setPayments(teamShares)

    } catch (err) {
      console.error('Error loading team stats:', err.message)
    } finally {
      setLoading(false)
    }
  }

  const chartData = useMemo(() => {
    const now = new Date()
    const filteredPayments = selectedUserId
      ? payments.filter(p => p.user_id === selectedUserId)
      : payments

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

        const total = filteredPayments
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
      const result = []
      for (let i = 5; i >= 0; i--) {
        const d_start = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthStart = startOfMonth(d_start)
        const monthEnd = endOfMonth(monthStart)

        const total = filteredPayments
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
  }, [period, selectedUserId, payments])

  const currentSelectionLabel = useMemo(() => {
    if (selectedUserId === null) return 'Entire Team'
    if (selectedUserId === user?.id) return 'My Income'
    const member = teamMembers.find(m => m.id === selectedUserId)
    return (member?.username || 'Team Member') + "'s Results"
  }, [selectedUserId, teamMembers, user])

  const grandTotal = useMemo(() => {
    const filtered = selectedUserId
      ? payments.filter(p => p.user_id === selectedUserId)
      : payments
    return filtered.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
  }, [payments, selectedUserId])

  if (loading) return <div className="loading">Loading Team Metrics...</div>

  return (
    <div className="team-management-container">
      <div className="team-header">
        <div className="header-title-row">
          <h2>Team Performance</h2>
          <button className="refresh-btn" onClick={loadTeamData}>🔄 Sync Data</button>
        </div>
        <div className="user-selector">
          <button className={selectedUserId === null ? 'active' : ''} onClick={() => setSelectedUserId(null)}>Full Team</button>
          <button className={selectedUserId === user?.id ? 'active' : ''} onClick={() => setSelectedUserId(user?.id)}>Personal</button>
          {teamMembers.map(member => (
            <button key={member.id} className={selectedUserId === member.id ? 'active' : ''} onClick={() => setSelectedUserId(member.id)}>
              {member.username}
            </button>
          ))}
        </div>
      </div>

      <div className="team-income-chart">
        <div className="chart-header">
          <h3>Collection: {currentSelectionLabel}</h3>
          <div className="period-toggle">
            <button className={period === 'weekly' ? 'active' : ''} onClick={() => setPeriod('weekly')}>Weekly</button>
            <button className={period === 'monthly' ? 'active' : ''} onClick={() => setPeriod('monthly')}>Monthly</button>
          </div>
        </div>

        <div className="chart-summary">
          <div className="summary-card">
            <h4>Total Verified Income</h4>
            <p className="amount">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={350}>
            {period === 'weekly' ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="period" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip formatter={(v) => `₹${parseFloat(v).toFixed(2)}`} />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} name="Verified Income" />
              </LineChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="period" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => `₹${parseFloat(v).toFixed(2)}`} />
                <Legend />
                <Bar dataKey="income" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Verified Income" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default TeamManagement
