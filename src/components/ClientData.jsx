import React, { useState, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import { useAuth } from '../context/AuthContext'
import ClientProfile from './ClientProfile'
import ImportClients from './ImportClients'
import '../css/ClientData.css'

import { supabase } from '../supabase'

const ClientData = () => {
  const { user } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState([])
  const [availableUsers, setAvailableUsers] = useState([])
  const [assignToUserId, setAssignToUserId] = useState('')
  const [bulkAssignCount, setBulkAssignCount] = useState('')
  const [isBulkAssigning, setIsBulkAssigning] = useState(false)

  // Admin view toggle: 'engagements' (active) vs 'master' (unassigned pool)
  const [viewMode, setViewMode] = useState('engagements')

  const [selectedClient, setSelectedClient] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    status: 'NI',
    payment: '',
    accountId: '',
    segment: 'Cash',
    state: '',
    fund: '',
    message: ''
  })

  // Filtering, Sorting and Pagination State
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSegment, setFilterSegment] = useState('all')
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (user) {
      loadData()
      if (user.role === 'admin') loadUsers()
    }
  }, [user, viewMode, currentPage, itemsPerPage, filterStatus, filterSegment, sortConfig, searchTerm])

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, role')
        .neq('username', 'admin')
      if (error) throw error
      setAvailableUsers(data)
    } catch (error) {
      console.error('Error loading users:', error.message)
    }
  }


  const loadData = async () => {
    try {
      setLoading(true)
      setSelectedIds([])

      // Calculate range for backend pagination
      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1

      if (viewMode === 'engagements' || user.role !== 'admin') {
        // Load assigned engagements (normal dashboard view)
        let query = supabase
          .from('engagements')
          .select(`
            id, status, message, assignment_date, updated_at, segment, state, fund_amount,
            clients ( id, name, mobile, email ),
            profiles ( id, username )
          `, { count: 'exact' })

        if (user.role !== 'admin') {
          query = query.eq('user_id', user.id)
        }

        // Apply filters before pagination
        if (filterStatus !== 'all') {
          query = query.eq('status', filterStatus)
        }
        if (filterSegment !== 'all') {
          query = query.eq('segment', filterSegment)
        }

        if (searchTerm) {
          query = query.or(`name.ilike.%${searchTerm}%,mobile.ilike.%${searchTerm}%`, { foreignTable: 'clients' })
        }

        // Apply sorting and pagination
        const { data: res, error, count } = await query
          .order(sortConfig.key === 'date' ? 'assignment_date' : sortConfig.key, {
            ascending: sortConfig.direction === 'asc'
          })
          .range(from, to)

        if (error) throw error

        setData(res.map(item => ({
          id: item.id,
          clientId: item.clients.id,
          name: item.clients.name,
          mobile: item.clients.mobile,
          email: item.clients.email || '-',
          date: item.assignment_date,
          status: item.status || 'waiting',
          message: item.message,
          agent: item.profiles?.username || 'System',
          agentId: item.profiles?.id,
          updatedAt: item.updated_at,
          segment: item.segment,
          state: item.state,
          fund_amount: item.fund_amount,
          type: 'engagement',
          totalCount: count
        })))
      } else {
        // Load Master Pool (Unassigned Clients) - Admin only
        let query = supabase
          .from('clients')
          .select('*', { count: 'exact' })
          .eq('is_assigned', false)

        if (searchTerm) {
          query = query.or(`name.ilike.%${searchTerm}%,mobile.ilike.%${searchTerm}%`)
        }

        // Apply sorting and pagination
        const { data: res, error, count } = await query
          .order('created_at', { ascending: sortConfig.direction === 'asc' })
          .range(from, to)

        if (error) throw error

        setData(res.map(item => ({
          id: item.id,
          clientId: item.id,
          name: item.name,
          mobile: item.mobile,
          email: item.email || '-',
          date: item.created_at,
          status: 'unassigned',
          message: '-',
          agent: '-',
          updatedAt: item.updated_at,
          type: 'master',
          totalCount: count
        })))
      }
    } catch (error) {
      console.error('Error loading data:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkAssign = async () => {
    if (!assignToUserId) return alert("Please select a user")
    if (selectedIds.length === 0) return alert("Please select clients")

    try {
      setIsBulkAssigning(true)

      for (const id of selectedIds) {
        const item = data.find(d => d.id === id)
        if (!item) continue;

        // 1. Create Engagement
        const { error: engErr } = await supabase
          .from('engagements')
          .insert([{
            client_id: item.clientId,
            user_id: assignToUserId,
            status: 'waiting',
            message: 'Assigned from Master Pool',
            assignment_date: format(new Date(), 'yyyy-MM-dd')
          }])

        if (engErr) {
          throw new Error(`Assignment failed for ${item.name}: ${engErr.message}`)
        }

        // 2. Mark Client as assigned in Master Pool
        const { error: updErr } = await supabase
          .from('clients')
          .update({ is_assigned: true })
          .eq('id', item.clientId)

        if (updErr) {
          throw new Error(`Database record update failed for ${item.name}: ${updErr.message}`)
        }
      }

      alert(`Successfully assigned ${selectedIds.length} clients.`)
      setViewMode('engagements')
    } catch (error) {
      console.error('Assignment Process Error:', error)
      alert(error.message)
    } finally {
      setIsBulkAssigning(false)
    }
  }

  const handleBulkAssignByCount = async () => {
    if (!assignToUserId) return alert("Please select a user")
    if (!bulkAssignCount || bulkAssignCount <= 0) return alert("Please enter a valid number")

    const count = parseInt(bulkAssignCount)
    if (count > data.length) {
      return alert(`Only ${data.length} unassigned clients available`)
    }

    try {
      setIsBulkAssigning(true)

      // Take top N clients from the current filtered/sorted data
      const clientsToAssign = filteredAndSortedData.slice(0, count)

      for (const item of clientsToAssign) {
        // 1. Create Engagement
        const { error: engErr } = await supabase
          .from('engagements')
          .insert([{
            client_id: item.clientId,
            user_id: assignToUserId,
            status: 'waiting',
            message: 'Bulk assigned from Master Pool',
            assignment_date: format(new Date(), 'yyyy-MM-dd')
          }])

        if (engErr) {
          throw new Error(`Assignment failed for ${item.name}: ${engErr.message}`)
        }

        // 2. Mark Client as assigned in Master Pool
        const { error: updErr } = await supabase
          .from('clients')
          .update({ is_assigned: true })
          .eq('id', item.clientId)

        if (updErr) {
          throw new Error(`Database record update failed for ${item.name}: ${updErr.message}`)
        }
      }

      alert(`Successfully assigned ${count} clients to ${availableUsers.find(u => u.id === assignToUserId)?.username}`)
      setBulkAssignCount('')
      loadData()
    } catch (error) {
      console.error('Bulk Assignment Error:', error)
      alert(error.message)
    } finally {
      setIsBulkAssigning(false)
    }
  }

  const handleAddClient = async (e) => {
    e.preventDefault()
    try {
      // 1. Insert to Master Pool
      const { data: newC, error: insErr } = await supabase
        .from('clients')
        .insert([{
          name: formData.name,
          mobile: formData.mobile,
          email: formData.email,
          is_assigned: user.role !== 'admin' // Auto-assign for regular users
        }])
        .select()
        .single()

      if (insErr) throw insErr

      // 2. Regular users get automatic engagement
      if (user.role !== 'admin') {
        await supabase.from('engagements').insert([{
          client_id: newC.id,
          user_id: user.id,
          status: formData.status,
          message: formData.message,
          assignment_date: formData.date,
          segment: formData.segment,
          state: formData.state,
          fund_amount: parseFloat(formData.fund || 0)
        }])
      }

      // 3. Initial Payment if any
      if (parseFloat(formData.payment) > 0) {
        await supabase.from('payments').insert([{
          client_id: newC.id,
          user_id: user.id,
          amount: parseFloat(formData.payment),
          account_id: formData.accountId,
          status: user.role === 'admin' ? 'verified' : 'pending'
        }])
      }

      setShowAddForm(false)
      loadData()
    } catch (error) {
      alert("Error: " + error.message)
    }
  }

  const handleStatusChange = async (engagementId, newStatus) => {
    try {
      const { error } = await supabase.from('engagements').update({ status: newStatus }).eq('id', engagementId)
      if (error) throw error
      loadData()
    } catch (error) {
      alert('Error updating status: ' + error.message)
    }
  }

  const handleRowClick = (item) => {
    if (item.type === 'engagement') setSelectedClient(item)
  }

  const closeProfile = () => {
    setSelectedClient(null)
    loadData()
  }

  const handleImportSuccess = () => {
    setShowImportModal(false)
    if (user.role === 'admin') setViewMode('master')
    loadData()
  }

  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const processedData = useMemo(() => {
    // Backend now handles filtering, sorting, and pagination
    // Just return data as-is
    return data
  }, [data])

  // Get total count from first item (all items have same totalCount)
  const totalCount = data.length > 0 ? data[0].totalCount : 0
  const totalPages = Math.ceil(totalCount / itemsPerPage)
  const currentItems = data // Backend already returns only current page items

  // For bulk assignment by count, we need all filtered data
  const filteredAndSortedData = data

  return (
    <div className="client-data-container">
      <div className="client-data-header">
        <h2>{viewMode === 'master' ? 'Master Client Pool' : 'Client Assignments'}</h2>
        <div className="header-actions">
          {user?.role === 'admin' && (
            <div className="view-toggle">
              <button
                className={viewMode === 'engagements' ? 'active' : ''}
                onClick={() => setViewMode('engagements')}
              >
                Active Engagements
              </button>
              <button
                className={viewMode === 'master' ? 'active' : ''}
                onClick={() => setViewMode('master')}
              >
                Unassigned Pool ({data.length})
              </button>
            </div>
          )}
          {user?.role === 'admin' && (
            <button className="import-client-button" onClick={() => setShowImportModal(true)}>
              📥 Import Excel
            </button>
          )}
          <button className="add-client-button" onClick={() => setShowAddForm(true)}>
            + Add Client
          </button>
        </div>
      </div>

      {viewMode === 'master' && (
        <div className="bulk-actions-container">
          <div className="assign-controls">
            <div className="assign-row">
              <label>Assign {selectedIds.length} Clients to Agent: </label>
              <select value={assignToUserId} onChange={(e) => setAssignToUserId(e.target.value)}>
                <option value="">Select Target...</option>
                {availableUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.username} ({u.role})</option>
                ))}
              </select>
              <button
                className="bulk-assign-btn"
                onClick={handleBulkAssign}
                disabled={isBulkAssigning || !assignToUserId || selectedIds.length === 0}
              >
                Confirm Assignment
              </button>
            </div>

            <div className="assign-row bulk-count-row">
              <label>Or assign top</label>
              <input
                type="number"
                min="1"
                max={data.length}
                value={bulkAssignCount}
                onChange={(e) => setBulkAssignCount(e.target.value)}
                placeholder="50"
                className="count-input"
              />
              <label>unassigned clients to:</label>
              <select value={assignToUserId} onChange={(e) => setAssignToUserId(e.target.value)}>
                <option value="">Select Target...</option>
                {availableUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.username} ({u.role})</option>
                ))}
              </select>
              <button
                className="bulk-assign-btn"
                onClick={handleBulkAssignByCount}
                disabled={isBulkAssigning || !assignToUserId || !bulkAssignCount}
              >
                Assign Top {bulkAssignCount || 'N'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="filters-toolbar">
        <div className="filter-group">
          <label>Search:</label>
          <input
            type="text"
            placeholder="Name or Mobile..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            style={{ minWidth: '200px' }}
          />
        </div>

        <div className="filter-group">
          <label>Status:</label>
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}>
            <option value="all">All Status</option>
            <option value="busy">Busy</option>
            <option value="NI">NI</option>
            <option value="DND">DND</option>
            <option value="Not_reachable">Not reachable</option>
            <option value="wrong number">Wrong number</option>
            <option value="switch off">Switch off</option>
            <option value="call not received">Call not received</option>
            <option value="waiting">Waiting</option>
            <option value="trader">Trader</option>
            <option value="DEMO_CALL">Demo Call</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Segment:</label>
          <select value={filterSegment} onChange={(e) => { setFilterSegment(e.target.value); setCurrentPage(1); }}>
            <option value="all">All Segments</option>
            <option value="Cash">Cash</option>
            <option value="F&O">F&O</option>
            <option value="Commodity">Commodity</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Sort By Date:</label>
          <select
            value={`${sortConfig.key}-${sortConfig.direction}`}
            onChange={(e) => {
              const [key, direction] = e.target.value.split('-');
              setSortConfig({ key, direction });
            }}
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
          </select>
        </div>
      </div>

      {showImportModal && (
        <ImportClients onClose={() => setShowImportModal(false)} onImportComplete={handleImportSuccess} />
      )}

      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>New Client Entry</h3>
            <form onSubmit={handleAddClient}>
              <div className="form-row">
                <div className="form-group"><label>Name</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
                <div className="form-group"><label>Mobile</label><input type="tel" value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} required /></div>
              </div>
              <div className="form-group"><label>Email</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
              <div className="form-row">
                <div className="form-group">
                  <label>Payment Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.payment}
                    onChange={(e) => setFormData({ ...formData, payment: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group">
                  <label>Account ID / Ref</label>
                  <input
                    type="text"
                    value={formData.accountId}
                    onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                    placeholder="Enter Reference"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Initial Fund (₹)</label>
                  <input type="number" value={formData.fund} onChange={(e) => setFormData({ ...formData, fund: e.target.value })} placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label>Segment</label>
                  <select value={formData.segment} onChange={(e) => setFormData({ ...formData, segment: e.target.value })}>
                    <option value="Cash">Cash</option>
                    <option value="F&O">F&O</option>
                    <option value="Commodity">Commodity</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>State</label>
                <input type="text" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} placeholder="e.g. Gujarat" />
              </div>
              <div className="form-group">
                <label>Engagement Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                  <option value="busy">Busy</option>
                  <option value="NI">NI</option>
                  <option value="DND">DND</option>
                  <option value="Not_reachable">Not reachable</option>
                  <option value="wrong number">Wrong number</option>
                  <option value="switch off">Switch off</option>
                  <option value="call not received">Call not received</option>
                  <option value="trader">Trader</option>
                  <option value="DEMO_CALL">Demo Call</option>
                </select>
              </div>
              <div className="form-group">
                <label>Notes / Message</label>
                <textarea value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} rows="3" placeholder="Additional notes..." />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowAddForm(false)}>Cancel</button>
                <button type="submit">Create Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="client-table-wrapper">
        <table className="client-table">
          <thead>
            <tr>
              {viewMode === 'master' && <th>Select</th>}
              <th>SL</th>
              <th>Name</th>
              <th>Mobile</th>
              <th onClick={() => handleSort('email')} className="sortable-header">
                Email {sortConfig.key === 'email' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              {viewMode === 'engagements' ? (
                <>
                  <th onClick={() => handleSort('status')} className="sortable-header">
                    Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('segment')} className="sortable-header">
                    Segment {sortConfig.key === 'segment' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('fund_amount')} className="sortable-header">
                    Fund {sortConfig.key === 'fund_amount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                </>
              ) : (
                <th onClick={() => handleSort('date')} className="sortable-header">
                  Created Date {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="loading">Fetching data...</td></tr>
            ) : currentItems.length === 0 ? (
              <tr><td colSpan="8" className="no-data">No records found.</td></tr>
            ) : (
              currentItems.map((item, index) => (
                <tr key={item.id} onClick={() => handleRowClick(item)} className="client-row">
                  {viewMode === 'master' && (
                    <td onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => {
                        setSelectedIds(prev => prev.includes(item.id) ? prev.filter(i => i !== item.id) : [...prev, item.id])
                      }} />
                    </td>
                  )}
                  <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td>{item.name}</td>
                  <td>{item.mobile}</td>
                  <td>{item.email}</td>
                  {viewMode === 'engagements' ? (
                    <>
                      <td onClick={(e) => e.stopPropagation()}>
                        <select
                          className={`status-select status-${item.status?.replace(' ', '-')}`}
                          value={item.status}
                          onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        >
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
                          <option value="DEMO_CALL">Demo Call</option>
                        </select>
                      </td>
                      <td><span className="segment-badge">{item.segment || 'Cash'}</span></td>
                      <td className="fund-cell">₹{parseFloat(item.fund_amount || 0).toLocaleString()}</td>
                    </>
                  ) : (
                    <td>
                      {item.date ? (
                        (() => {
                          try { return format(new Date(item.date), 'MMM dd, yyyy') }
                          catch (e) { return '-' }
                        })()
                      ) : '-'}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="pagination-footer">
        <div className="pagination-info">
          Showing <span>{(currentPage - 1) * itemsPerPage + 1}</span> to <span>{Math.min(currentPage * itemsPerPage, totalCount)}</span> of <span>{totalCount}</span> clients
        </div>

        <div className="pagination-controls">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="pag-btn"
          >
            Previous
          </button>

          <div className="page-numbers">
            Page <strong>{currentPage}</strong> of <strong>{totalPages || 1}</strong>
          </div>

          <button
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="pag-btn"
          >
            Next
          </button>

          <div className="page-size-selector">
            <label>Show:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(parseInt(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {selectedClient && <ClientProfile client={selectedClient} onClose={closeProfile} />}
    </div>
  )
}

export default ClientData
