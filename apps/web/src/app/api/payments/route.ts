import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('perPage') || '25')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const skip = (page - 1) * perPage

    // Build where clause
    const where: any = {}
    
    if (status && status !== 'all') {
      where.status = status.toUpperCase()
    }
    
    if (search) {
      where.OR = [
        { method: { contains: search, mode: 'insensitive' } },
        { ref: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get payment intents with pagination
    const [payments, total] = await Promise.all([
      prisma.paymentIntent.findMany({
        where,
        include: {
          org: true,
          invoice: true,
          createdByUser: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.paymentIntent.count({ where })
    ])

    return NextResponse.json({
      success: true,
      payments,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage)
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
    const body = await request.json()
    
    const payment = await prisma.paymentIntent.create({
      data: {
        orgId: body.orgId,
        invoiceId: body.invoiceId,
        method: body.method,
        amount: body.amount,
        currency: body.currency || 'USD',
        status: body.status || 'SUBMITTED',
        proofUrl: body.proofUrl,
        ref: body.ref,
        createdByUserId: body.createdByUserId
      },
      include: {
        org: true,
        invoice: true,
        createdByUser: true
      }
    })

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