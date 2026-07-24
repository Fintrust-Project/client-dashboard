/**
 * enquiry.service.ts
 * Business logic for public enquiry-form submissions and admin follow-up tracking.
 * Server-only: imported only from src/app/api/**.
 */

import { prisma } from '@/lib/prisma'
import { EnquiryStatus } from '@/generated/prisma/enums'
import type { Enquiry } from '@/generated/prisma/client'

export type { EnquiryStatus }

export interface EnquiryPayload {
  name: string
  email: string
  mobile: string
  message?: string
}

// ─── Create ───────────────────────────────────────────────────────────────────

/**
 * Record a public enquiry-form submission. Starts life as PENDING.
 */
export async function createEnquiry(
  payload: EnquiryPayload
): Promise<{ success: boolean; message?: string }> {
  const { name, email, mobile, message } = payload

  if (!name || !email || !mobile) {
    return { success: false, message: 'Name, email, and mobile are required' }
  }

  try {
    await prisma.enquiry.create({
      data: { name, email, mobile, message },
    })
    return { success: true }
  } catch (error: any) {
    console.error('Error creating enquiry via Prisma:', error)
    return { success: false, message: error.message || 'Failed to submit enquiry' }
  }
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

/**
 * List all enquiries, newest first (admin use).
 */
export async function getAllEnquiries(): Promise<Enquiry[]> {
  try {
    return await prisma.enquiry.findMany({
      orderBy: { created_at: 'desc' },
    })
  } catch (error) {
    console.error('Error fetching enquiries via Prisma:', error)
    return []
  }
}

// ─── Update ───────────────────────────────────────────────────────────────────

/**
 * Update an enquiry's follow-up status (e.g. after a rep calls the lead).
 */
export async function updateEnquiryStatus(
  id: number,
  status: EnquiryStatus
): Promise<{ success: boolean; message?: string }> {
  try {
    await prisma.enquiry.update({
      where: { id },
      data: { status },
    })
    return { success: true }
  } catch (error: any) {
    console.error('Error updating enquiry status via Prisma:', error)
    return { success: false, message: error.message || 'Failed to update enquiry' }
  }
}
