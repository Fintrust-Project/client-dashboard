import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns'
import '../css/IncomeSlips.css'

const IncomeSlips = () => {
    const { user } = useAuth()
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
    const [selectedAgentId, setSelectedAgentId] = useState('all')
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
    }, [selectedMonth, selectedAgentId, profiles])

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
            // Role filtering & User Selection
            if (user.role === 'manager') {
                // Determine team members
                const teamIds = Object.values(profiles)
                    .filter(p => p.manager_id === user.id)
                    .map(p => p.id)
                teamIds.push(user.id) // Include self

                if (selectedAgentId !== 'all') {
                    if (teamIds.includes(selectedAgentId)) {
                        query = query.eq('user_id', selectedAgentId)
                    } else {
                        // Manager trying to select someone not in team? Block or show empty.
                        query = query.eq('user_id', '00000000-0000-0000-0000-000000000000')
                    }
                } else {
                    query = query.in('user_id', teamIds)
                }

            } else if (user.role === 'admin') {
                if (selectedAgentId !== 'all') {
                    query = query.eq('user_id', selectedAgentId)
                }
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
                    <h2>Salary / Income Statements</h2>
                </div>
                <div className="controls-area">
                    {(user.role === 'admin' || user.role === 'manager') && (
                        <select
                            className="agent-selector"
                            value={selectedAgentId}
                            onChange={(e) => setSelectedAgentId(e.target.value)}
                        >
                            <option value="all">All Agents</option>
                            {Object.values(profiles)
                                .filter(p => {
                                    if (user.role === 'admin') return true
                                    if (user.role === 'manager') return p.manager_id === user.id || p.id === user.id
                                    return false
                                })
                                .sort((a, b) => a.username.localeCompare(b.username))
                                .map(p => (
                                    <option key={p.id} value={p.id}>{p.username}</option>
                                ))
                            }
                        </select>
                    )}

                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="month-selector"
                    />
                    <button className="generate-btn" onClick={generateSlips} disabled={loading}>
                        {loading ? 'Processing...' : 'Generate Slip'}
                    </button>
                    <button className="generate-btn print-btn-main" onClick={handlePrint}>
                        🖨️ Print
                    </button>
                </div>
            </div>

            <div className="slips-list">
                {slipsData.length === 0 ? (
                    <div className="no-data" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                        No verified payments found for {format(parseISO(selectedMonth + '-01'), 'MMMM yyyy')}.
                    </div>
                ) : (
                    slipsData.map(slip => {
                        const gstAmount = slip.totalAmount * 0.18
                        const netPayable = slip.totalAmount - gstAmount

                        return (
                            <div key={slip.userId} className="slip-card official-slip">
                                <div className="official-header">
                                    <div className="company-branding">
                                        <h1>FINTRUST</h1>
                                        <p>Excellence in Financial Services</p>
                                    </div>
                                    <div className="slip-meta">
                                        <h3>SALARY / INCOME SLIP</h3>
                                        <div className="meta-row">
                                            <span>Month:</span>
                                            <strong>{format(parseISO(selectedMonth + '-01'), 'MMMM yyyy')}</strong>
                                        </div>
                                        <div className="meta-row">
                                            <span>Agent Name:</span>
                                            <strong>{slip.userName}</strong>
                                        </div>
                                        <div className="meta-row">
                                            <span>Role:</span>
                                            <strong style={{ textTransform: 'capitalize' }}>{slip.userRole}</strong>
                                        </div>
                                    </div>
                                </div>

                                <div className="slip-table-container">
                                    <table className="slip-table">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Particulars (Client / Mobile / Account)</th>
                                                <th className="amount-col">Amount (INR)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {slip.records.map((record, idx) => (
                                                <tr key={idx}>
                                                    <td>{format(new Date(record.date), 'dd-MM-yyyy')}</td>
                                                    <td>
                                                        <div className="particulars-cell">
                                                            <span className="client-name">{record.clientName}</span>
                                                            <span className="details">Mobile: {record.clientMobile} | Acc: {record.account}</span>
                                                        </div>
                                                    </td>
                                                    <td className="amount-col">{record.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="summary-row total-sales-row">
                                                <td colSpan="2" className="label-cell">Total Gross Sales / Collection</td>
                                                <td className="amount-cell">₹{slip.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                            </tr>
                                            <tr className="summary-row gst-row">
                                                <td colSpan="2" className="label-cell">Less: GST @ 18%</td>
                                                <td className="amount-cell red-text">- ₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                            </tr>
                                            <tr className="summary-row net-pay-row">
                                                <td colSpan="2" className="label-cell">NET PAYABLE INCOME</td>
                                                <td className="amount-cell highlight-green">₹{netPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                            </tr>
                                        </tfoot>
                                    </table>

                                    <div className="slip-footer">
                                        <p>This is a computer-generated document and does not require a physical signature.</p>
                                        <p>Fintrust Financial Services • India</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}

export default IncomeSlips
