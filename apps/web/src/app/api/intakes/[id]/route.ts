import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@united-cars/db'

// Simple auth helper
async function getSession(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session')
    if (!sessionCookie?.value) return null
    
    const decodedSession = decodeURIComponent(sessionCookie.value)
    const sessionData = JSON.parse(decodedSession)
    
    return sessionData.user ? { user: sessionData.user } : null
  } catch {
    return null
  }
}

// GET /api/intakes/[id] - Get specific intake details
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession(request)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roles = session.user.roles || []
    const intakeId = params.id

    // Build where clause based on user role
    let whereClause: any = { id: intakeId }
    
    if (!roles.includes('ADMIN') && !roles.includes('OPS')) {
      // Dealers can only see their own org's intakes
      whereClause.orgId = session.user.orgId
    }

    const intake = await prisma.vehicleIntake.findFirst({
      where: whereClause,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        reviewedBy: {
          select: { id: true, name: true, email: true }
        },
        auctionLocation: {
          select: { id: true, name: true, code: true, state: true }
        },
        attachments: {
          select: {
            id: true,
            kind: true,
            filename: true,
            uploadedAt: true
          },
          orderBy: { uploadedAt: 'desc' }
        },
        org: {
          select: { id: true, name: true, type: true }
        }
      }
    })

    if (!intake) {
      return NextResponse.json({ error: 'Intake not found' }, { status: 404 })
    }

    return NextResponse.json({ intake })
  } catch (error) {
    console.error('Get intake error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
