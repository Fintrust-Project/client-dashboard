/**
 * auth.service.ts
 * Business logic layer for authentication.
 * Server-only: uses the cookie-aware Supabase server client + Prisma.
 * Only called from API routes (src/app/api/**), never imported by Client Components.
 */

import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { Role, ProfileStatus } from '@/generated/prisma/enums'
import type { AuthResult, AuthUser, SignupPayload, UserProfile } from '@/types'

// ─── Profile helpers ──────────────────────────────────────────────────────────

/**
 * Fetch a user profile from the `profiles` table.
 * Returns null when the profile does not exist.
 */
export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
    })
    return profile as unknown as UserProfile | null
  } catch (error) {
    console.error('Error fetching user profile via Prisma:', error)
    return null
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────

/**
 * Authenticate a user via Supabase Auth, then merge in their Prisma profile.
 */
export async function loginUser(
  email: string,
  password: string
): Promise<{ result: AuthResult; user?: AuthUser }> {
  const supabase = await createClient()

  // ── Real Supabase Auth ──
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { result: { success: false, message: error.message } }
  }

  if (data.user) {
    const profile = await fetchUserProfile(data.user.id)

    if (profile?.status === ProfileStatus.DELETED) {
      await supabase.auth.signOut()
      return { result: { success: false, message: 'This account has been deactivated.' } }
    }

    const mergedUser: AuthUser = { ...data.user, ...(profile || {}) } as AuthUser

    return {
      result: { success: true },
      user: mergedUser,
    }
  }

  return { result: { success: false, message: 'Login failed.' } }
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logoutUser(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
}

// ─── Signup ───────────────────────────────────────────────────────────────────

/**
 * Initiate signup flow using Supabase Auth.
 */
export async function initiateSignup(payload: SignupPayload): Promise<AuthResult> {
  const { email, password, username, phone } = payload
  const supabase = await createClient()

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
      role: Role.USER,
      status: ProfileStatus.ACTIVE,
    }
    try {
      await prisma.profile.create({ data: newUser })
    } catch (e) {
      console.error('Error creating profile via Prisma in signup:', e)
    }
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
  // Don't hardcode a specific OTP length — Supabase's "Email OTP Length" setting
  // is project-configurable (this project currently issues 8-digit codes), so
  // just sanity-check it's a plausible numeric OTP before hitting the API.
  if (!/^\d{6,10}$/.test(otp)) {
    return { result: { success: false, message: 'Invalid OTP format' } }
  }

  const supabase = await createClient()

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
    role: Role.USER,
    status: ProfileStatus.ACTIVE,
  }

  try {
    await prisma.profile.create({ data: newUser })
  } catch (profileError) {
    console.error('Profile creation error via Prisma:', profileError)
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

// ─── Resend OTP ───────────────────────────────────────────────────────────────

/**
 * Resend the signup confirmation OTP. Subject to Supabase's own per-user
 * minimum-interval setting (Auth -> Emails -> SMTP Settings), so callers
 * should surface `error.message` as-is — it already says how long to wait.
 */
export async function resendSignupOtp(email: string): Promise<AuthResult> {
  const supabase = await createClient()
  const { error } = await supabase.auth.resend({ type: 'signup', email })

  if (error) {
    return { success: false, message: error.message }
  }

  return { success: true }
}

// ─── Session ──────────────────────────────────────────────────────────────────

/**
 * Get the current authenticated user and merge with the profile.
 * Called on app initialisation via GET /api/auth/session.
 * Uses getUser() (not getSession()) since this runs server-side and must
 * validate the JWT against the Supabase Auth server rather than trust the cookie.
 */
export async function getCurrentSession(): Promise<AuthUser | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const profile = await fetchUserProfile(user.id)
  return { ...user, ...(profile || {}) } as AuthUser
}

