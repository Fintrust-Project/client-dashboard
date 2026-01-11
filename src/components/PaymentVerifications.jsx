import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { format, differenceInDays } from 'date-fns'
import { supabase } from '../supabase'
import logo from '../assets/logo.png'
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
            // Use the flat property clientName we mapped in handleGenerateReceipt
            document.title = `Receipt_${printableReceiptData.clientName || 'Client'}_${format(new Date(), 'yyyyMMdd')}`;

            // Wait for DOM to catch up
            const timer = setTimeout(() => {
                window.print();

                // Cleanup after dialog closes
                const cleanupTimer = setTimeout(() => {
                    setPrintableReceiptData(null);
                    document.title = originalTitle;
                }, 3000);

                return () => clearTimeout(cleanupTimer);
            }, 2000); // Increased wait to 2 seconds for slower systems

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
        e.preventDefault();

        if (!selectedPayment) return;

        const amount = parseFloat(selectedPayment.amount || 0);
        const taxable = amount / 1.18;
        const gst = amount - taxable;

        const dataToPrint = {
            receiptDate: format(new Date(), 'dd MMMM yyyy'),
            clientName: selectedPayment.clients?.name || 'N/A',
            clientMobile: selectedPayment.clients?.mobile || 'N/A',
            paymentDate: selectedPayment.date ? format(new Date(selectedPayment.date), 'dd MMM yyyy') : 'N/A',
            segment: receiptForm.segment,
            servicePeriod: `${format(new Date(receiptForm.startDate), 'dd MMM yyyy')} TO ${format(new Date(receiptForm.endDate), 'dd MMM yyyy')}`,
            agentName: selectedPayment.profiles?.username || 'Admin',
            grossAmount: taxable,
            gstAmount: gst,
            totalAmount: amount
        };

        openPrintWindow(dataToPrint);
        setShowReceiptModal(false);
    };

    // Opens a new window with receipt HTML and triggers print
    const openPrintWindow = (data) => {
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) {
            console.error('Failed to open print window');
            return;
        }
        const style = `<style>
            body { font-family: 'Inter', sans-serif; margin:0; padding:20px; background:#fff; color:#000; }
            .receipt-layout { max-width:800px; margin:auto; border:2px solid #000; padding:40px; }
            .receipt-header { text-align:center; border-bottom:2px solid #000; padding-bottom:20px; margin-bottom:30px; }
            .receipt-header h1 { font-size:2.5rem; margin:0; }
            .tagline { color:#64748b; font-style:italic; margin-top:5px; }
            .receipt-title-box { margin-top:20px; background:#f1f5f9; padding:10px; }
            .receipt-title-box h2 { margin:0; font-size:1.25rem; text-decoration:underline; }
            .receipt-grid { display:grid; grid-template-columns:1fr 1fr; gap:15px; }
            .receipt-row { display:flex; justify-content:space-between; padding:8px 15px; border-bottom:1px solid #f1f5f9; }
            .receipt-label { font-weight:700; color:#475569; font-size:0.9rem; }
            .receipt-value { color:#1e293b; font-weight:500; }
            .receipt-table { width:100%; border-collapse:collapse; margin:30px 0; }
            .receipt-table th { background:#1e293b; color:white; padding:12px; text-align:left; text-transform:uppercase; font-size:0.85rem; }
            .receipt-table td { border:1px solid #e2e8f0; padding:15px; vertical-align:top; }
            .amount-right { text-align:right; font-family:'Roboto Mono',monospace; font-weight:600; }
            .tax-label { color:#64748b; font-size:0.85rem; }
            .total-row { background:#f8fafc; font-weight:800; font-size:1.1rem; }
            .receipt-footer { text-align:center; margin-top:50px; padding-top:20px; border-top:1px dashed #cbd5e1; }
            .thank-you { font-weight:700; font-size:1.1rem; color:#1e293b; margin-bottom:10px; }
            .computer-gen { font-size:0.8rem; color:#94a3b8; font-style:italic; }
            .website { font-weight:600; color:#3b82f6; margin-top:10px; }
            .receipt-watermark {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-30deg);
                opacity: 0.08;
                width: 70%;
                pointer-events: none;
                z-index: 0;
            }
            .receipt-watermark img { width: 100%; height: auto; }
            .receipt-layout { position: relative; overflow: hidden; }
        </style>`;
        const html = `<!DOCTYPE html>
<html>
<head>
<title>Payment Receipt</title>
${style}
</head>
<body>
<div class="receipt-layout">
    <div class="receipt-watermark">
        <img src="/india-invest-karo-logo.png" alt="Watermark" />
    </div>
    <div class="receipt-header">
        <img src="/india-invest-karo-logo.png" alt="Logo" style="height: 80px; margin-bottom: 15px;" />
        <h1>INDIA INVEST KARO</h1>
        <p class="tagline">Empowering Your Financial Growth</p>
        <div class="receipt-title-box"><h2>PAYMENT RECEIPT</h2></div>
    </div>
    <div class="receipt-body">
        <div class="receipt-grid">
            <div class="receipt-row"><span class="receipt-label">Receipt Date:</span><span class="receipt-value">${data.receiptDate}</span></div>
            <div class="receipt-row"><span class="receipt-label">Client Name:</span><span class="receipt-value">${data.clientName}</span></div>
            <div class="receipt-row"><span class="receipt-label">Mobile Number:</span><span class="receipt-value">${data.clientMobile}</span></div>
            <div class="receipt-row"><span class="receipt-label">Payment Date:</span><span class="receipt-value">${data.paymentDate}</span></div>
            <div class="receipt-row"><span class="receipt-label">Service Segment:</span><span class="receipt-value">${data.segment}</span></div>
            <div class="receipt-row"><span class="receipt-label">Service Period:</span><span class="receipt-value">${data.servicePeriod}</span></div>
            <div class="receipt-row"><span class="receipt-label">Handled By:</span><span class="receipt-value">${data.agentName}</span></div>
        </div>
    </div>
    <table class="receipt-table">
        <thead>
            <tr><th>Description / Particulars</th><th class="amount-right">Amount (INR)</th></tr>
        </thead>
        <tbody>
            <tr><td><strong>Consultancy Services</strong><br/><small>Segment: ${data.segment}</small></td><td class="amount-right">₹${data.grossAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
            <tr><td class="tax-label">Integrated GST (IGST) @ 18% (Included)</td><td class="amount-right">₹${data.gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
            <tr class="total-row"><td>TOTAL NET AMOUNT RECEIVED</td><td class="amount-right">₹${data.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
        </tbody>
    </table>
    <div class="receipt-footer">
        <p class="thank-you">Thank you for choosing India Invest Karo!</p>
        <p class="computer-gen">This is a computer-generated receipt and does not require a physical signature.</p>
        <p class="website">www.indiainvestkaro.com</p>
    </div>
</div>
</body>
</html>`;
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
        }, 500);
    };

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

            {/* Printable Receipt Area rendered via Portal to Body (for reliable printing) */}
            {printableReceiptData && createPortal(
                <div id="printable-receipt" data-print-target="true" style={{ display: 'block', visibility: 'visible' }}>
                    <div className="receipt-layout">
                        {/* Watermark Logo */}
                        <div className="receipt-watermark">
                            <img src="/india-invest-karo-logo.png" alt="Watermark" />
                        </div>
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
                                    <span className="receipt-value">{printableReceiptData.receiptDate}</span>
                                </div>
                                <div className="receipt-row">
                                    <span className="receipt-label">Client Name:</span>
                                    <span className="receipt-value">{printableReceiptData.clientName}</span>
                                </div>
                                <div className="receipt-row">
                                    <span className="receipt-label">Mobile Number:</span>
                                    <span className="receipt-value">{printableReceiptData.clientMobile}</span>
                                </div>
                                <div className="receipt-row">
                                    <span className="receipt-label">Payment Date:</span>
                                    <span className="receipt-value">{printableReceiptData.paymentDate}</span>
                                </div>
                                <div className="receipt-row">
                                    <span className="receipt-label">Service Segment:</span>
                                    <span className="receipt-value">{printableReceiptData.segment}</span>
                                </div>
                                <div className="receipt-row">
                                    <span className="receipt-label">Service Period:</span>
                                    <span className="receipt-value">{printableReceiptData.servicePeriod}</span>
                                </div>
                                <div className="receipt-row">
                                    <span className="receipt-label">Handled By:</span>
                                    <span className="receipt-value">{printableReceiptData.agentName}</span>
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
                                    <td className="amount-right">₹{printableReceiptData.grossAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                                <tr>
                                    <td className="tax-label">Integrated GST (IGST) @ 18% (Included)</td>
                                    <td className="amount-right">₹{printableReceiptData.gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                                <tr className="total-row">
                                    <td>TOTAL NET AMOUNT RECEIVED</td>
                                    <td className="amount-right">₹{printableReceiptData.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                            </tbody>
                        </table>

                        <div className="receipt-footer">
                            <p className="thank-you">Thank you for choosing India Invest Karo!</p>
                            <p className="computer-gen">This is a computer-generated receipt and does not require a physical signature.</p>
                            <p className="website">www.indiainvestkaro.com</p>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}

export default PaymentVerifications
