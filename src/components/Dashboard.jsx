'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import '../css/Dashboard.css'

const Dashboard = () => {
  const { user, logout } = useAuth()
  const router = useRouter()

  const courses = [
    {
      id: 1,
      title: 'NISM-Series-XXV-A: Persons Associated with Research Services',
      description: 'Sales and Other Non-Core Services Certification Examination',
      category: 'Research Services',
      duration: '2 hours',
      questions: 25,
      image: '📊'
    },
    {
      id: 2,
      title: 'NISM-Series-V-A: Mutual Fund Distributors',
      description: 'Certification Examination for Mutual Fund Distributors',
      category: 'Mutual Funds',
      duration: '2 hours',
      questions: 50,
      image: '💰'
    },
    {
      id: 3,
      title: 'NISM-Series-VIII: Equity Derivatives',
      description: 'Certification Examination for Equity Derivatives',
      category: 'Derivatives',
      duration: '2 hours',
      questions: 60,
      image: '📈'
    },
    {
      id: 4,
      title: 'NISM-Series-I: Currency Derivatives',
      description: 'Certification Examination for Currency Derivatives',
      category: 'Derivatives',
      duration: '2 hours',
      questions: 50,
      image: '💱'
    }
  ]

  const handleStartPractice = (courseId) => {
    router.push(`/practice-test/${courseId}`)
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Welcome, {user?.email || 'User'}</h1>
          <p>Select a course to start practicing</p>
        </div>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <main className="dashboard-main">
        <div className="courses-grid">
          {courses.map((course) => (
            <div key={course.id} className="course-card">
              <div className="course-image">{course.image}</div>
              <div className="course-content">
                <span className="course-category">{course.category}</span>
                <h3 className="course-title">{course.title}</h3>
                <p className="course-description">{course.description}</p>
                <div className="course-meta">
                  <span className="meta-item">⏱ {course.duration}</span>
                  <span className="meta-item">📝 {course.questions} Questions</span>
                </div>
                <button
                  className="start-practice-button"
                  onClick={() => handleStartPractice(course.id)}
                >
                  Start Practice Test
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default Dashboard
