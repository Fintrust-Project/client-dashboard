import React from 'react'
import { useAuth } from '../context/AuthContext'
import '../css/Profile.css'

const Profile = () => {
  const { user } = useAuth()

  return (
    <div className="profile-container">
      <h2>Profile</h2>
      <div className="profile-card">
        <div className="profile-avatar">
          <span>{user?.username?.charAt(0).toUpperCase()}</span>
        </div>
        <div className="profile-info">
          <div className="info-row">
            <label>Username:</label>
            <span>{user?.username}</span>
          </div>
          <div className="info-row">
            <label>Role:</label>
            <span className={`role-badge role-${user?.role}`}>
              {user?.role === 'admin' ? 'Administrator' : 
               user?.role === 'manager' ? 'Manager/Team Lead' : 'User'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile

