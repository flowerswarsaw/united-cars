import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-service'
import { getSession } from '@/lib/auth-utils'

// GET /api/claims/[id] - Get specific insurance claim details
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession(request)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roles = session.user.roles || []
    const claimId = params.id

    // Get claim from mock database
    const claim = await db.insuranceClaims.findById(claimId)

    if (!claim) {
      return NextResponse.json({ error: 'Insurance claim not found' }, { status: 404 })
    }

    // Check permissions - dealers can only see their own org's claims
    if (!roles.includes('ADMIN') && !roles.includes('OPS')) {
      if (claim.orgId !== session.user.orgId) {
        return NextResponse.json({ error: 'Insurance claim not found' }, { status: 404 })
      }
    }

    return NextResponse.json({ claim })
  } catch (error) {
    console.error('Get insurance claim error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
