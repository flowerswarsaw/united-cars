import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-service'
import { z } from 'zod'
import { getSession } from '@/lib/auth-utils'

const StatusUpdateSchema = z.object({
  status: z.enum(['pending', 'approved', 'completed', 'rejected']),
  priceUSD: z.number().positive().optional(),
  notes: z.string().optional()
})

// PATCH /api/services/[id]/status - Update service request status
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession(request)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roles = session.user.roles || []
    if (!roles.includes('ADMIN') && !roles.includes('OPS')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const input = StatusUpdateSchema.parse(body)
    const serviceId = params.id

    // Update status using mock database service
    const updatedService = await db.serviceRequests.updateStatus(serviceId, input.status)

    if (!updatedService) {
      return NextResponse.json({ error: 'Service request not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, serviceRequest: updatedService })
  } catch (error: any) {
    console.error('Update service status error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json({ 
        error: 'Invalid input parameters',
        details: error.issues 
      }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
