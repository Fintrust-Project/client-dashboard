import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '../supabase'
import '../css/UserManagement.css'

const UserManagement = () => {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [managers, setManagers] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [totalCount, setTotalCount] = useState(0)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'user',
    managerId: ''
  })
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    loadUsers()
    loadManagers() // Managers list needed for dropdowns
  }, [currentPage])

  const loadManagers = async () => {
    try {
      const { data } = await supabase.from('profiles').select('id, username').eq('role', 'manager')
      setManagers(data || [])
    } catch (err) { }
  }

  const loadUsers = async () => {
    try {
      setLoading(true)
      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1

      // Fetch profiles with pagination
      const { data: profiles, error, count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .neq('username', 'admin123@gmail.com')
        .order('username', { ascending: true })
        .range(from, to)

      if (error) throw error

      setTotalCount(count || 0)

      // Fetch all managers to resolve names
      const { data: allManagers } = await supabase.from('profiles').select('id, username').eq('role', 'manager')

      const enrichedUsers = profiles.map(u => {
        let managerName = '-'
        if (u.manager_id) {
          const m = allManagers?.find(p => p.id === u.manager_id)
          managerName = m?.username || 'Unknown'
        }
        return { ...u, managerName }
      })

      setUsers(enrichedUsers)
    } catch (error) {
      console.error('Error loading users:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitUser = async (e) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })

    if (isEditing) {
      try {
        const updates = {
          role: formData.role,
          manager_id: (formData.role === 'user' || formData.role === 'manager') && formData.managerId ? formData.managerId : null
        }

        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', editingId)

        if (error) throw error

        setMessage({ type: 'success', text: 'User updated successfully!' })
        loadUsers()
        setTimeout(() => handleCloseModal(), 1500)
      } catch (error) {
        setMessage({ type: 'error', text: error.message })
      }
    } else {
      // ADD NEW USER LOGIC (Using RPC)
      if (!formData.email || !formData.password) {
        setMessage({ type: 'error', text: 'Email and Password are required' })
        return
      }

      try {
        console.log("Creating user via RPC:", formData.email)

        // Call the Secure Server Function (RPC)
        const { data, error } = await supabase.rpc('create_user_rpc', {
          email: formData.email.trim(),
          password: formData.password.trim(),
          role_name: formData.role,
          manager_id: (formData.role === 'user' || formData.role === 'manager') && formData.managerId ? formData.managerId : null
        })

        if (error) throw error

        // The RPC returns { error: ... } in JSON if it catches an exception
        if (data && data.error) {
          throw new Error(data.error)
        }

        setMessage({ type: 'success', text: 'User created successfully!' })
        loadUsers()
        setFormData({ email: '', password: '', role: 'user', managerId: '' })
        setTimeout(() => handleCloseModal(), 1500)

      } catch (error) {
        console.error("Error creating user:", error)
        setMessage({ type: 'error', text: error.message || 'Failed to create user' })
      }

    }
  }

  const handleDeleteUser = async (userId, username) => {
    if (userId === user?.id) {
      alert("You cannot delete your own account.")
      return
    }

    if (!window.confirm(`Are you sure you want to delete user "${username}"? This action is permanent.`)) {
      return
    }

    try {
      const { data, error } = await supabase.rpc('delete_user_rpc', { user_id: userId })

      if (error) throw error
      if (data && data.error) throw new Error(data.error)

      setMessage({ type: 'success', text: 'User deleted successfully!' })
      loadUsers()
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  const handleEditClick = (user) => {
    setFormData({
      email: user.username || 'No Name', // using username field for display
      role: user.role,
      managerId: user.manager_id || ''
    })
    setIsEditing(true)
    setEditingId(user.id)
    setShowAddForm(true)
  }

  const handleCloseModal = () => {
    setShowAddForm(false)
    setIsEditing(false)
    setEditingId(null)
    setFormData({ email: '', password: '', role: 'user', managerId: '' })
    setMessage({ type: '', text: '' })
  }

  return (
    <div className="user-management-container">
      <div className="user-management-header">
        <h2>User Management</h2>
        <button className="add-user-button" onClick={() => {
          setIsEditing(false)
          setFormData({ email: '', password: '', role: 'user', managerId: '' })
          setShowAddForm(true)
        }}>
          + Add User
        </button>
      </div>

      {showAddForm && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{isEditing ? 'Edit User' : 'Add New User'}</h3>
            <form onSubmit={handleSubmitUser}>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="text"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={isEditing}
                  className={isEditing ? "disabled-input" : ""}
                  required
                  placeholder="Enter email"
                />
              </div>

              {!isEditing && (
                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    placeholder="Enter password"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value, managerId: '' })}
                  required
                >
                  <option value="user">User</option>
                  <option value="manager">Manager/Team Lead</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {(formData.role === 'user' || formData.role === 'manager') && managers.length > 0 && (
                <div className="form-group">
                  <label>Assign to Manager</label>
                  <select
                    value={formData.managerId}
                    onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                  >
                    <option value="">No Manager</option>
                    {managers.map(manager => (
                      <option key={manager.id} value={manager.id}>
                        {manager.username || 'Unnamed Manager'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {message.text && (
                <div className={`message ${message.type}`}>
                  {message.text}
                </div>
              )}

              <div className="form-actions">
                <button type="button" onClick={handleCloseModal}>Cancel</button>
                <button type="submit">{isEditing ? 'Update User' : 'Add User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="users-table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name/Email</th>
              <th>Role</th>
              <th>Manager</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="4" className="no-data">No users found. (Check Supabase Profiles)</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>{user.username || 'No Name'}</td>
                  <td>
                    <span className={`role-badge role-${user.role}`}>
                      {user.role === 'admin' ? 'Administrator' :
                        user.role === 'manager' ? 'Manager/Team Lead' : 'User'}
                    </span>
                  </td>
                  <td>{user.managerName || '-'}</td>
                  <td>
                    <button
                      className="edit-user-btn"
                      onClick={() => handleEditClick(user)}
                    >
                      Edit
                    </button>
                    <button
                      className="delete-user-btn"
                      onClick={() => handleDeleteUser(user.id, user.username)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="pagination-footer" style={{ marginTop: '2rem', padding: '1rem', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="pagination-info" style={{ fontSize: '0.9rem', color: '#64748b' }}>
          Showing <span>{(currentPage - 1) * itemsPerPage + 1}</span> to <span>{Math.min(currentPage * itemsPerPage, totalCount)}</span> of <span>{totalCount}</span> users
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
    </div>
  )
}

export default UserManagement

