'use client'
import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { getAvailableCourses } from '@/services/dashboard.service'
import type { Course } from '@/types'
import '@/css/Dashboard.css'

const DashboardView = () => {
  const { user, logout } = useAuth()
  const router = useRouter()
  const courses: Course[] = getAvailableCourses()

  const handleStartPractice = (courseId: number) => {
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

export default DashboardView
