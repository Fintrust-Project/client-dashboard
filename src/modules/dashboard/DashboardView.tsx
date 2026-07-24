'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { getAvailableCourses } from '@/services/dashboard.service'
import type { Course } from '@/types'
import '@/css/Dashboard.css'

const DashboardView = () => {
  const { user, logout } = useAuth()
  const router = useRouter()
  const allCourses = getAvailableCourses()

  const [enrolledIds, setEnrolledIds] = useState<number[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all')
  const [selectedCourseMaterial, setSelectedCourseMaterial] = useState<Course | null>(null)

  // Load enrolled courses from localStorage for persistence per user
  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`enrolled_courses_${user.id}`)
      if (saved) {
        setEnrolledIds(JSON.parse(saved))
      }
    }
  }, [user?.id])

  const handleEnroll = (courseId: number) => {
    if (!user?.id) return
    const updated = [...enrolledIds, courseId]
    setEnrolledIds(updated)
    localStorage.setItem(`enrolled_courses_${user.id}`, JSON.stringify(updated))
  }

  const handleStartPractice = (courseId: number) => {
    router.push(`/practice-test/${courseId}`)
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const filteredCourses = activeTab === 'all' 
    ? allCourses 
    : allCourses.filter(c => enrolledIds.includes(c.id))

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Welcome, {user?.email || 'User'}</h1>
          <p>Explore courses and prepare for your certifications</p>
        </div>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <main className="dashboard-main">
        {/* Navigation Tabs */}
        <div className="dashboard-tabs">
          <button 
            className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Available Courses ({allCourses.length})
          </button>
          <button 
            className={`tab-button ${activeTab === 'my' ? 'active' : ''}`}
            onClick={() => setActiveTab('my')}
          >
            My Enrolled Courses ({enrolledIds.length})
          </button>
        </div>

        {/* Course Grid */}
        <div className="courses-grid">
          {filteredCourses.length === 0 ? (
            <div className="empty-state">
              <p>No courses found in this category.</p>
              {activeTab === 'my' && (
                <button className="cta-tab-button" onClick={() => setActiveTab('all')}>
                  Browse All Courses
                </button>
              )}
            </div>
          ) : (
            filteredCourses.map((course) => {
              const isEnrolled = enrolledIds.includes(course.id)
              return (
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

                    <div className="course-actions">
                      {!isEnrolled ? (
                        <button
                          className="enroll-button"
                          onClick={() => handleEnroll(course.id)}
                        >
                          Enroll Now
                        </button>
                      ) : (
                        <div className="enrolled-actions">
                          <button
                            className="study-button"
                            onClick={() => setSelectedCourseMaterial(course)}
                          >
                            📖 Course Material
                          </button>
                          <button
                            className="start-practice-button"
                            onClick={() => handleStartPractice(course.id)}
                          >
                            📝 Practice Test
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Course Material Modal */}
        {selectedCourseMaterial && (
          <div className="modal-overlay" onClick={() => setSelectedCourseMaterial(null)}>
            <div className="material-modal" onClick={(e) => e.stopPropagation()}>
              <button className="close-modal" onClick={() => setSelectedCourseMaterial(null)}>×</button>
              <h2>{selectedCourseMaterial.title}</h2>
              <span className="modal-badge">{selectedCourseMaterial.category}</span>
              
              <div className="modal-body-content">
                <h3>📖 Overview & Preparation Guide</h3>
                <p>Welcome to the preparation material for the {selectedCourseMaterial.title}. This course is designed to cover the core curriculum required to pass the NISM certification exam.</p>
                
                <h4>Key Subjects Covered:</h4>
                <ul>
                  <li>Introduction to Indian financial markets and regulatory guidelines.</li>
                  <li>In-depth analysis of research services, products, and investment strategies.</li>
                  <li>Ethical conduct, transparency rules, and SEBI compliance guidelines.</li>
                </ul>

                <h4>Practice Instructions:</h4>
                <p>When you are ready, launch the **Practice Test** on the dashboard. The practice exam consists of {selectedCourseMaterial.questions} questions and has a limit of {selectedCourseMaterial.duration}.</p>
              </div>

              <div className="modal-footer">
                <button className="modal-close-btn" onClick={() => setSelectedCourseMaterial(null)}>Close</button>
                <button 
                  className="modal-action-btn"
                  onClick={() => {
                    handleStartPractice(selectedCourseMaterial.id)
                    setSelectedCourseMaterial(null)
                  }}
                >
                  Start Practice Test
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default DashboardView
