import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@united-cars/db'
import { IntakeUploadInput, processSecureUpload, ALL_ALLOWED_TYPES } from '@united-cars/core'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../auth/[...nextauth]/route'
import { join } from 'path'

// POST /api/intakes/:id/upload - Upload file to intake
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find intake and verify access
    const intake = await prisma.vehicleIntake.findUnique({
      where: { id: params.id },
      include: { org: true }
    })

    if (!intake) {
      return NextResponse.json({ error: 'Intake not found' }, { status: 404 })
    }

    const userRoles = session.user.roles || []
    const isAdminOrOps = userRoles.includes('ADMIN') || userRoles.includes('OPS')
    const isOwner = intake.orgId === session.user.orgId

    if (!isAdminOrOps && !isOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const kind = formData.get('kind') as string

    if (!file) {
      return NextResponse.json({ 
        error: { 
          code: 'VALIDATION', 
          message: 'No file uploaded',
          details: 'A file must be provided'
        }
      }, { status: 400 })
    }

    // Validate kind parameter
    const kindInput = IntakeUploadInput.parse({ kind })

    // Set up secure upload directory
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'intakes', params.id)
    
    // Process file securely with rate limiting
    const rateLimitId = `upload:${session.user.id}:${session.user.orgId}`
    
    let uploadResult
    try {
      uploadResult = await processSecureUpload(
        file,
        uploadDir,
        ALL_ALLOWED_TYPES,
        rateLimitId
      )
    } catch (uploadError) {
      const errorMessage = uploadError instanceof Error ? uploadError.message : 'Upload failed'
      
      // Determine appropriate status code
      let statusCode = 500
      let errorCode = 'UPLOAD'
      
      if (errorMessage.includes('Too many')) {
        statusCode = 429
        errorCode = 'RATE_LIMIT'
      } else if (errorMessage.includes('not allowed') || errorMessage.includes('too large')) {
        statusCode = 400
        errorCode = 'VALIDATION'
      }
      
      return NextResponse.json({ 
        error: { 
          code: errorCode,
          message: errorMessage
        }
      }, { status: statusCode })
    }

    // Create attachment record
    const attachment = await prisma.vehicleIntakeAttachment.create({
      data: {
        intakeId: params.id,
        kind: kindInput.kind.toUpperCase() as 'INVOICE' | 'PHOTO' | 'OTHER',
        url: uploadResult.url,
        filename: uploadResult.originalName
      }
    })

    // Add audit log entry
    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        orgId: intake.orgId,
        action: 'CREATE',
        entity: 'vehicle_intake_attachment',
        entityId: attachment.id,
        diffJson: {
          intakeId: params.id,
          kind: kindInput.kind,
          filename: uploadResult.originalName,
          secureFilename: uploadResult.filename,
          size: uploadResult.size,
          mimeType: uploadResult.mimeType
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      attachment,
      message: 'File uploaded successfully'
    })
  } catch (error: any) {
    console.error('Upload file error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json({ 
        error: 'Invalid parameters',
        details: error.issues 
      }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}