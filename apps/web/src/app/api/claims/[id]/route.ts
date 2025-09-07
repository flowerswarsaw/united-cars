import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-service'
import { getSession } from '@/lib/auth-utils'

// GET /api/claims/[id] - Get specific insurance claim details
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(request)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roles = session.user.roles || []
    const claimId = (await params).id

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

// PATCH /api/claims/[id] - Update insurance claim status
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(request)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roles = session.user.roles || []
    const claimId = (await params).id
    const body = await request.json()

    // Only admins and operations can update claim status
    if (!roles.includes('ADMIN') && !roles.includes('OPS')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get existing claim to check permissions
    const existingClaim = await db.insuranceClaims.findById(claimId)
    if (!existingClaim) {
      return NextResponse.json({ error: 'Insurance claim not found' }, { status: 404 })
    }

    // Prevent modification of closed claims - they are final
    if (existingClaim.status === 'closed') {
      return NextResponse.json({ 
        error: 'Closed claims cannot be modified. Claim closure is final and irreversible.' 
      }, { status: 400 })
    }

    // Update claim status using the updateStatus method
    const updatedClaim = await db.insuranceClaims.updateStatus(claimId, body.status)
    
    if (!updatedClaim) {
      return NextResponse.json({ error: 'Failed to update claim' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      claim: updatedClaim 
    })
  } catch (error) {
    console.error('Update insurance claim error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
