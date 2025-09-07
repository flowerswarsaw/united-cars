import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-service'
import { z } from 'zod'
import { getSession } from '@/lib/auth-utils'

const StatusUpdateSchema = z.object({
  status: z.enum(['pending', 'approved', 'in_progress', 'completed', 'rejected', 'cancelled']),
  priceUSD: z.union([z.number().positive(), z.null()]).optional(),
  notes: z.union([z.string(), z.null()]).optional(),
  // Status-specific fields
  rejectionReason: z.string().optional()
})

// PATCH /api/services/[id]/status - Update service request status
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(request)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const input = StatusUpdateSchema.parse(body)
    const serviceId = (await params).id

    // Get the service request to check permissions
    const existingService = await db.serviceRequests.findById(serviceId)
    if (!existingService) {
      return NextResponse.json({ error: 'Service request not found' }, { status: 404 })
    }

    const roles = session.user.roles || []
    const isAdmin = roles.includes('ADMIN')
    const isClaims = roles.includes('CLAIMS')
    const isOwner = existingService.orgId === session.user.orgId
    const currentStatus = existingService.status

    // Define valid status transitions and permissions  
    const validTransitions: Record<string, { allowedNext: string[], requiredRole: string[] }> = {
      'pending': { 
        allowedNext: ['approved', 'rejected', 'cancelled'], 
        requiredRole: ['ADMIN'] // except cancelled which has special handling
      },
      'approved': { 
        allowedNext: ['in_progress', 'cancelled'], 
        requiredRole: ['ADMIN'] // except cancelled
      },
      'in_progress': { 
        allowedNext: ['completed'], 
        requiredRole: ['ADMIN'] 
      },
      'completed': { 
        allowedNext: [], 
        requiredRole: [] // completed is terminal - disputes go through claims system
      },
      'rejected': { 
        allowedNext: [], 
        requiredRole: [] // rejected is terminal
      },
      'cancelled': { 
        allowedNext: [], 
        requiredRole: [] // cancelled is terminal
      }
    }

    // Check if transition is valid
    if (!validTransitions[currentStatus]?.allowedNext.includes(input.status)) {
      return NextResponse.json({ 
        error: `Cannot change status from ${currentStatus} to ${input.status}` 
      }, { status: 400 })
    }

    // Special permission logic for specific transitions
    if (input.status === 'cancelled') {
      // Dealers can cancel their own services that are pending or approved
      if (!isOwner) {
        return NextResponse.json({ error: 'You can only cancel your own service requests' }, { status: 403 })
      }
      if (currentStatus !== 'pending' && currentStatus !== 'approved') {
        return NextResponse.json({ 
          error: 'Service requests can only be cancelled when they are pending or approved' 
        }, { status: 400 })
      }
    } else if (input.status === 'rejected') {
      // Rejection requires reason and admin role
      if (!isAdmin) {
        return NextResponse.json({ error: 'Only administrators can reject service requests' }, { status: 403 })
      }
      if (!input.rejectionReason) {
        return NextResponse.json({ 
          error: 'Rejection reason is required when rejecting a service' 
        }, { status: 400 })
      }
    } else {
      // General role-based permission check
      const requiredRoles = validTransitions[currentStatus].requiredRole
      const hasRequiredRole = requiredRoles.some(role => {
        if (role === 'ADMIN') return isAdmin
        return false
      })

      if (!hasRequiredRole) {
        return NextResponse.json({ 
          error: `Insufficient permissions to change status to ${input.status}` 
        }, { status: 403 })
      }
    }

    // Update service using mock database service
    const updatedService = await db.serviceRequests.updateStatus(serviceId, {
      ...input,
      userId: session.user.id
    })

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
