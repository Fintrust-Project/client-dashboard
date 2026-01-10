import React, { useState, useEffect, useRef } from 'react'
import { format, differenceInDays } from 'date-fns'
import { supabase } from '../supabase'
import '../css/PaymentVerifications.css'

const PaymentVerifications = () => {
    const [activeTab, setActiveTab] = useState('pending') // 'pending' or 'verified'
    const [payments, setPayments] = useState([])
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(10)
    const [totalCount, setTotalCount] = useState(0)

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
    }, [activeTab, currentPage])

    useEffect(() => {
        if (activeTab === 'pending') {
            setCurrentPage(1)
        }
    }, [activeTab])

    // Effect for printing when data is ready
    useEffect(() => {
        if (printableReceiptData) {
            const originalTitle = document.title;
            document.title = `Receipt_${printableReceiptData.clients?.name || 'Client'}_${format(new Date(), 'yyyyMMdd')}`;

            // Wait longer for DOM to be ready and styles to apply
            const timer = setTimeout(() => {
                window.print();

                // Cleanup after dialog closes
                const cleanupTimer = setTimeout(() => {
                    setPrintableReceiptData(null);
                    document.title = originalTitle;
                }, 3000);

                return () => clearTimeout(cleanupTimer);
            }, 1500);

            return () => {
                clearTimeout(timer);
                document.title = originalTitle;
            }
        }
    }, [printableReceiptData])

    const loadData = async () => {
        try {
            setLoading(true)

            const from = (currentPage - 1) * itemsPerPage
            const to = from + itemsPerPage - 1

            // Base query with relationships
            let query = supabase
                .from('payments')
                .select(`
                    id, amount, date, user_id, client_id, account_id,
                    clients ( name, mobile, email ),
                    profiles ( username )
                `, { count: 'exact' })
                .order('created_at', { ascending: false })

            if (activeTab === 'pending') {
                query = query.eq('status', 'pending')
            } else {
                query = query.eq('status', 'verified')
            }

            const { data: rawPayments, error: payErr, count } = await query.range(from, to)
            if (payErr) throw payErr

            setTotalCount(count || 0)

            // 2. Fetch splits for these payments
            const paymentIds = rawPayments.map(p => p.id)
            let allSplits = []
            if (paymentIds.length > 0) {
                const { data: splitData } = await supabase
                    .from('payment_splits')
                    .select(`*, profiles ( username )`)
                    .in('payment_id', paymentIds)
                allSplits = splitData || []
            }

            // 3. Enrich with Engagement info and Splits
            const enrichedPayments = await Promise.all(rawPayments.map(async (p) => {
                const { data: eng } = await supabase
                    .from('engagements')
                    .select('status, message')
                    .eq('client_id', p.client_id)
                    .eq('user_id', p.user_id)
                    .maybeSingle()

                const pSplits = allSplits.filter(s => s.payment_id === p.id)

                return {
                    ...p,
                    engagement_status: eng?.status || 'waiting',
                    engagement_message: eng?.message || '-',
                    splits: pSplits
                }
            }))

            setPayments(enrichedPayments)
        } catch (error) {
            console.error('Error loading payments:', error.message)
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
        const totalAmount = parseFloat(selectedPayment.amount)
        const taxableValue = totalAmount / 1.18
        const gstValue = totalAmount - taxableValue

        const dataToPrint = {
            ...selectedPayment,
            ...receiptForm,
            taxableValue,
            gstValue,
            totalAmount: totalAmount
        }

        setPrintableReceiptData(dataToPrint)
        setShowReceiptModal(false)
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
                    <div className="no-verifications" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                        <p>No {activeTab} payments found.</p>
                    </div>
                ) : (
                    <>
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
                                        {payment.splits && payment.splits.length > 0 && (
                                            <div className="payment-splits-info">
                                                <div className="splits-title">Comission Distribution</div>
                                                {payment.splits.map((s, idx) => (
                                                    <div key={idx} className="split-row">
                                                        <span className="split-agent">@{s.profiles?.username}</span>
                                                        <span className="split-value">{s.percentage}% (₹{parseFloat(s.amount).toFixed(2)})</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
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

                        {/* Pagination Footer */}
                        <div className="pagination-footer" style={{ marginTop: '2rem', padding: '1rem', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className="pagination-info" style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                Showing <span>{(currentPage - 1) * itemsPerPage + 1}</span> to <span>{Math.min(currentPage * itemsPerPage, totalCount)}</span> of <span>{totalCount}</span> entries
                            </div>

                            <div className="pagination-controls" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <button
                                    disabled={currentPage === 1 || loading}
                                    onClick={() => setCurrentPage(prev => prev - 1)}
                                    style={{ padding: '0.5rem 1rem', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
                                >
                                    Previous
                                </button>

                                <div className="page-numbers" style={{ fontWeight: '600', color: '#1e293b' }}>
                                    Page {currentPage} of {Math.ceil(totalCount / itemsPerPage) || 1}
                                </div>

                                <button
                                    disabled={currentPage >= Math.ceil(totalCount / itemsPerPage) || loading}
                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                    style={{ padding: '0.5rem 1rem', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: currentPage >= Math.ceil(totalCount / itemsPerPage) ? 'not-allowed' : 'pointer', opacity: currentPage >= Math.ceil(totalCount / itemsPerPage) ? 0.5 : 1 }}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </>
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
                <div id="printable-receipt" data-print-target="true">
                    <div className="receipt-layout">
                        <div className="receipt-header">
                            <h1>INDIA INVEST KARO</h1>
                            <p className="tagline">Empowering Your Financial Growth</p>
                            <div className="receipt-title-box">
                                <h2>PAYMENT RECEIPT</h2>
                            </div>
                        </div>

                        <div className="receipt-body">
                            <div className="receipt-grid">
                                <div className="receipt-row">
                                    <span className="receipt-label">Receipt Date:</span>
                                    <span className="receipt-value">{format(new Date(), 'dd MMMM yyyy')}</span>
                                </div>
                                <div className="receipt-row">
                                    <span className="receipt-label">Client Name:</span>
                                    <span className="receipt-value">{printableReceiptData.clients?.name || 'N/A'}</span>
                                </div>
                                <div className="receipt-row">
                                    <span className="receipt-label">Mobile Number:</span>
                                    <span className="receipt-value">{printableReceiptData.clients?.mobile || 'N/A'}</span>
                                </div>
                                <div className="receipt-row">
                                    <span className="receipt-label">Payment Date:</span>
                                    <span className="receipt-value">
                                        {printableReceiptData.date ? format(new Date(printableReceiptData.date), 'dd MMM yyyy') : 'N/A'}
                                    </span>
                                </div>
                                <div className="receipt-row">
                                    <span className="receipt-label">Service Segment:</span>
                                    <span className="receipt-value">{printableReceiptData.segment || 'N/A'}</span>
                                </div>
                                <div className="receipt-row">
                                    <span className="receipt-label">Service Period:</span>
                                    <span className="receipt-value">
                                        {printableReceiptData.startDate ? format(new Date(printableReceiptData.startDate), 'dd MMM yyyy') : ''}
                                        {' TO '}
                                        {printableReceiptData.endDate ? format(new Date(printableReceiptData.endDate), 'dd MMM yyyy') : ''}
                                    </span>
                                </div>
                                <div className="receipt-row">
                                    <span className="receipt-label">Handled By (Agent):</span>
                                    <span className="receipt-value">{printableReceiptData.profiles?.username || 'System'}</span>
                                </div>
                            </div>
                        </div>

                        <table className="receipt-table">
                            <thead>
                                <tr>
                                    <th>Description / Particulars</th>
                                    <th className="amount-right">Amount (INR)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>
                                        <strong>Consultancy Services</strong><br />
                                        <small>Segment: {printableReceiptData.segment}</small>
                                    </td>
                                    <td className="amount-right">₹{(printableReceiptData.taxableValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                                <tr>
                                    <td className="tax-label">Integrated GST (IGST) @ 18% (Included)</td>
                                    <td className="amount-right">₹{(printableReceiptData.gstValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                                <tr className="total-row">
                                    <td>TOTAL NET AMOUNT RECEIVED</td>
                                    <td className="amount-right">₹{(printableReceiptData.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                            </tbody>
                        </table>

                        <div className="receipt-footer">
                            <p className="thank-you">Thank you for choosing India Invest Karo!</p>
                            <p className="computer-gen">This is a computer-generated receipt and does not require a physical signature.</p>
                            <p className="website">www.indiainvestkaro.com</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default PaymentVerifications
