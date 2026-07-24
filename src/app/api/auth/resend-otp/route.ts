import { NextRequest, NextResponse } from 'next/server'
import { resendSignupOtp } from '@/services/auth.service'

export async function POST(request: NextRequest) {
  const { email } = await request.json()

  if (!email) {
    return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 })
  }

  const result = await resendSignupOtp(email)

  return NextResponse.json(result, { status: result.success ? 200 : 429 })
}
