import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@united-cars/db'
import { z } from 'zod'

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

const StatusUpdateSchema = z.object({
  status: z.enum(['pending', 'approved', 'in_progress', 'completed', 'rejected']),
  priceUSD: z.number().positive().optional(),
  notes: z.string().optional(),
  createInvoice: z.boolean().optional()
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

    // Check if service request exists
    const existingService = await prisma.serviceRequest.findUnique({
      where: { id: serviceId },
      include: {
        vehicle: {
          select: { id: true, vin: true, make: true, model: true, year: true, orgId: true }
        },
        org: {
          select: { id: true, name: true }
        }
      }
    })

    if (!existingService) {
      return NextResponse.json({ error: 'Service request not found' }, { status: 404 })
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      'pending': ['approved', 'rejected'],
      'approved': ['in_progress', 'rejected'],
      'in_progress': ['completed', 'rejected'],
      'completed': [], // No further transitions
      'rejected': [] // No further transitions
    }

    const currentStatus = existingService.status
    const newStatus = input.status

    if (newStatus !== currentStatus && !validTransitions[currentStatus]?.includes(newStatus)) {
      return NextResponse.json({ 
        error: `Invalid status transition from ${currentStatus} to ${newStatus}` 
      }, { status: 400 })
    }

    // Update service request and potentially create invoice
    const updatedService = await prisma.$transaction(async (tx) => {
      // Update service request
      const service = await tx.serviceRequest.update({
        where: { id: serviceId },
        data: {
          status: newStatus,
          priceUSD: input.priceUSD || existingService.priceUSD,
          notes: input.notes ? 
            (existingService.notes ? `${existingService.notes}\n\n${input.notes}` : input.notes) 
            : existingService.notes,
          updatedAt: new Date()
        },
        include: {
          vehicle: {
            select: { 
              id: true, 
              vin: true, 
              make: true, 
              model: true, 
              year: true,
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

      // Create invoice when service is completed and price is set
      if (newStatus === 'completed' && (input.createInvoice || input.priceUSD) && (input.priceUSD || existingService.priceUSD)) {
        const finalPrice = input.priceUSD || existingService.priceUSD!
        
        // Create invoice
        const invoice = await tx.invoice.create({
          data: {
            orgId: existingService.orgId,
            type: 'SERVICE',
            amount: finalPrice,
            currency: 'USD',
            status: 'pending',
            description: `${existingService.type.charAt(0).toUpperCase() + existingService.type.slice(1)} service for ${existingService.vehicle.year || ''} ${existingService.vehicle.make || ''} ${existingService.vehicle.model || ''} (VIN: ${existingService.vehicle.vin})`,
            metadata: {
              serviceRequestId: serviceId,
              vehicleId: existingService.vehicleId,
              serviceType: existingService.type
            }
          }
        })

        // Create invoice line item
        await tx.invoiceLineItem.create({
          data: {
            invoiceId: invoice.id,
            description: `${existingService.type.charAt(0).toUpperCase() + existingService.type.slice(1)} Service`,
            quantity: 1,
            unitPrice: finalPrice,
            amount: finalPrice
          }
        })

        // Add audit log for invoice creation
        await tx.auditLog.create({
          data: {
            actorUserId: session.user.id,
            orgId: existingService.orgId,
            action: 'CREATE',
            entity: 'invoice',
            entityId: invoice.id,
            diffJson: {
              after: { 
                type: 'SERVICE',
                amount: finalPrice,
                serviceRequestId: serviceId,
                description: invoice.description
              }
            }
          }
        })
      }

      // Add audit log entry for service status update
      await tx.auditLog.create({
        data: {
          actorUserId: session.user.id,
          orgId: existingService.orgId,
          action: 'UPDATE',
          entity: 'service_request',
          entityId: serviceId,
          diffJson: {
            before: { 
              status: currentStatus,
              priceUSD: existingService.priceUSD,
              notes: existingService.notes
            },
            after: { 
              status: newStatus,
              priceUSD: input.priceUSD || existingService.priceUSD,
              notes: input.notes ? 
                (existingService.notes ? `${existingService.notes}\n\n${input.notes}` : input.notes) 
                : existingService.notes
            }
          }
        }
      })

      return service
    })

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
