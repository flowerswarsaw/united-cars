import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@united-cars/db'

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

// GET /api/titles - List titles for current org with pagination and search
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
      // Admin/Ops can see all titles, optionally filtered by status
      if (status && ['pending', 'received', 'packed', 'sent'].includes(status)) {
        whereClause.status = status
      }
    } else {
      // Dealers can only see their own org's vehicles' titles
      whereClause.vehicle = {
        orgId: session.user.orgId
      }
      if (status && ['pending', 'received', 'packed', 'sent'].includes(status)) {
        whereClause.status = status
      }
    }

    // Add search filter
    if (search) {
      whereClause.vehicle = {
        ...whereClause.vehicle,
        vin: { contains: search, mode: 'insensitive' }
      }
    }

    // Get titles with pagination
    const [titles, total] = await Promise.all([
      prisma.title.findMany({
        where: whereClause,
        include: {
          vehicle: {
            select: { 
              id: true, 
              vin: true, 
              make: true, 
              model: true, 
              year: true,
              org: {
                select: { id: true, name: true }
              }
            }
          },
          package: {
            select: { id: true, trackingNumber: true, provider: true, status: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.title.count({ where: whereClause })
    ])

    return NextResponse.json({
      titles,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage)
      }
    })
  } catch (error) {
    console.error('List titles error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}