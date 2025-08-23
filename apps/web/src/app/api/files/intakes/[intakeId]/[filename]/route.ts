import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@united-cars/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../auth/[...nextauth]/route'
import { getUploadPath, fileExists, getMimeType } from '@/lib/uploads'
import { promises as fs } from 'fs'

// GET /api/files/intakes/:intakeId/:filename - Serve file with auth
export async function GET(
  request: NextRequest,
  { params }: { params: { intakeId: string; filename: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find intake to verify access
    const intake = await prisma.vehicleIntake.findUnique({
      where: { id: params.intakeId },
      include: { 
        org: true,
        attachments: {
          where: { filename: params.filename }
        }
      }
    })

    if (!intake) {
      return NextResponse.json({ error: 'Intake not found' }, { status: 404 })
    }

    // Check if attachment exists
    const attachment = intake.attachments.find(att => att.filename === params.filename)
    if (!attachment) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Verify access
    const userRoles = session.user.roles || []
    const isAdminOrOps = userRoles.includes('ADMIN') || userRoles.includes('OPS')
    const isOwner = intake.orgId === session.user.orgId

    if (!isAdminOrOps && !isOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if file exists on disk
    const relativePath = `intakes/${params.intakeId}/${attachment.filename}`
    const exists = await fileExists(relativePath)
    
    if (!exists) {
      return NextResponse.json({ error: 'File not found on disk' }, { status: 404 })
    }

    // Read and serve file
    const fullPath = getUploadPath(relativePath)
    const fileBuffer = await fs.readFile(fullPath)
    const mimeType = getMimeType(attachment.filename)

    const response = new NextResponse(fileBuffer)
    response.headers.set('Content-Type', mimeType)
    response.headers.set('Content-Disposition', `inline; filename="${attachment.filename}"`)
    response.headers.set('Cache-Control', 'private, max-age=3600')

    return response
  } catch (error) {
    console.error('Serve file error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}