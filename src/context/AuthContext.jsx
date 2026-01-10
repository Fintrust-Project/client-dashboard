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
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { success: false, message: error.message }
    }

    if (data.user) {
      // Explicitly wait for profile fetching so that 'user' state is updated
      // before the component receives the 'success' result and navigates.
      await fetchProfile(data.user)
    }

    return { success: true }
  }

  const logout = async () => {
    await supabase.auth.signOut()
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

  const value = {
    user,
    loading,
    login,
    logout,
    addUser
  }

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}

