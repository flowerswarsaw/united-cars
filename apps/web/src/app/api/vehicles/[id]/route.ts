import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-service'
import { 
  getSession, 
  createApiResponse
} from '@/lib/auth-utils'
import { 
  withErrorHandler,
  createErrorResponse,
  ErrorCode,
  NotFoundError
} from '@/lib/error-handler'

export const GET = withErrorHandler(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const session = await getSession(request)
    if (!session?.user) {
      return createErrorResponse(ErrorCode.UNAUTHORIZED)
    }

    const { id: vehicleId } = await params
    const roles = session.user.roles || []

    // Get vehicle from mock database
    const vehicle = await db.vehicles.findById(vehicleId)

    if (!vehicle) {
      throw new NotFoundError('Vehicle')
    }

    // Check permissions - users can only see their own vehicles unless admin
    if (!roles.includes('ADMIN') && !roles.includes('OPS')) {
      if (vehicle.orgId !== session.user.orgId) {
        throw new NotFoundError('Vehicle')
      }
    }

    // Enrich vehicle with organization information
    const org = await db.organizations.findById(vehicle.orgId)
    const enrichedVehicle = {
      ...vehicle,
      org: org ? { name: org.name } : { name: 'Unknown Organization' }
    }

    return createApiResponse({ vehicle: enrichedVehicle })
  },
  { path: '/api/vehicles/[id]', method: 'GET' }
)