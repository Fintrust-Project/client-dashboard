import React, { useState, useEffect, useRef } from 'react'
import { format, differenceInDays } from 'date-fns'
import { supabase } from '../supabase'
import '../css/PaymentVerifications.css'

const PaymentVerifications = () => {
    const [activeTab, setActiveTab] = useState('pending') // 'pending' or 'verified'
    const [payments, setPayments] = useState([])
    const [loading, setLoading] = useState(true)

    // Receipt Modal State
    const [showReceiptModal, setShowReceiptModal] = useState(false)
    const [selectedPayment, setSelectedPayment] = useState(null)
    const [receiptForm, setReceiptForm] = useState({
        segment: '',
        startDate: '',
        endDate: ''
    })

    // Printing State
    const [printableReceiptData, setPrintableReceiptData] = useState(null)

    useEffect(() => {
        loadData()
    }, [activeTab])

    const loadData = async () => {
        try {
            setLoading(true)

            // Base query with relationships
            let query = supabase
                .from('payments')
                .select(`
                    id, amount, date, user_id, client_id, account_id,
                    clients ( name, mobile, email ),
                    profiles ( username )
                `)
                .order('created_at', { ascending: false })

            if (activeTab === 'pending') {
                query = query.eq('status', 'pending')
            } else {
                query = query.eq('status', 'verified').limit(50) // Limit verified history
            }

            const { data: rawPayments, error: payErr } = await query
            if (payErr) throw payErr

            // Enrich with Engagement info (for status badges)
            const enrichedPayments = await Promise.all(rawPayments.map(async (p) => {
                const { data: eng } = await supabase
                    .from('engagements')
                    .select('status, message')
                    .eq('client_id', p.client_id)
                    .eq('user_id', p.user_id)
                    .maybeSingle()

                return {
                    ...p,
                    engagement_status: eng?.status || 'waiting',
                    engagement_message: eng?.message || '-'
                }
            }))

            setPayments(enrichedPayments)
        } catch (error) {
            console.error('Error loading payments:', error.message)
            alert('Failed to load payments')
        } finally {
            setLoading(false)
        }
    }

    const handleVerification = async (paymentId, action) => {
        if (!window.confirm(`Are you sure you want to ${action} this payment?`)) return

        try {
            const { error } = await supabase
                .from('payments')
                .update({
                    status: action === 'approve' ? 'verified' : 'rejected'
                })
                .eq('id', paymentId)

            if (error) throw error
            loadData()
        } catch (error) {
            alert('Error: ' + error.message)
        }
    }

    const openReceiptModal = (payment) => {
        setSelectedPayment(payment)
        setReceiptForm({
            segment: '',
            startDate: format(new Date(), 'yyyy-MM-dd'),
            endDate: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'yyyy-MM-dd')
        })
        setShowReceiptModal(true)
        setPrintableReceiptData(null) // Reset print view
    }

    const handleGenerateReceipt = (e) => {
        e.preventDefault()
        // Prepare data for printing
        const gstAmount = selectedPayment.amount * 0.18 // 18% of total sales as requested? Or 18% Tax INCLUDED? 
        // User said: "deduct gst at bottom 18% of total sales" -> usually means Inclusive logic OR Breakdown.
        // Let's assume Inclusive for a safe Receipt: Total = 118, Tax = 18.
        // BUT user said "deduct".
        // Let's show: Gross Amount = Total / 1.18 ?? No, simple usually better.
        // Let's show: Total Amount Received. Breakdown: Taxable Value + GST.
        // Calculation: 
        // Taxable = Amount / 1.18
        // GST = Amount - Taxable

        // Wait, user said "gst deduction always 18% of total sales".
        // If Sales = 100, GST = 18 ? 
        // Let's take the input payment.amount as "Total Paid by Client".

        const totalAmount = parseFloat(selectedPayment.amount)
        const taxableValue = totalAmount / 1.18
        const gstValue = totalAmount - taxableValue

        setPrintableReceiptData({
            ...selectedPayment,
            ...receiptForm,
            taxableValue,
            gstValue,
            totalAmount
        })

        // Give time for state to update then print
        setTimeout(() => {
            window.print()
        }, 500)
    }

    return (
        <div className="verifications-container">
            <div className="verifications-header">
                <h2>Payment Verifications</h2>
                <div className="header-controls">
                    <div className="tabs">
                        <button
                            className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
                            onClick={() => setActiveTab('pending')}
                        >
                            Pending
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'verified' ? 'active' : ''}`}
                            onClick={() => setActiveTab('verified')}
                        >
                            History (Verified)
                        </button>
                    </div>
                    <button onClick={loadData} className="refresh-btn" disabled={loading}>
                        {loading ? '⌛' : '🔄 Refresh'}
                    </button>
                </div>
            </div>

            <div className="verifications-content">
                {payments.length === 0 ? (
                    <div className="no-verifications" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                        <p>No {activeTab} payments found.</p>
                    </div>
                ) : (
                    <div className="payment-cards">
                        {payments.map(payment => (
                            <div key={payment.id} className="payment-card">
                                <div className="payment-info">
                                    <div className="info-row">
                                        <span className="label">Client:</span>
                                        <span className="value">{payment.clients?.name}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="label">Agent:</span>
                                        <span className="value">@{payment.profiles?.username}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="label">Amount:</span>
                                        <span className="amount">₹{parseFloat(payment.amount).toFixed(2)}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="label">Date:</span>
                                        <span className="value">{format(new Date(payment.date), 'MMM dd, yyyy')}</span>
                                    </div>
                                </div>
                                <div className="payment-actions">
                                    {activeTab === 'pending' ? (
                                        <>
                                            <button className="approve-btn" onClick={() => handleVerification(payment.id, 'approve')}>✓ Approve</button>
                                            <button className="reject-btn" onClick={() => handleVerification(payment.id, 'reject')}>✕ Reject</button>
                                        </>
                                    ) : (
                                        <>
                                            {(() => {
                                                const daysSincePayment = differenceInDays(new Date(), new Date(payment.date))
                                                const canGenerateReceipt = daysSincePayment <= 10

                                                return canGenerateReceipt ? (
                                                    <button className="receipt-btn" onClick={() => openReceiptModal(payment)}>
                                                        📄 Generate Receipt
                                                    </button>
                                                ) : (
                                                    <div style={{
                                                        padding: '0.8rem',
                                                        color: '#94a3b8',
                                                        fontSize: '0.85rem',
                                                        fontStyle: 'italic',
                                                        textAlign: 'center'
                                                    }}>
                                                        Receipt generation expired<br />
                                                        <span style={{ fontSize: '0.75rem' }}>({daysSincePayment} days old)</span>
                                                    </div>
                                                )
                                            })()}
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Receipt Modal */}
            {showReceiptModal && (
                <div className="modal-overlay" onClick={() => setShowReceiptModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>Generate Receipt</h3>
                        <form onSubmit={handleGenerateReceipt} className="modal-form">
                            <div className="form-group">
                                <label>Service Segment</label>
                                <select
                                    required
                                    value={receiptForm.segment}
                                    onChange={e => setReceiptForm({ ...receiptForm, segment: e.target.value })}
                                >
                                    <option value="">Select Segment...</option>
                                    <option value="Equity Cash">Equity Cash</option>
                                    <option value="F&O">F&O</option>
                                    <option value="Commodity">Commodity</option>
                                    <option value="Forex">Forex</option>
                                    <option value="Indices">Indices</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Service Start Date</label>
                                <input
                                    type="date" required
                                    value={receiptForm.startDate}
                                    onChange={e => setReceiptForm({ ...receiptForm, startDate: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Service End Date</label>
                                <input
                                    type="date" required
                                    value={receiptForm.endDate}
                                    onChange={e => setReceiptForm({ ...receiptForm, endDate: e.target.value })}
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowReceiptModal(false)}>Cancel</button>
                                <button type="submit" className="btn-submit">Generate & Print</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Printable Receipt Area (Only visible on Print) */}
            {printableReceiptData && (
                <div id="printable-receipt">
                    <div className="receipt-layout">
                        <div className="receipt-header">
                            <h1>FINTRUST</h1>
                            <p>Excellence in Financial Services</p>
                            <h2 style={{ marginTop: '2rem', borderBottom: '1px solid #000', display: 'inline-block' }}>PAYMENT RECEIPT</h2>
                        </div>

                        <div className="receipt-body">
                            <div className="receipt-row">
                                <span className="receipt-label">Receipt Date:</span>
                                <span className="receipt-value">{format(new Date(), 'dd MMMM yyyy')}</span>
                            </div>
                            <div className="receipt-row">
                                <span className="receipt-label">Client Name:</span>
                                <span className="receipt-value">{printableReceiptData.clients?.name}</span>
                            </div>
                            <div className="receipt-row">
                                <span className="receipt-label">Mobile:</span>
                                <span className="receipt-value">{printableReceiptData.clients?.mobile || 'N/A'}</span>
                            </div>
                            <div className="receipt-row">
                                <span className="receipt-label">Payment Date:</span>
                                <span className="receipt-value">{format(new Date(printableReceiptData.date), 'dd MMM yyyy')}</span>
                            </div>
                            <div className="receipt-row">
                                <span className="receipt-label">Service Segment:</span>
                                <span className="receipt-value">{printableReceiptData.segment}</span>
                            </div>
                            <div className="receipt-row">
                                <span className="receipt-label">Service Duration:</span>
                                <span className="receipt-value">
                                    {format(new Date(printableReceiptData.startDate), 'dd MMM yyyy')} TO {format(new Date(printableReceiptData.endDate), 'dd MMM yyyy')}
                                </span>
                            </div>
                            <div className="receipt-row">
                                <span className="receipt-label">Agent:</span>
                                <span className="receipt-value">{printableReceiptData.profiles?.username}</span>
                            </div>
                        </div>

                        <table className="receipt-table">
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th className="amount-right">Amount (INR)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Gross Service Value</td>
                                    <td className="amount-right">₹{printableReceiptData.taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                                <tr>
                                    <td>Add: GST @ 18%</td>
                                    <td className="amount-right">₹{printableReceiptData.gstValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                                <tr>
                                    <td style={{ fontWeight: 'bold' }}>TOTAL AMOUNT RECEIVED</td>
                                    <td className="amount-right" style={{ fontWeight: 'bold' }}>₹{printableReceiptData.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                            </tbody>
                        </table>

                        <div className="receipt-footer">
                            <p>This is a computer-generated receipt.</p>
                            <p>Thank you for your business!</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default PaymentVerifications
