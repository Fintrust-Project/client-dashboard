'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { getAvailableCourses } from '@/services/dashboard.service'
import type { Course } from '@/types'

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-slate-50">
      <header className="sticky top-0 z-[100] flex flex-col gap-4 border-b border-slate-700 bg-slate-800/80 p-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="text-center sm:text-left">
          <h1 className="mb-1 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-xl font-bold text-transparent sm:text-2xl">
            Welcome, {user?.email || 'User'}
          </h1>
          <p className="text-sm text-slate-400">Explore courses and prepare for your certifications</p>
        </div>
        <button
          onClick={handleLogout}
          className="self-center rounded-lg bg-red-500 px-6 py-3 font-semibold text-white shadow-md shadow-red-500/20 transition hover:-translate-y-0.5 hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/30 sm:self-auto"
        >
          Logout
        </button>
      </header>

      <main className="mx-auto max-w-[1400px] p-4 sm:p-8">
        {/* Navigation Tabs */}
        <div className="mb-8 flex gap-2 overflow-x-auto border-b border-slate-700 pb-3 sm:gap-4">
          <button
            onClick={() => setActiveTab('all')}
            className={`relative whitespace-nowrap px-2 py-2 text-sm font-semibold transition sm:px-4 sm:text-base ${
              activeTab === 'all'
                ? "text-slate-50 after:absolute after:inset-x-0 after:-bottom-3 after:h-0.5 after:bg-blue-500 after:content-['']"
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Available Courses ({allCourses.length})
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`relative whitespace-nowrap px-2 py-2 text-sm font-semibold transition sm:px-4 sm:text-base ${
              activeTab === 'my'
                ? "text-slate-50 after:absolute after:inset-x-0 after:-bottom-3 after:h-0.5 after:bg-blue-500 after:content-['']"
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            My Enrolled Courses ({enrolledIds.length})
          </button>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-slate-700 bg-white/[0.02] p-12 text-center text-slate-400">
              <p>No courses found in this category.</p>
              {activeTab === 'my' && (
                <button
                  onClick={() => setActiveTab('all')}
                  className="mt-4 rounded-md bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600"
                >
                  Browse All Courses
                </button>
              )}
            </div>
          ) : (
            filteredCourses.map((course) => {
              const isEnrolled = enrolledIds.includes(course.id)
              return (
                <div
                  key={course.id}
                  className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800/70 backdrop-blur-md transition hover:-translate-y-1 hover:border-blue-500 hover:shadow-2xl hover:shadow-black/40"
                >
                  <div className="border-b border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-8 text-center text-6xl">
                    {course.image}
                  </div>
                  <div className="p-6">
                    <span className="mb-3 inline-block rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-500">
                      {course.category}
                    </span>
                    <h3 className="mb-2 text-lg font-semibold leading-snug text-slate-50">
                      {course.title}
                    </h3>
                    <p className="mb-4 text-sm leading-relaxed text-slate-400">{course.description}</p>
                    <div className="mb-4 flex gap-4">
                      <span className="flex items-center gap-1 text-sm text-slate-400">
                        ⏱ {course.duration}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-slate-400">
                        📝 {course.questions} Questions
                      </span>
                    </div>

                    <div className="mt-6">
                      {!isEnrolled ? (
                        <button
                          onClick={() => handleEnroll(course.id)}
                          className="w-full rounded-lg bg-blue-500 py-3 font-semibold text-white transition hover:bg-blue-600"
                        >
                          Enroll Now
                        </button>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => setSelectedCourseMaterial(course)}
                            className="rounded-lg border border-white/20 bg-white/10 py-3 font-semibold text-white transition hover:bg-white/15"
                          >
                            📖 Course Material
                          </button>
                          <button
                            onClick={() => handleStartPractice(course.id)}
                            className="rounded-lg bg-blue-500 py-3 font-semibold text-white shadow-md shadow-blue-500/20 transition hover:-translate-y-0.5 hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/30"
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
          <div
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
            onClick={() => setSelectedCourseMaterial(null)}
          >
            <div
              className="flex w-full max-w-[650px] flex-col gap-5 rounded-2xl border border-slate-700 bg-slate-800 p-6 text-slate-50 shadow-2xl sm:p-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-xl font-bold">{selectedCourseMaterial.title}</h2>
                <button
                  onClick={() => setSelectedCourseMaterial(null)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-2xl text-slate-300 transition hover:rotate-90 hover:bg-white/20 hover:text-white"
                >
                  ×
                </button>
              </div>
              <span className="w-fit rounded-full bg-blue-500/10 px-3 py-1 text-sm font-semibold text-blue-500">
                {selectedCourseMaterial.category}
              </span>

              <div className="flex flex-col gap-4 leading-relaxed text-slate-300">
                <h3 className="text-lg text-white">📖 Overview & Preparation Guide</h3>
                <p>
                  Welcome to the preparation material for the {selectedCourseMaterial.title}. This
                  course is designed to cover the core curriculum required to pass the NISM
                  certification exam.
                </p>

                <h4 className="mt-2 text-white">Key Subjects Covered:</h4>
                <ul className="flex flex-col gap-2 pl-6">
                  <li>Introduction to Indian financial markets and regulatory guidelines.</li>
                  <li>In-depth analysis of research services, products, and investment strategies.</li>
                  <li>Ethical conduct, transparency rules, and SEBI compliance guidelines.</li>
                </ul>

                <h4 className="text-white">Practice Instructions:</h4>
                <p>
                  When you are ready, launch the Practice Test on the dashboard. The practice exam
                  consists of {selectedCourseMaterial.questions} questions and has a limit of{' '}
                  {selectedCourseMaterial.duration}.
                </p>
              </div>

              <div className="mt-2 flex flex-col-reverse justify-end gap-3 border-t border-slate-700 pt-5 sm:flex-row">
                <button
                  onClick={() => setSelectedCourseMaterial(null)}
                  className="rounded-lg border border-slate-700 px-5 py-2.5 font-semibold text-slate-400 transition hover:bg-white/5 hover:text-white"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleStartPractice(selectedCourseMaterial.id)
                    setSelectedCourseMaterial(null)
                  }}
                  className="rounded-lg bg-blue-500 px-6 py-2.5 font-semibold text-white transition hover:bg-blue-600"
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
