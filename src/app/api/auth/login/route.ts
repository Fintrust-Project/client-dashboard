import { NextRequest, NextResponse } from 'next/server'
import { loginUser } from '@/services/auth.service'

export async function POST(request: NextRequest) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json(
      { success: false, message: 'Email and password are required' },
      { status: 400 }
    )
  }

  const { result, user } = await loginUser(email, password)

  return NextResponse.json({ ...result, user }, { status: result.success ? 200 : 401 })
}
