import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns'
import '../css/IncomeSlips.css'

const IncomeSlips = () => {
    const { user } = useAuth()
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
    const [slipsData, setSlipsData] = useState([])
    const [loading, setLoading] = useState(false)
    const [profiles, setProfiles] = useState({})

    useEffect(() => {
        fetchProfiles()
    }, [])

    useEffect(() => {
        if (Object.keys(profiles).length > 0) {
            generateSlips()
        }
    }, [selectedMonth, profiles])

    const fetchProfiles = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, username, role, manager_id')

            // For managers, we only care about their team or themself? 
            // The prompt says "admin can select month... close". 
            // Admin sees all. Users/Managers see theirs.

            if (error) throw error
            const map = {}
            data.forEach(p => map[p.id] = p)
            setProfiles(map)
        } catch (error) {
            console.error('Error fetching profiles:', error)
        }
    }

    const generateSlips = async () => {
        setLoading(true)
        try {
            const date = parseISO(selectedMonth + '-01')
            const start = startOfMonth(date).toISOString()
            const end = endOfMonth(date).toISOString()

            // 1. Fetch Payments
            let query = supabase
                .from('payments')
                .select(`
                    amount, 
                    date, 
                    account_id, 
                    user_id,
                    clients ( name, mobile )
                `)
                .eq('status', 'verified')
                .gte('date', start)
                .lte('date', end)

            // Role filtering
            if (user.role === 'manager') {
                // Determine team members
                const teamIds = Object.values(profiles)
                    .filter(p => p.manager_id === user.id)
                    .map(p => p.id)
                teamIds.push(user.id) // Include self
                query = query.in('user_id', teamIds)
            } else if (user.role === 'user') {
                query = query.eq('user_id', user.id)
            }

            const { data: payments, error } = await query
            if (error) throw error

            // 2. Group by User
            const grouped = {}
            payments.forEach(p => {
                if (!grouped[p.user_id]) {
                    grouped[p.user_id] = {
                        userId: p.user_id,
                        userName: profiles[p.user_id]?.username || 'Unknown Agent',
                        userRole: profiles[p.user_id]?.role || 'User',
                        totalAmount: 0,
                        records: []
                    }
                }
                const amount = parseFloat(p.amount || 0)
                grouped[p.user_id].totalAmount += amount
                grouped[p.user_id].records.push({
                    date: p.date,
                    account: p.account_id || 'N/A',
                    clientName: p.clients?.name || 'Unknown',
                    clientMobile: p.clients?.mobile || '-',
                    amount: amount
                })
            })

            setSlipsData(Object.values(grouped))

        } catch (error) {
            console.error('Error generating slips:', error)
        } finally {
            setLoading(false)
        }
    }

    const handlePrint = () => {
        window.print()
    }

    if (user?.role === 'user') {
        // Maybe users can see their own slip?
        // User request said "admin can select month", implying admin feature.
        // But let's allow everyone to see their own compliant slip.
    }

    return (
        <div className="income-slips-container">
            <div className="slips-header">
                <div className="title-group">
                    <h2>Income Slips Generation</h2>
                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                        Generate official monthly income statements for agents.
                    </p>
                </div>
                <div className="controls-area">
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="month-selector"
                    />
                    <button className="generate-btn" onClick={generateSlips} disabled={loading}>
                        {loading ? 'Generating...' : 'Refresh Slips'}
                    </button>
                    <button className="generate-btn" style={{ background: '#475569' }} onClick={handlePrint}>
                        🖨️ Print All
                    </button>
                </div>
            </div>

            <div className="slips-list">
                {slipsData.length === 0 ? (
                    <div className="no-data" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                        No verified payments found for {format(parseISO(selectedMonth + '-01'), 'MMMM yyyy')}.
                    </div>
                ) : (
                    slipsData.map(slip => (
                        <div key={slip.userId} className="slip-card">
                            <div className="slip-header">
                                <div className="agent-info">
                                    <h3>{slip.userName}</h3>
                                    <span className="role">{slip.userRole}</span>
                                </div>
                                <div className="slip-summary">
                                    <span className="total-label">Total Payout ({format(parseISO(selectedMonth + '-01'), 'MMM yyyy')})</span>
                                    <span className="total-amount">₹{slip.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            <div className="slip-table-container">
                                <button className="print-btn" onClick={() => {
                                    // Hacky way to print single div? No, easiest is just print page for now or filter views.
                                    // For now, "Print All" is the main feature.
                                    alert('To print a single slip, use the browser print function and select "Selection" or use "Print All" for the monthly report.')
                                }}>Print Slip</button>

                                <table className="slip-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Account No.</th>
                                            <th>Client Name / Mobile</th>
                                            <th className="amount-col">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {slip.records.map((record, idx) => (
                                            <tr key={idx}>
                                                <td>{format(new Date(record.date), 'dd MMM yyyy')}</td>
                                                <td>{record.account}</td>
                                                <td>
                                                    {record.clientName}<br />
                                                    <span style={{ fontSize: '0.8em', color: '#94a3b8' }}>{record.clientMobile}</span>
                                                </td>
                                                <td className="amount-col">₹{record.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default IncomeSlips
