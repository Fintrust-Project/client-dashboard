import { NextRequest, NextResponse } from 'next/server'
import { createEnquiry, getAllEnquiries } from '@/services/enquiry.service'
import { requireAdmin } from '@/services/auth.service'
import type { EnquiryPayload } from '@/services/enquiry.service'

// Public — the home page enquiry form posts here with no auth.
export async function POST(request: NextRequest) {
  const payload = (await request.json()) as EnquiryPayload

  const result = await createEnquiry(payload)

  return NextResponse.json(result, { status: result.success ? 200 : 400 })
}

// Admin only — this returns leads' names/emails/phone numbers.
export async function GET() {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }

  const enquiries = await getAllEnquiries()
  return NextResponse.json({ enquiries })
}
