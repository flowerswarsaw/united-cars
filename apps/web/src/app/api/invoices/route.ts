import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-service'
import { getSession } from '@/lib/auth-utils'

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

    // Build filter for mock database
    const filter: any = {
      where: {},
      skip: (page - 1) * perPage,
      take: perPage
    }

    // Add org scoping - admin can see all orgs, dealers only see their own
    if (session.user.roles?.includes('ADMIN')) {
      // Admin can see all invoices
    } else {
      filter.where.orgId = session.user.orgId
    }
    
    if (status && status !== 'all') {
      filter.where.status = status.toUpperCase()
    }
    
    if (search) {
      filter.where.OR = [
        { number: { contains: search } },
        { notes: { contains: search } }
      ]
    }

    // Get invoices using mock database
    const invoices = await db.invoices.findMany(filter)

    return NextResponse.json({
      success: true,
      invoices: invoices,
      pagination: {
        page,
        perPage,
        total: invoices.length,
        totalPages: Math.ceil(invoices.length / perPage)
      }
    })

  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Create invoice using mock database
    const invoiceData = {
      orgId: body.orgId || session.user.orgId,
      number: body.number || `INV-${Date.now()}`,
      status: body.status || 'DRAFT',
      currency: body.currency || 'USD',
      total: body.total || 0,
      subtotal: body.subtotal || 0,
      vat: body.vat || 0,
      notes: body.notes,
      issuedAt: body.issuedAt ? new Date(body.issuedAt) : new Date()
    }

    // For mock data, we'll create a basic invoice object
    const invoice = {
      id: `invoice-${Date.now()}`,
      ...invoiceData,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    return NextResponse.json({
      success: true,
      invoice
    })

  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}