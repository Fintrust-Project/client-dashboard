/**
 * user.service.ts
 * Business logic layer for user/profile data management via Prisma.
 */

import { prisma } from '@/lib/prisma'
import { ProfileStatus } from '@/generated/prisma/enums'
import type { UserProfile } from '@/types'

// ─── Fetch ────────────────────────────────────────────────────────────────────

/**
 * Fetch all users from the profiles table (admin use).
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const users = await prisma.profile.findMany({
      where: {
        status: {
          not: ProfileStatus.DELETED,
        },
      },
      orderBy: {
        username: 'asc',
      },
    })
    return users as unknown as UserProfile[]
  } catch (error) {
    console.error('Error fetching users via Prisma:', error)
    return []
  }
}

/**
 * Fetch a single user profile by ID.
 */
export async function getUserById(id: string): Promise<UserProfile | null> {
  try {
    const user = await prisma.profile.findUnique({
      where: { id },
    })
    return user as unknown as UserProfile | null
  } catch (error) {
    console.error('Error fetching user by ID via Prisma:', error)
    return null
  }
}

// ─── Update ───────────────────────────────────────────────────────────────────

/**
 * Update a user's profile fields.
 */
export async function updateUserProfile(
  id: string,
  updates: Partial<UserProfile>
): Promise<{ success: boolean; message?: string }> {
  try {
    // Exclude fields that are not in the profile model schema
    const { id: _, ...validUpdates } = updates
    await prisma.profile.update({
      where: { id },
      data: validUpdates,
    })
    return { success: true }
  } catch (error: any) {
    console.error('Error updating profile via Prisma:', error)
    return { success: false, message: error.message || 'Update failed' }
  }
}

// ─── Delete (soft) ────────────────────────────────────────────────────────────

/**
 * Soft-delete a user by setting status to DELETED.
 */
export async function deactivateUser(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    await prisma.profile.update({
      where: { id },
      data: { status: ProfileStatus.DELETED },
    })
    return { success: true }
  } catch (error: any) {
    console.error('Error deactivating user via Prisma:', error)
    return { success: false, message: error.message || 'Deactivation failed' }
  }
}
