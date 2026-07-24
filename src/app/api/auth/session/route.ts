import { NextResponse } from 'next/server'
import { getCurrentSession } from '@/services/auth.service'

export async function GET() {
  const user = await getCurrentSession()
  return NextResponse.json({ user })
}
