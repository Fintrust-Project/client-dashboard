/**
 * user.service.ts
 * Business logic layer for user/profile data management.
 */

import { supabase } from '@/lib/supabase'
import type { UserProfile } from '@/types'

// ─── Fetch ────────────────────────────────────────────────────────────────────

/**
 * Fetch all users from the profiles table (admin use).
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .neq('status', 'deleted')
    .order('email', { ascending: true })

  if (error) {
    console.error('Error fetching users:', error)
    return []
  }

  return (data || []) as UserProfile[]
}

/**
 * Fetch a single user profile by ID.
 */
export async function getUserById(id: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as UserProfile
}

// ─── Update ───────────────────────────────────────────────────────────────────

/**
 * Update a user's profile fields.
 */
export async function updateUserProfile(
  id: string,
  updates: Partial<UserProfile>
): Promise<{ success: boolean; message?: string }> {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)

  if (error) {
    return { success: false, message: error.message }
  }

  return { success: true }
}

// ─── Delete (soft) ────────────────────────────────────────────────────────────

/**
 * Soft-delete a user by setting status to 'deleted'.
 */
export async function deactivateUser(id: string): Promise<{ success: boolean; message?: string }> {
  const { error } = await supabase
    .from('profiles')
    .update({ status: 'deleted' })
    .eq('id', id)

  if (error) {
    return { success: false, message: error.message }
  }

  return { success: true }
}
