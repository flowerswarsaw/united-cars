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
  status: z.enum(['pending', 'received', 'packed', 'sent']),
  location: z.string().optional(),
  notes: z.string().optional(),
  trackingNumber: z.string().optional()
})

// PATCH /api/titles/[id]/status - Update title status
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
    const titleId = params.id

    // Check if title exists
    const existingTitle = await prisma.title.findUnique({
      where: { id: titleId },
      include: {
        vehicle: {
          select: { id: true, vin: true, make: true, model: true, year: true, orgId: true }
        },
        package: true
      }
    })

    if (!existingTitle) {
      return NextResponse.json({ error: 'Title not found' }, { status: 404 })
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      'pending': ['received'],
      'received': ['packed'],
      'packed': ['sent'],
      'sent': [] // No further transitions
    }

    const currentStatus = existingTitle.status
    const newStatus = input.status

    if (newStatus !== currentStatus && !validTransitions[currentStatus]?.includes(newStatus)) {
      return NextResponse.json({ 
        error: `Invalid status transition from ${currentStatus} to ${newStatus}` 
      }, { status: 400 })
    }

    // Update title and create/update package if needed
    const updatedTitle = await prisma.$transaction(async (tx) => {
      // Update title
      const title = await tx.title.update({
        where: { id: titleId },
        data: {
          status: newStatus,
          location: input.location || existingTitle.location,
          notes: input.notes ? 
            (existingTitle.notes ? `${existingTitle.notes}\n\n${input.notes}` : input.notes) 
            : existingTitle.notes,
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
          package: {
            select: { 
              id: true, 
              trackingNumber: true, 
              provider: true, 
              status: true,
              type: true
            }
          }
        }
      })

      // Create or update package when title is packed/sent
      if (newStatus === 'packed' || newStatus === 'sent') {
        if (existingTitle.package && input.trackingNumber) {
          // Update existing package
          await tx.package.update({
            where: { id: existingTitle.package.id },
            data: {
              trackingNumber: input.trackingNumber,
              status: newStatus === 'sent' ? 'shipped' : 'prepared',
              shippedAt: newStatus === 'sent' ? new Date() : existingTitle.package.shippedAt
            }
          })
        } else if (input.trackingNumber && !existingTitle.package) {
          // Create new package
          const newPackage = await tx.package.create({
            data: {
              trackingNumber: input.trackingNumber,
              provider: 'fedex', // Default provider
              type: 'SENDING',
              status: newStatus === 'sent' ? 'shipped' : 'prepared',
              shippedAt: newStatus === 'sent' ? new Date() : null
            }
          })

          // Link package to title
          await tx.title.update({
            where: { id: titleId },
            data: { packageId: newPackage.id }
          })
        }
      }

      // Add audit log entry
      await tx.auditLog.create({
        data: {
          actorUserId: session.user.id,
          orgId: existingTitle.vehicle.orgId,
          action: 'UPDATE',
          entity: 'title',
          entityId: titleId,
          diffJson: {
            before: { 
              status: currentStatus,
              location: existingTitle.location,
              notes: existingTitle.notes
            },
            after: { 
              status: newStatus,
              location: input.location || existingTitle.location,
              notes: input.notes ? 
                (existingTitle.notes ? `${existingTitle.notes}\n\n${input.notes}` : input.notes) 
                : existingTitle.notes
            }
          }
        }
      })

      return title
    })

    return NextResponse.json({ success: true, title: updatedTitle })
  } catch (error: any) {
    console.error('Update title status error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json({ 
        error: 'Invalid input parameters',
        details: error.issues 
      }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
