import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@united-cars/db'
import { processSecureUpload, ALLOWED_IMAGE_TYPES, MAX_FILES_PER_REQUEST } from '@united-cars/core/server'
import { join } from 'path'

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

// POST /api/claims/[id]/photos - Upload photos for claim
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: claimId } = await params;
    const session = await getSession(request)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const roles = session.user.roles || []

    // Check if claim exists and user has access
    let whereClause: any = { id: claimId }
    
    if (!roles.includes('ADMIN') && !roles.includes('OPS')) {
      // Dealers can only upload to their own org's claims
      whereClause.orgId = session.user.orgId
    }

    const claim = await prisma.insuranceClaim.findFirst({
      where: whereClause
    })

    if (!claim) {
      return NextResponse.json({ error: 'Claim not found or access denied' }, { status: 404 })
    }

    // Parse form data
    const data = await request.formData()
    const files: File[] = []
    
    // Collect all uploaded files
    for (const [key, value] of data.entries()) {
      if (key.startsWith('photos') && value instanceof File) {
        files.push(value)
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ 
        error: { 
          code: 'VALIDATION', 
          message: 'No photos uploaded',
          details: 'At least one image file must be provided'
        }
      }, { status: 400 })
    }

    if (files.length > MAX_FILES_PER_REQUEST) {
      return NextResponse.json({ 
        error: { 
          code: 'VALIDATION', 
          message: `Too many files. Maximum ${MAX_FILES_PER_REQUEST} files allowed per request.`
        }
      }, { status: 400 })
    }

    // Set up secure upload directory
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'claims', claimId)
    
    // Process files securely with rate limiting
    const uploadedPhotos = []
    const rateLimitId = `upload:${session.user.id}:${session.user.orgId}`
    
    try {
      for (const file of files) {
        const result = await processSecureUpload(
          file,
          uploadDir,
          ALLOWED_IMAGE_TYPES,
          rateLimitId
        )
        
        uploadedPhotos.push({
          filename: result.filename,
          originalName: result.originalName,
          size: result.size,
          mimeType: result.mimeType,
          url: result.url,
          uploadedAt: result.uploadedAt
        })
      }
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

    // Update claim with new photos
    const existingPhotos = (claim.photos as any[]) || []
    const updatedPhotos = [...existingPhotos, ...uploadedPhotos]

    const updatedClaim = await prisma.insuranceClaim.update({
      where: { id: claimId },
      data: {
        photos: updatedPhotos,
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

    // Add audit log entry
    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        orgId: claim.orgId,
        action: 'UPDATE',
        entity: 'insurance_claim',
        entityId: claimId,
        diffJson: {
          before: { photosCount: existingPhotos.length },
          after: { 
            photosCount: updatedPhotos.length,
            newPhotos: uploadedPhotos.map(p => p.originalName)
          }
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      claim: updatedClaim,
      uploadedPhotos: uploadedPhotos.length 
    })
  } catch (error) {
    console.error('Upload photos error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
