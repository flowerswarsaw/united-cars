import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-service'
import { getSession } from '@/lib/auth-utils'

// GET /api/services/[id] - Get specific service request details
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(request)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roles = session.user.roles || []
    const serviceId = (await params).id

    // Get service request from mock database
    const serviceRequest = await db.serviceRequests.findById(serviceId)

    if (!serviceRequest) {
      return NextResponse.json({ error: 'Service request not found' }, { status: 404 })
    }

    // Check permissions - dealers can only see their own org's service requests
    if (!roles.includes('ADMIN') && !roles.includes('OPS')) {
      if (serviceRequest.orgId !== session.user.orgId) {
        return NextResponse.json({ error: 'Service request not found' }, { status: 404 })
      }
    }

    return NextResponse.json({ serviceRequest })
  } catch (error) {
    console.error('Get service request error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
