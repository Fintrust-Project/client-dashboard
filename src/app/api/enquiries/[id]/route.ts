import { NextRequest, NextResponse } from 'next/server'
import { updateEnquiryStatus } from '@/services/enquiry.service'
import { EnquiryStatus } from '@/generated/prisma/enums'

type RouteParams = { params: Promise<{ id: string }> }

const VALID_STATUSES = Object.values(EnquiryStatus)

// Admin use — update follow-up status (PENDING -> CONTACTED -> RESOLVED).
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const { status } = await request.json()

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { success: false, message: `status must be one of ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    )
  }

  const result = await updateEnquiryStatus(Number(id), status)

  return NextResponse.json(result, { status: result.success ? 200 : 400 })
}
