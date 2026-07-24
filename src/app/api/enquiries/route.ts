import { NextRequest, NextResponse } from 'next/server'
import { createEnquiry, getAllEnquiries } from '@/services/enquiry.service'
import type { EnquiryPayload } from '@/services/enquiry.service'

// Public — the home page enquiry form posts here with no auth.
export async function POST(request: NextRequest) {
  const payload = (await request.json()) as EnquiryPayload

  const result = await createEnquiry(payload)

  return NextResponse.json(result, { status: result.success ? 200 : 400 })
}

// Admin use (no role guard yet — same known gap as /api/users, see ARCHITECTURE.md).
export async function GET() {
  const enquiries = await getAllEnquiries()
  return NextResponse.json({ enquiries })
}
