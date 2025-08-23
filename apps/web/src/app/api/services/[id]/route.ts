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

// GET /api/services/[id] - Get specific service request details
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession(request)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roles = session.user.roles || []
    const serviceId = params.id

    // Build where clause based on user role
    let whereClause: any = { id: serviceId }
    
    if (!roles.includes('ADMIN') && !roles.includes('OPS')) {
      // Dealers can only see their own org's services
      whereClause.orgId = session.user.orgId
    }

    const serviceRequest = await prisma.serviceRequest.findFirst({
      where: whereClause,
      include: {
        vehicle: {
          select: { 
            id: true, 
            vin: true, 
            make: true, 
            model: true, 
            year: true,
            status: true,
            org: {
              select: { id: true, name: true, type: true }
            }
          }
        },
        org: {
          select: { id: true, name: true, type: true }
        }
      }
    })

    if (!serviceRequest) {
      return NextResponse.json({ error: 'Service request not found' }, { status: 404 })
    }

    return NextResponse.json({ serviceRequest })
  } catch (error) {
    console.error('Get service request error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
