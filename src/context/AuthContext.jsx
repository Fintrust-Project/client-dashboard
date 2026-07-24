'use client'
import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../supabase'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user)
      } else {
        setLoading(false)
      }
    })

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (authUser) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (profile) {
        if (profile.status === 'deleted') {
          await supabase.auth.signOut()
          setUser(null)
          return
        }
        setUser({ ...authUser, ...profile }) // Merge Auth data with Profile data
      } else {
        // Fallback if no profile yet
        setUser(authUser)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    // TEST MODE: Check profiles table directly for test users
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single()

    if (!profileError && profile) {
      // Test mode: Check password from profiles table
      if (profile.password === password) {
        if (profile.status === 'deleted') {
          return { success: false, message: 'This account has been deactivated.' }
        }

        setUser(profile)
        localStorage.setItem('jwt_token', 'test_token_' + Date.now())
        return { success: true }
      }
    }

    // Try Supabase auth for real users
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { success: false, message: error.message }
    }

    if (data.user) {
      // Fetch profile to check if user is deleted
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', data.user.id)
        .single()

      if (userProfile?.status === 'deleted') {
        await supabase.auth.signOut()
        return { success: false, message: 'This account has been deactivated.' }
      }

      await fetchProfile(data.user)

      // Store JWT token in localStorage (Supabase session includes JWT)
      if (data.session) {
        localStorage.setItem('jwt_token', data.session.access_token)
      }
    }

    return { success: true }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('jwt_token')
  }

  // Note: Creating a new user usually requires Admin API or manual sign up.
  // For this client-side demo, we use signUp, but be aware it might sign in the new user immediately
  // depending on Supabase settings. In a real Admin panel, you'd use a backend function.
  const addUser = async (email, password, role = 'user', managerId) => {
    // Warning: interacting with auth.users from client side for OTHER users is restricted.
    // This function acts as a wrapper for signUp, which is for SELF-registration.
    // If Admin uses this, they might get logged out.
    // Recommended: Use Supabase Dashboard to create users for this prototype.
    return { success: false, message: "Please create users explicitly in Supabase Dashboard for this prototype." }
  }

  const signup = async ({ email, phone, password, username }) => {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
        .single()

      if (existingUser) {
        return { success: false, message: 'User with this email already exists' }
      }

      // For testing: Skip Supabase auth and go directly to profile creation
      // In production, use Supabase auth.signUp() and send real OTP
      console.log('TEST MODE: Skipping real OTP. Use any 6-digit code for verification.')
      console.log('Test OTP: 123456')

      return { success: true, testMode: true }
    } catch (error) {
      console.error('Signup error:', error)
      return { success: false, message: 'Signup failed. Please try again.' }
    }
  }

  const verifyOTP = async (otp, signupData) => {
    try {
      // In a real implementation, verify the OTP from email/SMS
      // For demo purposes, we'll accept any 6-digit OTP
      if (otp.length !== 6) {
        return { success: false, message: 'Invalid OTP format' }
      }

      // TEST MODE: Create user directly in profiles table without Supabase auth
      const password = localStorage.getItem('temp_password')
      
      // Create profile entry
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: signupData.email, // Using email as ID for test mode
          email: signupData.email,
          username: signupData.username,
          phone: '+91' + signupData.phone,
          password: password, // Store password for test mode (NOT SECURE - only for testing)
          role: 'user',
          status: 'active'
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        return { success: false, message: 'Failed to create profile' }
      }

      // Set user directly for test mode (bypassing Supabase auth)
      setUser({
        id: signupData.email,
        email: signupData.email,
        username: signupData.username,
        phone: '+91' + signupData.phone,
        role: 'user',
        status: 'active'
      })

      // Store JWT token (mock token for test mode)
      localStorage.setItem('jwt_token', 'test_token_' + Date.now())

      return { success: true }
    } catch (error) {
      console.error('OTP verification error:', error)
      return { success: false, message: 'OTP verification failed' }
    }
  }

  const value = {
    user,
    loading,
    login,
    logout,
    signup,
    verifyOTP,
    addUser
  }

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}

