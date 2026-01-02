import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { format } from 'date-fns'
import '../css/StrategyManager.css'

const StrategyManager = () => {
    const { user } = useAuth()
    const [strategies, setStrategies] = useState([])
    const [loading, setLoading] = useState(true)
    const [showAddForm, setShowAddForm] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(10)
    const [totalCount, setTotalCount] = useState(0)
    const [formData, setFormData] = useState({
        message: '',
        scope: user?.role === 'admin' ? 'company' : 'team'
    })

    useEffect(() => {
        if (user) loadStrategies()
    }, [user, currentPage])

    const loadStrategies = async () => {
        try {
            setLoading(true)
            const from = (currentPage - 1) * itemsPerPage
            const to = from + itemsPerPage - 1

            let query = supabase
                .from('strategies')
                .select('*, profiles!author_id(username)', { count: 'exact' })
                .order('created_at', { ascending: false })

            if (user.role === 'manager') {
                query = query.eq('target_team_id', user.id).eq('scope', 'team')
            } else if (user.role === 'admin') {
                query = query.eq('scope', 'company')
            }

            const { data, error, count } = await query.range(from, to)
            if (error) throw error

            setStrategies(data || [])
            setTotalCount(count || 0)
        } catch (error) {
            console.error('Error loading strategies:', error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.message.trim()) return

        try {
            const payload = {
                message: formData.message.trim(),
                author_id: user.id,
                scope: formData.scope,
                target_team_id: formData.scope === 'team' ? user.id : null
            }

            const { error } = await supabase.from('strategies').insert([payload])
            if (error) throw error

            setFormData({ message: '', scope: user?.role === 'admin' ? 'company' : 'team' })
            setShowAddForm(false)
            setCurrentPage(1)
            loadStrategies()
        } catch (error) {
            alert('Error posting strategy: ' + error.message)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this strategy?')) return

        try {
            const { error } = await supabase.from('strategies').delete().eq('id', id)
            if (error) throw error
            loadStrategies()
        } catch (error) {
            alert('Error deleting strategy: ' + error.message)
        }
    }

    const canManage = user?.role === 'admin' || user?.role === 'manager'

    if (!canManage) {
        return (
            <div className="strategy-manager-container">
                <div className="access-denied">
                    <h2>Access Restricted</h2>
                    <p>Only Team Leads and Admins can manage strategies.</p>
                </div>
            </div>
        )
    }

    // Pagination variables (backend handled)
    const currentStrategies = strategies
    const totalPages = Math.ceil(totalCount / itemsPerPage)

    return (
        <div className="strategy-manager-container">
            <div className="strategy-manager-header">
                <div>
                    <h2>Strategy Management</h2>
                    <p className="subtitle">
                        {user.role === 'admin'
                            ? 'Post company-wide trading strategies for all teams'
                            : 'Post strategies for your team members'}
                    </p>
                </div>
                <button className="add-strategy-btn" onClick={() => setShowAddForm(true)}>
                    + New Strategy
                </button>
            </div>

            {showAddForm && (
                <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
                    <div className="modal-content strategy-form-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Post New Strategy</h3>
                        <form onSubmit={handleSubmit}>
                            {user.role === 'admin' && (
                                <div className="form-group">
                                    <label>Visibility</label>
                                    <select
                                        value={formData.scope}
                                        onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                                    >
                                        <option value="company">Company-Wide (All Teams)</option>
                                        <option value="team">My Team Only</option>
                                    </select>
                                </div>
                            )}

                            <div className="form-group">
                                <label>Strategy Message *</label>
                                <textarea
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    placeholder="e.g., Buy at 26800 and sell at 26900"
                                    rows="4"
                                    required
                                />
                            </div>

                            <div className="form-actions">
                                <button type="button" onClick={() => setShowAddForm(false)}>Cancel</button>
                                <button type="submit">Post Strategy</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="strategies-list">
                {loading ? (
                    <div className="loading">Loading strategies...</div>
                ) : strategies.length === 0 ? (
                    <div className="no-strategies">
                        <p>No strategies posted yet. Click "New Strategy" to create one.</p>
                    </div>
                ) : (
                    <>
                        {currentStrategies.map((strategy) => (
                            <div key={strategy.id} className="strategy-card">
                                <div className="strategy-card-header">
                                    <div className="strategy-meta">
                                        <span className={`scope-badge scope-${strategy.scope}`}>
                                            {strategy.scope === 'company' ? '🌐 Company-Wide' : '👥 Team Only'}
                                        </span>
                                        <span className="strategy-author">
                                            Posted by {strategy.profiles?.username || 'Unknown'}
                                        </span>
                                        <span className="strategy-date">
                                            {format(new Date(strategy.created_at), 'MMM dd, yyyy HH:mm')}
                                        </span>
                                    </div>
                                    <button
                                        className="delete-strategy-btn"
                                        onClick={() => handleDelete(strategy.id)}
                                        title="Delete strategy"
                                    >
                                        🗑️
                                    </button>
                                </div>
                                <div className="strategy-card-body">
                                    <p className="strategy-message-display">"{strategy.message}"</p>
                                </div>
                            </div>
                        ))}

                        {totalPages > 1 && (
                            <div className="pagination-controls">
                                <button
                                    className="pag-btn"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => prev - 1)}
                                >
                                    ← Previous
                                </button>
                                <span className="page-indicator">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    className="pag-btn"
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

export default StrategyManager
