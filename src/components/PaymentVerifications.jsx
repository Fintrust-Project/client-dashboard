import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { supabase } from '../supabase'
import '../css/PaymentVerifications.css'

const PaymentVerifications = () => {
    const [pendingPayments, setPendingPayments] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)

            // 1. Fetch pending payments with basic Client and Agent info
            // (These relationships definitely exist)
            const { data: payments, error: payErr } = await supabase
                .from('payments')
                .select(`
                    id, amount, date, user_id, client_id, account_id,
                    clients ( name ),
                    profiles ( username )
                `)
                .eq('status', 'pending')
                .order('created_at', { ascending: false })

            if (payErr) throw payErr

            // 2. Enrich with Engagement Status
            // We fetch the status for these specific user+client pairs
            const enrichedPayments = await Promise.all(payments.map(async (p) => {
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

            setPendingPayments(enrichedPayments)
        } catch (error) {
            console.error('Error loading verifications:', error.message)
            alert('Failed to load payments: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleVerification = async (paymentId, action) => {
        try {
            const { error } = await supabase
                .from('payments')
                .update({
                    status: action === 'approve' ? 'verified' : 'rejected'
                })
                .eq('id', paymentId)

            if (error) throw error
            loadData()
            alert(`Payment ${action === 'approve' ? 'approved' : 'rejected'}.`)
        } catch (error) {
            alert('Error: ' + error.message)
        }
    }

    return (
        <div className="verifications-container">
            <div className="verifications-header">
                <h2>Payment Verifications</h2>
                <button onClick={loadData} className="refresh-btn" disabled={loading}>
                    {loading ? '⌛ Loading...' : '🔄 Refresh'}
                </button>
            </div>

            <div className="verifications-content">
                {pendingPayments.length === 0 ? (
                    <div className="no-verifications">
                        <p>{loading ? 'Fetching payments...' : 'No pending payments found.'}</p>
                    </div>
                ) : (
                    <div className="payment-cards">
                        {pendingPayments.map(payment => (
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
                                        <span className="label">Account ID:</span>
                                        <span className="value">{payment.account_id || '-'}</span>
                                    </div>
                                    <div className="info-row">
                                        <span className="label">Engagement Status:</span>
                                        <span className={`status-badge status-${payment.engagement_status}`}>
                                            {payment.engagement_status}
                                        </span>
                                    </div>
                                    <div className="info-row">
                                        <span className="label">Date:</span>
                                        <span className="value">{format(new Date(payment.date), 'MMM dd, yyyy')}</span>
                                    </div>
                                    {payment.engagement_message && (
                                        <div className="info-row message-row">
                                            <span className="label">Engagement Note:</span>
                                            <p className="message-text">{payment.engagement_message}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="payment-actions">
                                    <button className="approve-btn" onClick={() => handleVerification(payment.id, 'approve')}>✓ Approve</button>
                                    <button className="reject-btn" onClick={() => handleVerification(payment.id, 'reject')}>✕ Reject</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default PaymentVerifications
