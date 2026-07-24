'use client'
import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  loginUser,
  logoutUser,
  initiateSignup,
  verifyOtpAndCreateUser,
  fetchUserProfile,
} from '@/services/auth.service'
import type { AuthUser, AuthResult, SignupPayload } from '@/types'

// ─── Context shape ────────────────────────────────────────────────────────────

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<AuthResult>
  logout: () => Promise<void>
  signup: (payload: SignupPayload) => Promise<AuthResult>
  verifyOTP: (otp: string, signupData: Omit<SignupPayload, 'password'>) => Promise<AuthResult>
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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user as unknown as AuthUser)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user as unknown as AuthUser)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string, authUser: AuthUser) => {
    try {
      const profile = await fetchUserProfile(userId)

      if (profile) {
        if (profile.status === 'deleted') {
          await supabase.auth.signOut()
          setUser(null)
          return
        }
        setUser({ ...authUser, ...profile })
      } else {
        setUser(authUser)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  // ── Actions (delegate to service layer) ──────────────────────────────────

  const login = async (email: string, password: string): Promise<AuthResult> => {
    const { result, user: loggedInUser } = await loginUser(email, password)

    if (result.success && loggedInUser) {
      setUser(loggedInUser)
      localStorage.setItem('jwt_token', 'test_token_' + Date.now())
    }

    return result
  }

  const logout = async (): Promise<void> => {
    await logoutUser()
    localStorage.removeItem('jwt_token')
    setUser(null)
  }

  const signup = async (payload: SignupPayload): Promise<AuthResult> => {
    return initiateSignup(payload)
  }

  const verifyOTP = async (
    otp: string,
    signupData: Omit<SignupPayload, 'password'>
  ): Promise<AuthResult> => {
    const password = localStorage.getItem('temp_password') || ''
    const { result, user: newUser } = await verifyOtpAndCreateUser(otp, signupData, password)

    if (result.success && newUser) {
      setUser(newUser)
      localStorage.setItem('jwt_token', 'test_token_' + Date.now())
    }

    return result
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
    addUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
