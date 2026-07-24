import { NextRequest, NextResponse } from 'next/server'
import { getUserById, updateUserProfile, deactivateUser } from '@/services/user.service'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const user = await getUserById(id)

  if (!user) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({ user })
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const updates = await request.json()

  const result = await updateUserProfile(id, updates)

  return NextResponse.json(result, { status: result.success ? 200 : 400 })
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const result = await deactivateUser(id)

  return NextResponse.json(result, { status: result.success ? 200 : 400 })
}
