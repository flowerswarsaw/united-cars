import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@united-cars/db'
import { IntakeCreateInput } from '@united-cars/core'

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

// GET /api/intakes - List intakes for current org with pagination and search
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('perPage') || '25')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const roles = session.user.roles || []

    const skip = (page - 1) * perPage

    // Build where clause based on user role
    let whereClause: any = {}
    
    if (roles.includes('ADMIN') || roles.includes('OPS')) {
      // Admin/Ops can see all intakes, optionally filtered by status
      if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
        whereClause.status = status
      }
    } else {
      // Dealers can only see their own org's intakes
      whereClause.orgId = session.user.orgId
      if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
        whereClause.status = status
      }
    }

    // Add search filter
    if (search) {
      whereClause.OR = [
        { vin: { contains: search, mode: 'insensitive' } },
        { make: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get intakes with pagination
    const [intakes, total] = await Promise.all([
      prisma.vehicleIntake.findMany({
        where: whereClause,
        include: {
          createdBy: {
            select: { id: true, name: true, email: true }
          },
          reviewedBy: {
            select: { id: true, name: true, email: true }
          },
          auctionLocation: {
            select: { id: true, name: true, code: true, state: true }
          },
          attachments: true,
          org: {
            select: { id: true, name: true, type: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.vehicleIntake.count({ where: whereClause })
    ])

    return NextResponse.json({
      intakes,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage)
      }
    })
  } catch (error) {
    console.error('List intakes error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/intakes - Create new intake
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roles = session.user.roles || []
    if (!roles.includes('DEALER') && !roles.includes('ADMIN')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    
    // Validate input
    const input = IntakeCreateInput.parse(body)
    
    // Create intake
    const intake = await prisma.vehicleIntake.create({
      data: {
        ...input,
        orgId: session.user.orgId!,
        createdById: session.user.id,
        status: 'PENDING'
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        auctionLocation: {
          select: { id: true, name: true, code: true, state: true }
        },
        attachments: true
      }
    })

    return NextResponse.json({ success: true, intake }, { status: 201 })
  } catch (error: any) {
    console.error('Create intake error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json({ 
        error: 'Invalid input parameters',
        details: error.issues 
      }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}