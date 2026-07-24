/**
 * auth.service.ts
 * Business logic layer for authentication.
 * All Supabase auth calls are centralised here.
 * Controllers (API routes) and Context call these functions.
 */

import { supabase } from '@/lib/supabase'
import type { AuthResult, AuthUser, SignupPayload, UserProfile } from '@/types'

// ─── Profile helpers ──────────────────────────────────────────────────────────

/**
 * Fetch a user profile from the `profiles` table.
 * Returns null when the profile does not exist.
 */
export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !data) return null
  return data as UserProfile
}

// ─── Login ────────────────────────────────────────────────────────────────────

/**
 * Authenticate a user.
 * Supports both:
 *   1. Test-mode users stored directly in the profiles table (password column).
 *   2. Real Supabase Auth users.
 */
export async function loginUser(
  email: string,
  password: string
): Promise<{ result: AuthResult; user?: AuthUser }> {
  // ── Real Supabase Auth ──
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { result: { success: false, message: error.message } }
  }

  if (data.user) {
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', data.user.id)
      .single()

    if (userProfile?.status === 'deleted') {
      await supabase.auth.signOut()
      return { result: { success: false, message: 'This account has been deactivated.' } }
    }

    const fullProfile = await fetchUserProfile(data.user.id)
    const mergedUser: AuthUser = { ...data.user, ...(fullProfile || {}) } as AuthUser

    return {
      result: { success: true },
      user: mergedUser,
    }
  }

  return { result: { success: false, message: 'Login failed.' } }
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logoutUser(): Promise<void> {
  await supabase.auth.signOut()
}

// ─── Signup ───────────────────────────────────────────────────────────────────

/**
 * Initiate signup flow using Supabase Auth.
 */
export async function initiateSignup(payload: SignupPayload): Promise<AuthResult> {
  const { email, password, username, phone } = payload

  // Register in Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        phone: '+91' + phone,
      },
    },
  })

  if (error) {
    return { success: false, message: error.message }
  }

  // If email confirmation is disabled, a session is returned immediately.
  // We can create the profile right away.
  if (data.user && data.session) {
    const newUser = {
      id: data.user.id,
      username,
      role: 'user',
      status: 'active',
    }
    await supabase.from('profiles').insert(newUser)
  }

  return { success: true }
}

// ─── OTP Verification ─────────────────────────────────────────────────────────

/**
 * Verify the OTP and create a user profile in the database.
 */
export async function verifyOtpAndCreateUser(
  otp: string,
  signupData: Omit<SignupPayload, 'password'>,
  password: string
): Promise<{ result: AuthResult; user?: AuthUser }> {
  if (otp.length !== 6) {
    return { result: { success: false, message: 'Invalid OTP format' } }
  }

  // Verify the OTP via Supabase Auth
  const { data, error } = await supabase.auth.verifyOtp({
    email: signupData.email,
    token: otp,
    type: 'signup',
  })

  if (error) {
    // If verification fails but user is somehow already created in auth, check if they exist
    return { result: { success: false, message: error.message } }
  }

  const userId = data.user?.id
  if (!userId) {
    return { result: { success: false, message: 'Failed to retrieve authenticated user ID' } }
  }

  const newUser = {
    id: userId,
    username: signupData.username,
    role: 'user' as const,
    status: 'active' as const,
  }

  const { error: profileError } = await supabase.from('profiles').insert(newUser)

  if (profileError) {
    console.error('Profile creation error:', profileError)
    // If they already exist in profiles, we can ignore this error
    const existing = await fetchUserProfile(userId)
    if (!existing) {
      return { result: { success: false, message: 'Failed to create profile' } }
    }
  }

  return {
    result: { success: true },
    user: { ...data.user, ...newUser } as AuthUser,
  }
}

// ─── Session ──────────────────────────────────────────────────────────────────

/**
 * Get the current session and merge with the profile.
 * Called on app initialisation.
 */
export async function getCurrentSession(): Promise<AuthUser | null> {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.user) return null

  const profile = await fetchUserProfile(session.user.id)
  return { ...session.user, ...(profile || {}) } as AuthUser
}

