import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-service'
import { getSession } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const balance = await db.users.getBalance(session.user.id)

    return NextResponse.json({
      success: true,
      balance,
      currency: 'USD'
    })

  } catch (error) {
    console.error('Error fetching user balance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user balance' },
      { status: 500 }
    )
  }
}