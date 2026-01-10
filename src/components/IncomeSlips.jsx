import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns'
import '../css/IncomeSlips.css'

const IncomeSlips = () => {
    const { user } = useAuth()
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
    const [selectedAgentId, setSelectedAgentId] = useState('')
    const [slipsData, setSlipsData] = useState([])
    const [loading, setLoading] = useState(false)
    const [profiles, setProfiles] = useState({})
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(5) // Slips are large, show fewer per page

    useEffect(() => {
        fetchProfiles()
    }, [])


    useEffect(() => {
        if (Object.keys(profiles).length > 0) {
            setCurrentPage(1)
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

            // 1. Fetch ALL verified payments for the month (we'll filter by splits later)
            const { data: allPayments, error: payErr } = await supabase
                .from('payments')
                .select(`
                    id,
                    amount, 
                    date, 
                    account_id, 
                    user_id,
                    clients ( name, mobile )
                `)
                .eq('status', 'verified')
                .gte('date', start)
                .lte('date', end)

            if (payErr) throw payErr

            // 2. Fetch ALL splits for these payments
            const paymentIds = allPayments.map(p => p.id)
            const { data: allSplits, error: splitErr } = await supabase
                .from('payment_splits')
                .select('*')
                .in('payment_id', paymentIds)

            if (splitErr) throw splitErr

            // 3. Determine which users to show based on role and selection
            let targetUserIds = []

            if (user.role === 'admin') {
                if (selectedAgentId === 'all') {
                    // All users
                    targetUserIds = Object.keys(profiles)
                } else if (selectedAgentId) {
                    targetUserIds = [selectedAgentId]
                } else {
                    targetUserIds = [] // No agent selected
                }
            } else if (user.role === 'manager') {
                const teamIds = Object.values(profiles)
                    .filter(p => p.manager_id === user.id)
                    .map(p => p.id)
                teamIds.push(user.id)

                if (selectedAgentId === 'all') {
                    targetUserIds = teamIds
                } else if (selectedAgentId) {
                    if (teamIds.includes(selectedAgentId)) {
                        targetUserIds = [selectedAgentId]
                    } else {
                        targetUserIds = [] // Invalid selection
                    }
                } else {
                    targetUserIds = [] // No agent selected
                }
            } else {
                targetUserIds = [user.id]
            }

            // 4. Build slip data for each target user
            const grouped = {}

            targetUserIds.forEach(userId => {
                grouped[userId] = {
                    userId: userId,
                    userName: profiles[userId]?.username || 'Unknown Agent',
                    userRole: profiles[userId]?.role || 'User',
                    totalAmount: 0,
                    records: []
                }
            })

            // 5. Process each payment
            allPayments.forEach(payment => {
                const fullAmount = parseFloat(payment.amount || 0)
                const paymentSplits = allSplits?.filter(s => s.payment_id === payment.id) || []

                if (paymentSplits.length === 0) {
                    // No splits - full amount goes to payment owner
                    if (grouped[payment.user_id]) {
                        grouped[payment.user_id].totalAmount += fullAmount
                        grouped[payment.user_id].records.push({
                            date: payment.date,
                            account: payment.account_id || 'N/A',
                            clientName: payment.clients?.name || 'Unknown',
                            clientMobile: payment.clients?.mobile || '-',
                            fullAmount: fullAmount,
                            actualAmount: fullAmount,
                            splitPercentage: 100,
                            hasSplit: false
                        })
                    }
                } else {
                    // Has splits - distribute to each recipient
                    paymentSplits.forEach(split => {
                        if (grouped[split.user_id]) {
                            const splitAmount = parseFloat(split.amount)
                            const splitPercentage = parseFloat(split.percentage)

                            grouped[split.user_id].totalAmount += splitAmount
                            grouped[split.user_id].records.push({
                                date: payment.date,
                                account: payment.account_id || 'N/A',
                                clientName: payment.clients?.name || 'Unknown',
                                clientMobile: payment.clients?.mobile || '-',
                                fullAmount: fullAmount,
                                actualAmount: splitAmount,
                                splitPercentage: splitPercentage,
                                hasSplit: true
                            })
                        }
                    })

                    // Also check if payment owner kept a portion (has their own split)
                    const ownerSplit = paymentSplits.find(s => s.user_id === payment.user_id)
                    if (!ownerSplit && grouped[payment.user_id]) {
                        // Owner didn't create a split for themselves, so they get the remainder
                        const totalSplitPercentage = paymentSplits.reduce((sum, s) => sum + parseFloat(s.percentage), 0)
                        const remainingPercentage = 100 - totalSplitPercentage

                        if (remainingPercentage > 0) {
                            const remainingAmount = (fullAmount * remainingPercentage) / 100

                            grouped[payment.user_id].totalAmount += remainingAmount
                            grouped[payment.user_id].records.push({
                                date: payment.date,
                                account: payment.account_id || 'N/A',
                                clientName: payment.clients?.name || 'Unknown',
                                clientMobile: payment.clients?.mobile || '-',
                                fullAmount: fullAmount,
                                actualAmount: remainingAmount,
                                splitPercentage: remainingPercentage,
                                hasSplit: true
                            })
                        }
                    }
                }
            })

            // Filter out users with no records
            const slipsWithData = Object.values(grouped).filter(slip => slip.records.length > 0)
            setSlipsData(slipsWithData)

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
                            <option value="">Select Agent...</option>
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
                        {selectedAgentId ? `No verified payments found for ${format(parseISO(selectedMonth + '-01'), 'MMMM yyyy')}.` : 'Please select an agent and click "Generate Slip".'}
                    </div>
                ) : (
                    <>
                        {slipsData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(slip => {
                            const gstAmount = slip.totalAmount * 0.18
                            const netPayable = slip.totalAmount - gstAmount

                            return (
                                <div key={slip.userId} className="slip-card official-slip">
                                    <div className="official-header">
                                        <div className="company-branding">
                                            <h1>INDIA INVEST KARO</h1>
                                            <p>Empowering Your Financial Growth</p>
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
                                                    <th className="amount-col">Full Amount</th>
                                                    <th className="amount-col">Your Share</th>
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
                                                        <td className="amount-col">
                                                            {record.fullAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="amount-col">
                                                            {record.hasSplit && record.splitPercentage < 100 ? (
                                                                <>
                                                                    <div style={{ fontSize: '0.85em', color: '#3b82f6', fontWeight: '600' }}>
                                                                        {record.splitPercentage.toFixed(1)}%
                                                                    </div>
                                                                    <div>{record.actualAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                                                </>
                                                            ) : (
                                                                <div>{record.actualAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="summary-row total-sales-row">
                                                    <td colSpan="3" className="label-cell">Total Gross Sales / Collection</td>
                                                    <td className="amount-cell">₹{slip.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                </tr>
                                                <tr className="summary-row gst-row">
                                                    <td colSpan="3" className="label-cell">Less: GST @ 18%</td>
                                                    <td className="amount-cell red-text">- ₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                </tr>
                                                <tr className="summary-row net-pay-row">
                                                    <td colSpan="3" className="label-cell">NET PAYABLE INCOME</td>
                                                    <td className="amount-cell highlight-green">₹{netPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                </tr>
                                            </tfoot>
                                        </table>

                                        <div className="slip-footer-disclaimer">
                                            <p>* This is an electronically generated document. No signature is required.</p>
                                            <p>* All payments are subject to standard verification protocols.</p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}

                        {/* Pagination Footer */}
                        {slipsData.length > itemsPerPage && (
                            <div className="pagination-footer" style={{ marginTop: '2rem', padding: '1rem', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                <div className="pagination-info" style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                    Showing slips <span>{(currentPage - 1) * itemsPerPage + 1}</span> to <span>{Math.min(currentPage * itemsPerPage, slipsData.length)}</span> of <span>{slipsData.length}</span>
                                </div>

                                <div className="pagination-controls" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <button
                                        disabled={currentPage === 1 || loading}
                                        onClick={() => setCurrentPage(prev => prev - 1)}
                                        style={{ padding: '0.5rem 1rem', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1, fontWeight: '600' }}
                                    >
                                        Previous
                                    </button>

                                    <div className="page-numbers" style={{ fontWeight: '600', color: '#1e293b' }}>
                                        Page {currentPage} of {Math.ceil(slipsData.length / itemsPerPage)}
                                    </div>

                                    <button
                                        disabled={currentPage >= Math.ceil(slipsData.length / itemsPerPage) || loading}
                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                        style={{ padding: '0.5rem 1rem', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: currentPage >= Math.ceil(slipsData.length / itemsPerPage) ? 'not-allowed' : 'pointer', opacity: currentPage >= Math.ceil(slipsData.length / itemsPerPage) ? 0.5 : 1, fontWeight: '600' }}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

export default IncomeSlips
