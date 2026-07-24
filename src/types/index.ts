// ─── User & Auth ──────────────────────────────────────────────────────────────

import type { Role, ProfileStatus } from '@/generated/prisma/enums'

export type { Role, ProfileStatus }

export interface UserProfile {
  id: string
  email: string
  username?: string
  phone?: string
  role: Role
  status: ProfileStatus
}

export interface AuthUser extends UserProfile {
  // Supabase auth fields merged with profile
  app_metadata?: Record<string, unknown>
  user_metadata?: Record<string, unknown>
}

export interface SignupPayload {
  email: string
  phone: string
  password: string
  username: string
}

export interface AuthResult {
  success: boolean
  message?: string
  testMode?: boolean
}

// ─── Courses ──────────────────────────────────────────────────────────────────

export interface Course {
  id: number
  title: string
  description: string
  category: string
  duration: string
  questions: number
  image: string
}

// ─── Practice Test ───────────────────────────────────────────────────────────

export interface Question {
  id: number
  question: string
  options: string[]
  correct: number
}

export type QuestionStatus = 'selected' | 'answered' | 'review' | 'not-attempted'
