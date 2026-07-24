import { NextRequest, NextResponse } from 'next/server'
import { initiateSignup } from '@/services/auth.service'
import type { SignupPayload } from '@/types'

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as SignupPayload

  if (!payload.email || !payload.password || !payload.username || !payload.phone) {
    return NextResponse.json(
      { success: false, message: 'Missing required fields' },
      { status: 400 }
    )
  }

  const result = await initiateSignup(payload)

  return NextResponse.json(result, { status: result.success ? 200 : 400 })
}
