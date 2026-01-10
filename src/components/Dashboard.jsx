import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import SidePanel from './SidePanel'
import IncomeChart from './IncomeChart'
import ClientData from './ClientData'
import Profile from './Profile'
import Attendance from './Attendance'
import UserManagement from './UserManagement'
import TeamManagement from './TeamManagement'
import PaymentVerifications from './PaymentVerifications'
import StrategyManager from './StrategyManager'
import StrategyBanner from './StrategyBanner'
import IncomeSlips from './IncomeSlips'
import TickerTape from './TickerTape'
import '../css/Dashboard.css'

const Dashboard = () => {
  const { user } = useAuth()
  const [activeView, setActiveView] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <IncomeChart />
      case 'clients':
        return <ClientData />
      case 'profile':
        return <Profile />
      case 'attendance':
        return <Attendance />
      case 'team':
        return user?.role === 'manager' ? <TeamManagement /> : null
      case 'strategies':
        return (user?.role === 'admin' || user?.role === 'manager') ? <StrategyManager /> : null
      case 'users':
        return user?.role === 'admin' ? <UserManagement /> : null
      case 'verifications':
        return user?.role === 'admin' ? <PaymentVerifications /> : null
      case 'slips':
        return (user?.role === 'admin' || user?.role === 'manager') ? <IncomeSlips /> : null
      default:
        return <IncomeChart />
    }
  }

  return (
    <div className={`dashboard ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* Mobile Overlay */}
      {sidebarOpen && <div className="mobile-overlay" onClick={() => setSidebarOpen(false)}></div>}

      <SidePanel
        activeView={activeView}
        setActiveView={(view) => {
          setActiveView(view);
          setSidebarOpen(false); // Auto-close on mobile after selection
        }}
        isOpen={sidebarOpen}
      />

      <div className="dashboard-content">
        <TickerTape />
        <header className="dashboard-header">
          <StrategyBanner />
        </header>
        <main className="dashboard-main">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}

export default Dashboard
