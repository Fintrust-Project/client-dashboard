import { NextRequest, NextResponse } from 'next/server'
import { verifyOtpAndCreateUser } from '@/services/auth.service'
import type { SignupPayload } from '@/types'

export async function POST(request: NextRequest) {
  const { otp, signupData, password } = (await request.json()) as {
    otp: string
    signupData: Omit<SignupPayload, 'password'>
    password: string
  }

  if (!otp || !signupData?.email) {
    return NextResponse.json(
      { result: { success: false, message: 'Missing OTP or signup data' } },
      { status: 400 }
    )
  }

  const { result, user } = await verifyOtpAndCreateUser(otp, signupData, password)

  return NextResponse.json({ result, user }, { status: result.success ? 200 : 400 })
}
