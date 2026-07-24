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
  // ── Test mode: check profiles table directly ──
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single()

  if (!profileError && profile) {
    if (profile.password === password) {
      if (profile.status === 'deleted') {
        return { result: { success: false, message: 'This account has been deactivated.' } }
      }
      return { result: { success: true }, user: profile as AuthUser }
    }
  }

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
 * Initiate signup flow.
 * Currently runs in test mode — skips real OTP.
 */
export async function initiateSignup(payload: SignupPayload): Promise<AuthResult> {
  const { email } = payload

  // Check if user already exists
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('email')
    .eq('email', email)
    .single()

  if (existingUser) {
    return { success: false, message: 'User with this email already exists' }
  }

  console.log('TEST MODE: Skipping real OTP. Use any 6-digit code for verification.')
  console.log('Test OTP: 123456')

  return { success: true, testMode: true }
}

// ─── OTP Verification ─────────────────────────────────────────────────────────

/**
 * Verify the OTP and create a user profile in the database.
 * Currently demo/test mode — does not validate real OTP.
 */
export async function verifyOtpAndCreateUser(
  otp: string,
  signupData: Omit<SignupPayload, 'password'>,
  password: string
): Promise<{ result: AuthResult; user?: AuthUser }> {
  if (otp.length !== 6) {
    return { result: { success: false, message: 'Invalid OTP format' } }
  }

  const newUser: Omit<UserProfile, 'id'> & { id: string } = {
    id: signupData.email, // Using email as ID for test mode
    email: signupData.email,
    username: signupData.username,
    phone: '+91' + signupData.phone,
    password, // NOTE: Not secure — only for test mode
    role: 'user',
    status: 'active',
  }

  const { error: profileError } = await supabase.from('profiles').insert(newUser)

  if (profileError) {
    console.error('Profile creation error:', profileError)
    return { result: { success: false, message: 'Failed to create profile' } }
  }

  return {
    result: { success: true },
    user: newUser as AuthUser,
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
