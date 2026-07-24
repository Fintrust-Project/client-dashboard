import { NextResponse } from 'next/server'
import { getAllUsers } from '@/services/user.service'

export async function GET() {
  const users = await getAllUsers()
  return NextResponse.json({ users })
}
