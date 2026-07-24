/**
 * dashboard.service.ts
 * Business logic for dashboard data — courses, user stats, etc.
 * This layer can be extended to fetch real data from Supabase in the future.
 */

import type { Course } from '@/types'

// ─── Courses ──────────────────────────────────────────────────────────────────

/**
 * Returns the list of available NISM practice courses.
 * In the future this could come from a Supabase `courses` table.
 */
export function getAvailableCourses(): Course[] {
  return [
    {
      id: 1,
      title: 'NISM-Series-XXV-A: Persons Associated with Research Services',
      description: 'Sales and Other Non-Core Services Certification Examination',
      category: 'Research Services',
      duration: '2 hours',
      questions: 25,
      image: '📊',
    },
    {
      id: 2,
      title: 'NISM-Series-V-A: Mutual Fund Distributors',
      description: 'Certification Examination for Mutual Fund Distributors',
      category: 'Mutual Funds',
      duration: '2 hours',
      questions: 50,
      image: '💰',
    },
    {
      id: 3,
      title: 'NISM-Series-VIII: Equity Derivatives',
      description: 'Certification Examination for Equity Derivatives',
      category: 'Derivatives',
      duration: '2 hours',
      questions: 60,
      image: '📈',
    },
    {
      id: 4,
      title: 'NISM-Series-I: Currency Derivatives',
      description: 'Certification Examination for Currency Derivatives',
      category: 'Derivatives',
      duration: '2 hours',
      questions: 50,
      image: '💱',
    },
  ]
}

/**
 * Get a single course by ID.
 */
export function getCourseById(id: number): Course | undefined {
  return getAvailableCourses().find((c) => c.id === id)
}
