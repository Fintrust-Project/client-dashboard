import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useAuth } from '../context/AuthContext'
import '../css/ClientProfile.css'
import { supabase } from '../supabase'

const ClientProfile = ({ client, onClose }) => {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [editFormData, setEditFormData] = useState({})
  const [paymentHistory, setPaymentHistory] = useState([])
  const [paymentSplits, setPaymentSplits] = useState([]) // For calculating shares
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [newPayment, setNewPayment] = useState({
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    accountId: ''
  })
  const [splits, setSplits] = useState([]) // { user_id, username, percentage }
  const [availableUsers, setAvailableUsers] = useState([])
  const [showSplitUI, setShowSplitUI] = useState(false)

  useEffect(() => {
    fetchPaymentHistory()
    fetchAvailableUsers()
  }, [client.clientId])

  const fetchPaymentHistory = async () => {
    try {
      setLoadingHistory(true)
      const { data: payments, error: expErr } = await supabase
        .from('payments')
        .select('*')
        .eq('client_id', client.clientId)
        .order('date', { ascending: false })

      if (expErr) throw expErr
      setPaymentHistory(payments)

      // Fetch splits for these payments
      const pIds = payments.map(p => p.id)
      if (pIds.length > 0) {
        const { data: splitsData, error: splitErr } = await supabase
          .from('payment_splits')
          .select('*')
          .in('payment_id', pIds)
        if (splitErr) throw splitErr
        setPaymentSplits(splitsData || [])
      }
    } catch (error) {
      console.error('Error fetching history:', error.message)
    } finally {
      setLoadingHistory(false)
    }
  }

  const fetchAvailableUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, role')
        .order('username')

      if (error) throw error
      setAvailableUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleAddPayment = async (e) => {
    e.preventDefault()

    // Validate splits if enabled
    if (showSplitUI && splits.length > 0) {
      const totalPercentage = splits.reduce((sum, s) => sum + parseFloat(s.percentage || 0), 0)
      if (totalPercentage > 100) {
        alert('Total split percentage cannot exceed 100%')
        return
      }
    }

    try {
      // 1. Insert the main payment
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .insert([{
          client_id: client.clientId,
          user_id: user.id,
          amount: parseFloat(newPayment.amount),
          date: newPayment.date,
          account_id: newPayment.accountId,
          status: user.role === 'admin' ? 'verified' : 'pending'
        }])
        .select()

      if (paymentError) throw paymentError
      const paymentId = paymentData[0].id

      // 2. Insert splits if any
      if (showSplitUI && splits.length > 0) {
        const totalAmount = parseFloat(newPayment.amount)
        const splitRecords = splits.map(split => ({
          payment_id: paymentId,
          user_id: split.user_id,
          percentage: parseFloat(split.percentage),
          amount: (totalAmount * parseFloat(split.percentage)) / 100
        }))

        const { error: splitError } = await supabase
          .from('payment_splits')
          .insert(splitRecords)

        if (splitError) throw splitError
      }

      setNewPayment({ amount: '', date: format(new Date(), 'yyyy-MM-dd'), accountId: '' })
      setSplits([])
      setShowSplitUI(false)
      fetchPaymentHistory()

      if (user.role !== 'admin') {
        alert('Payment request sent for admin approval.')
      } else {
        alert('Payment added and verified.')
      }
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  const addSplit = () => {
    setSplits([...splits, { user_id: '', username: '', percentage: '' }])
  }

  const removeSplit = (index) => {
    setSplits(splits.filter((_, i) => i !== index))
  }

  const updateSplit = (index, field, value) => {
    const updated = [...splits]
    if (field === 'user_id') {
      const selectedUser = availableUsers.find(u => u.id === value)
      updated[index] = { ...updated[index], user_id: value, username: selectedUser?.username || '' }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    setSplits(updated)
  }

  const getRemainingPercentage = () => {
    const total = splits.reduce((sum, s) => sum + parseFloat(s.percentage || 0), 0)
    return Math.max(0, 100 - total)
  }

  const handleEditToggle = () => {
    setEditFormData({
      name: client.name,
      mobile: client.mobile,
      email: client.email || '',
      date: client.date,
      status: client.status,
      message: client.message,
      segment: client.segment || 'Cash',
      state: client.state || '',
      fund_amount: client.fund_amount || 0
    })
    setIsEditing(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    try {
      // 1. Update Master Client if needed (Name/Email)
      const { error: clientErr } = await supabase
        .from('clients')
        .update({
          name: editFormData.name,
          email: editFormData.email
        })
        .eq('id', client.clientId)

      if (clientErr) throw clientErr

      // 2. Update Engagement (Status/Message)
      const { error: engErr } = await supabase
        .from('engagements')
        .update({
          status: editFormData.status,
          message: editFormData.message,
          assignment_date: editFormData.date,
          segment: editFormData.segment,
          state: editFormData.state,
          fund_amount: parseFloat(editFormData.fund_amount || 0)
        })
        .eq('id', client.id)

      if (engErr) throw engErr

      setIsEditing(false)
      onClose()
    } catch (error) {
      alert('Error updating: ' + error.message)
    }
  }

  const displayTotalCollection = paymentHistory.reduce((sum, p) => {
    if (p.status !== 'verified') return sum
    return sum + parseFloat(p.amount || 0)
  }, 0)

  const userTotalShare = paymentHistory.reduce((sum, p) => {
    if (p.status !== 'verified') return sum
    const pSplits = paymentSplits.filter(s => s.payment_id === p.id)
    const userSplit = pSplits.find(s => s.user_id === user.id)
    if (userSplit) return sum + parseFloat(userSplit.amount)
    if (p.user_id === user.id) {
      const totalSplitAmount = pSplits.reduce((acc, s) => acc + parseFloat(s.amount), 0)
      return sum + (parseFloat(p.amount) - totalSplitAmount)
    }
    return sum
  }, 0)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="client-profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-header">
          <h2>{isEditing ? 'Edit Engagement' : 'Client Profile'}</h2>
          <div className="header-buttons">
            {!isEditing && (
              <button className="edit-btn" onClick={handleEditToggle}>Update Engagement</button>
            )}
            <button className="close-button" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="profile-content">
          {isEditing ? (
            <form onSubmit={handleEditSubmit} className="edit-client-form">
              <div className="form-group">
                <label>Name</label>
                <input type="text" value={editFormData.name} onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={editFormData.email} onChange={e => setEditFormData({ ...editFormData, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Mobile (Read-only)</label>
                <input type="text" value={editFormData.mobile} disabled className="disabled-input" />
              </div>
              <div className="form-group">
                <label>Assignment Date</label>
                <input type="date" value={editFormData.date} onChange={e => setEditFormData({ ...editFormData, date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Segment</label>
                <select value={editFormData.segment} onChange={e => setEditFormData({ ...editFormData, segment: e.target.value })}>
                  <option value="Cash">Cash</option>
                  <option value="F&O">F&O</option>
                  <option value="Commodity">Commodity</option>
                </select>
              </div>
              <div className="form-group">
                <label>State</label>
                <input type="text" value={editFormData.state} onChange={e => setEditFormData({ ...editFormData, state: e.target.value })} placeholder="e.g. Maharashtra" />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={editFormData.status} onChange={e => setEditFormData({ ...editFormData, status: e.target.value })}>
                  <option value="busy">Busy</option>
                  <option value="NI">NI</option>
                  <option value="DND">DND</option>
                  <option value="Not_reachable">Not reachable</option>
                  <option value="wrong number">Wrong number</option>
                  <option value="switch off">Switch off</option>
                  <option value="call not received">Call not received</option>
                  <option value="waiting">Waiting</option>
                  <option value="trader">Trader</option>
                  <option value="not-trader">Not Trader</option>
                </select>
              </div>
              <div className="form-group">
                <label>Fund/Amount (₹)</label>
                <input type="number" value={editFormData.fund_amount} onChange={e => setEditFormData({ ...editFormData, fund_amount: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Notes / Message</label>
                <textarea value={editFormData.message} onChange={e => setEditFormData({ ...editFormData, message: e.target.value })} rows="3" />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
                <button type="submit">Save Changes</button>
              </div>
            </form>
          ) : (
            <div className="profile-section">
              <h3>Engagement Details</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Name:</label>
                  <span>{client.name}</span>
                </div>
                <div className="info-item">
                  <label>Email:</label>
                  <span>{client.email}</span>
                </div>
                <div className="info-item">
                  <label>Mobile:</label>
                  <span>{client.mobile}</span>
                </div>
                <div className="info-item">
                  <label>Assigned Date:</label>
                  <span>{format(new Date(client.date), 'MMMM dd, yyyy')}</span>
                </div>
                <div className="info-item">
                  <label>Current Status:</label>
                  <span className={`status-badge status-${client.status?.replace(' ', '-')}`}>
                    {client.status}
                  </span>
                </div>
                <div className="info-item">
                  <label>Segment:</label>
                  <span>{client.segment || 'Cash'}</span>
                </div>
                <div className="info-item">
                  <label>State:</label>
                  <span>{client.state || 'Not Set'}</span>
                </div>
                <div className="info-item">
                  <label>Fund/Amount:</label>
                  <span>₹{parseFloat(client.fund_amount || 0).toLocaleString()}</span>
                </div>
                <div className="info-item full-width">
                  <label>Your Message/Notes:</label>
                  <span>{client.message || 'No message'}</span>
                </div>
              </div>
            </div>
          )}

          <div className="profile-section">
            <h3>Payment History (Collection: ₹{displayTotalCollection.toLocaleString()} | Your Share: ₹{userTotalShare.toLocaleString()})</h3>
            {loadingHistory ? (
              <p>Loading payments...</p>
            ) : paymentHistory.length > 0 ? (
              <div className="payment-list">
                {paymentHistory.map((payment) => (
                  <div key={payment.id} className="payment-item">
                    <div className="payment-date">
                      {payment.date ? (
                        (() => {
                          try { return format(new Date(payment.date), 'MMM dd, yyyy') }
                          catch (e) { return '-' }
                        })()
                      ) : '-'}
                    </div>
                    <div className="payment-amount">
                      ₹{parseFloat(payment.amount).toFixed(2)}
                      {payment.status === 'pending' && <span className="payment-status pending"> (Waiting Admin)</span>}
                      {payment.status === 'rejected' && <span className="payment-status rejected"> (Rejected)</span>}
                      {payment.status === 'verified' && <span className="payment-status verified"> (Approved)</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-payments">No payments recorded</p>
            )}

            <form onSubmit={handleAddPayment} className="add-payment-form">
              <h4>Request New Payment</h4>
              <div className="payment-form-row">
                <div className="form-group">
                  <input type="number" step="0.01" value={newPayment.amount} onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })} required placeholder="Amount ₹" />
                </div>
                <div className="form-group">
                  <input type="text" value={newPayment.accountId} onChange={(e) => setNewPayment({ ...newPayment, accountId: e.target.value })} required placeholder="Account ID / Reference" />
                </div>
                <div className="form-group">
                  <input type="date" value={newPayment.date} onChange={(e) => setNewPayment({ ...newPayment, date: e.target.value })} required />
                </div>
              </div>

              {parseFloat(newPayment.amount) > 0 && (
                <div className="payment-net-share-summary" style={{ marginBottom: '1rem', padding: '0.8rem', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #10b981', color: '#065f46', fontSize: '0.95rem', fontWeight: '600', textAlign: 'center' }}>
                  Your Net Share (after {getRemainingPercentage().toFixed(1)}% split & 18% GST):
                  <span style={{ marginLeft: '8px', fontSize: '1.1rem', color: '#059669' }}>
                    ₹{((parseFloat(newPayment.amount) * getRemainingPercentage() / 100) * 0.82).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {/* Split Commission Toggle */}
              <div className="split-toggle-section">
                <label className="split-checkbox">
                  <input
                    type="checkbox"
                    checked={showSplitUI}
                    onChange={(e) => {
                      setShowSplitUI(e.target.checked)
                      if (!e.target.checked) setSplits([])
                    }}
                  />
                  <span>Split commission with other team members</span>
                </label>
              </div>

              {/* Splits UI */}
              {showSplitUI && (
                <div className="splits-container">
                  <div className="splits-header">
                    <h5>Commission Distribution</h5>
                    <span className="remaining-percentage">
                      Remaining for you: {getRemainingPercentage().toFixed(1)}%
                      {parseFloat(newPayment.amount) > 0 && (
                        <strong style={{ marginLeft: '10px', color: '#10b981' }}>
                          (Est. Share: ₹{((parseFloat(newPayment.amount) * getRemainingPercentage() / 100) * 0.82).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                        </strong>
                      )}
                    </span>
                  </div>

                  {splits.map((split, index) => (
                    <div key={index} className="split-row">
                      <select
                        value={split.user_id}
                        onChange={(e) => updateSplit(index, 'user_id', e.target.value)}
                        required
                        className="split-user-select"
                      >
                        <option value="">Select User...</option>
                        {availableUsers
                          .filter(u => u.id !== user.id) // Don't show self
                          .map(u => (
                            <option key={u.id} value={u.id}>
                              {u.username} ({u.role})
                            </option>
                          ))
                        }
                      </select>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={split.percentage}
                        onChange={(e) => updateSplit(index, 'percentage', e.target.value)}
                        placeholder="%"
                        required
                        className="split-percentage-input"
                      />
                      <button
                        type="button"
                        onClick={() => removeSplit(index)}
                        className="remove-split-btn"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  <button type="button" onClick={addSplit} className="add-split-btn">
                    + Add Split
                  </button>
                </div>
              )}

              <button type="submit" className="add-payment-button">Add Payment</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClientProfile

