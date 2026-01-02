import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../css/SidePanel.css'

const SidePanel = ({ activeView, setActiveView }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'clients', label: 'Client Data', icon: '👥' },
    { id: 'attendance', label: 'Attendance', icon: '📅' },
    { id: 'profile', label: 'Profile', icon: '👤' }
  ]

  if (user?.role === 'manager') {
    menuItems.push({ id: 'team', label: 'Team Management', icon: '👨‍👩‍👧‍👦' })
    menuItems.push({ id: 'strategies', label: 'Post Strategy', icon: '💡' })
  }

  if (user?.role === 'admin') {
    menuItems.push({ id: 'strategies', label: 'Post Strategy', icon: '💡' })
    menuItems.push({ id: 'users', label: 'User Management', icon: '⚙️' })
    menuItems.push({ id: 'verifications', label: 'Verifications', icon: '✅' })
  }

  return (
    <div className="side-panel">
      <div className="side-panel-header">
        <h2>CMS</h2>
      </div>
      <nav className="side-panel-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeView === item.id ? 'active' : ''}`}
            onClick={() => setActiveView(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="side-panel-footer">
        <button className="logout-button" onClick={handleLogout}>
          <span className="nav-icon">🚪</span>
          <span className="nav-label">Logout</span>
        </button>
      </div>
    </div>
  )
}

export default SidePanel

