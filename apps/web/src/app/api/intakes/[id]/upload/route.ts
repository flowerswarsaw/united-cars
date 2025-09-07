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

// POST /api/intakes/[id]/upload - Upload payment confirmation files
export const POST = withErrorHandler(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const session = await getSession(request)
    if (!session?.user) {
      return createErrorResponse(ErrorCode.UNAUTHORIZED)
    }

    const { id: intakeId } = await params
    const roles = session.user.roles || []

    // Get intake from mock database
    const intake = await db.vehicleIntakes.findById(intakeId)

    if (!intake) {
      throw new NotFoundError('Vehicle intake')
    }

    // Check permissions - only owners can upload files
    if (intake.orgId !== session.user.orgId) {
      return createErrorResponse(ErrorCode.FORBIDDEN, 'You can only upload files to your own intakes')
    }

    // Only pending intakes can have files uploaded
    if (intake.status !== 'PENDING') {
      return createErrorResponse(ErrorCode.BAD_REQUEST, 'Files can only be uploaded for pending intakes')
    }

    try {
      const formData = await request.formData()
      const file = formData.get('file') as File
      const type = formData.get('type') as string || 'payment_confirmation'

      if (!file) {
        return createErrorResponse(ErrorCode.BAD_REQUEST, 'No file provided')
      }

      // Validate file type
      if (!file.type.includes('pdf') && !file.type.includes('image')) {
        return createErrorResponse(ErrorCode.BAD_REQUEST, 'Only PDF and image files are allowed')
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        return createErrorResponse(ErrorCode.BAD_REQUEST, 'File size must be less than 10MB')
      }

      // In a real implementation, you would:
      // 1. Save the file to cloud storage (AWS S3, Cloudflare R2, etc.)
      // 2. Get the file URL
      // 3. Save the file metadata to the database
      
      // For now, we'll simulate this by creating a mock file record
      const mockFileUrl = `/uploads/intakes/${intakeId}/${file.name}`
      
      const paymentConfirmation = {
        id: `file-${Date.now()}`,
        filename: file.name,
        url: mockFileUrl,
        uploadedAt: new Date()
      }

      // Update the intake with the new payment confirmation
      const updatedPaymentConfirmations = [
        ...(intake.paymentConfirmations || []),
        paymentConfirmation
      ]

      await db.vehicleIntakes.update(intakeId, {
        paymentConfirmations: updatedPaymentConfirmations
      })

      return createApiResponse({ 
        success: true,
        message: 'File uploaded successfully',
        file: paymentConfirmation
      })
      
    } catch (error: any) {
      console.error('File upload error:', error)
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to process file upload')
    }
  },
  { path: '/api/intakes/[id]/upload', method: 'POST' }
)