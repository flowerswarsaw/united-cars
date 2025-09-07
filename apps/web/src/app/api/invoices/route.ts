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
    

    // Build filter for mock database (without pagination first)
    const filter: any = {
      where: {}
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

    // Get all matching invoices first to get the total count
    const allInvoices = await db.invoices.findMany(filter)
    const total = allInvoices.length

    // Apply pagination
    const startIndex = (page - 1) * perPage
    const paginatedInvoices = allInvoices.slice(startIndex, startIndex + perPage)

    // Get status counts for filter buttons (always get counts for all statuses)
    const statusCountFilter: any = {
      where: {}
    }
    
    // Apply same org scoping for counts
    if (session.user.roles?.includes('ADMIN')) {
      // Admin can see all invoices
    } else {
      statusCountFilter.where.orgId = session.user.orgId
    }

    const allUserInvoices = await db.invoices.findMany(statusCountFilter)
    const statusCounts = {
      all: allUserInvoices.length,
      DRAFT: allUserInvoices.filter(i => i.status === 'DRAFT').length,
      SENT: allUserInvoices.filter(i => i.status === 'SENT').length,
      PAID: allUserInvoices.filter(i => i.status === 'PAID').length,
      OVERDUE: allUserInvoices.filter(i => i.status === 'OVERDUE').length,
      CANCELLED: allUserInvoices.filter(i => i.status === 'CANCELLED').length,
    }

    return NextResponse.json({
      success: true,
      invoices: paginatedInvoices,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage)
      },
      statusCounts
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