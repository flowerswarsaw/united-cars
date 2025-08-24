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
      // Admin can see all payments
    } else {
      filter.where.orgId = session.user.orgId
    }
    
    if (status && status !== 'all') {
      filter.where.status = status.toUpperCase()
    }
    
    if (search) {
      filter.where.OR = [
        { method: { contains: search } },
        { ref: { contains: search } }
      ]
    }

    // Get payment intents using mock database
    const payments = await db.paymentIntents.findMany(filter)

    return NextResponse.json({
      success: true,
      payments: payments,
      pagination: {
        page,
        perPage,
        total: payments.length,
        totalPages: Math.ceil(payments.length / perPage)
      }
    })

  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
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
    
    // Create payment using mock database
    const paymentData = {
      orgId: body.orgId || session.user.orgId,
      invoiceId: body.invoiceId,
      method: body.method,
      amount: body.amount,
      currency: body.currency || 'USD',
      status: body.status || 'SUBMITTED',
      proofUrl: body.proofUrl,
      ref: body.ref,
      createdByUserId: session.user.id
    }

    // For mock data, we'll create a basic payment object
    const payment = {
      id: `payment-${Date.now()}`,
      ...paymentData,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    }

    return NextResponse.json({
      success: true,
      payment
    })

  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    )
  }
}