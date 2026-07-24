'use client'
import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { AuthUser, AuthResult, SignupPayload } from '@/types'

// ─── Context shape ────────────────────────────────────────────────────────────

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<AuthResult>
  logout: () => Promise<void>
  signup: (payload: SignupPayload) => Promise<AuthResult>
  verifyOTP: (otp: string, signupData: Omit<SignupPayload, 'password'>) => Promise<AuthResult>
  resendOTP: (email: string) => Promise<AuthResult>
  addUser: (email: string, password: string, role?: string, managerId?: string) => Promise<AuthResult>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// ─── Provider ─────────────────────────────────────────────────────────────────

// Fetches the merged Supabase-auth + Prisma-profile user from the server.
// Kept out of the component so it can be called both on mount and from the
// auth-state-change listener without re-creating the closure each render.
async function fetchSession(): Promise<AuthUser | null> {
  const res = await fetch('/api/auth/session')
  if (!res.ok) return null
  const { user } = await res.json()
  return user
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active session on mount
    fetchSession().then((sessionUser) => {
      setUser(sessionUser)
      setLoading(false)
    })

    // Listen for auth state changes. Only SIGNED_IN needs a server round trip
    // (to merge in the Prisma profile for a newly-established session).
    // TOKEN_REFRESHED fires silently in the background (every ~55 min) purely
    // to rotate the JWT — the profile hasn't changed, so we keep the existing
    // `user` as-is instead of re-hitting /api/auth/session. This is what keeps
    // a long-running practice test from making background API/DB calls.
    // SIGNED_OUT clears state locally without a fetch, since we already know
    // the outcome.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === 'SIGNED_IN') {
        fetchSession().then(setUser)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
      // TOKEN_REFRESHED, USER_UPDATED, etc. intentionally ignored.
    })

    return () => subscription.unsubscribe()
  }, [])

  // ── Actions (delegate to API routes, which call the service layer) ───────

  const login = async (email: string, password: string): Promise<AuthResult> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()

    if (data.success && data.user) {
      setUser(data.user)
    }

    return { success: data.success, message: data.message }
  }

  const logout = async (): Promise<void> => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
  }

  const signup = async (payload: SignupPayload): Promise<AuthResult> => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return res.json()
  }

  const verifyOTP = async (
    otp: string,
    signupData: Omit<SignupPayload, 'password'>
  ): Promise<AuthResult> => {
    const password = localStorage.getItem('temp_password') || ''
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp, signupData, password }),
    })
    const { result, user: newUser } = await res.json()

    if (result.success && newUser) {
      setUser(newUser)
    }

    return result
  }

  const resendOTP = async (email: string): Promise<AuthResult> => {
    const res = await fetch('/api/auth/resend-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    return res.json()
  }

  const addUser = async (
    _email: string,
    _password: string,
    _role = 'user',
    _managerId?: string
  ): Promise<AuthResult> => {
    return { success: false, message: 'Please create users in the Supabase Dashboard.' }
  }

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    signup,
    verifyOTP,
    resendOTP,
    addUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
