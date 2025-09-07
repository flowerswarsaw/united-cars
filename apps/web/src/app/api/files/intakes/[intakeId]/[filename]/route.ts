import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@united-cars/db'
import { getServerSessionFromRequest } from '@/lib/auth'
import { promises as fs } from 'fs'
import path from 'path'

// GET /api/files/intakes/:intakeId/:filename - Serve file with auth
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ intakeId: string; filename: string }> }
) {
  try {
    const { intakeId, filename } = await params
    const session = await getServerSessionFromRequest(request)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find intake to verify access
    const intake = await prisma.vehicleIntake.findUnique({
      where: { id: intakeId },
      include: { 
        org: true,
        attachments: {
          where: { filename: filename }
        }
      }
    })

    if (!intake) {
      return NextResponse.json({ error: 'Intake not found' }, { status: 404 })
    }

    // Check if attachment exists
    const attachment = intake.attachments.find(att => att.filename === filename)
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

    // Construct file path
    const uploadsDir = path.join(process.cwd(), 'uploads')
    const fullPath = path.join(uploadsDir, 'intakes', intakeId, attachment.filename)
    
    // Check if file exists on disk
    try {
      await fs.access(fullPath)
    } catch {
      return NextResponse.json({ error: 'File not found on disk' }, { status: 404 })
    }

    // Read and serve file
    const fileBuffer = await fs.readFile(fullPath)
    const mimeType = attachment.filename.endsWith('.pdf') ? 'application/pdf' : 
                     attachment.filename.endsWith('.jpg') || attachment.filename.endsWith('.jpeg') ? 'image/jpeg' :
                     attachment.filename.endsWith('.png') ? 'image/png' : 
                     'application/octet-stream'

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