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
        { number: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get invoices with pagination
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          org: true,
          lines: {
            include: {
              vehicle: true
            }
          },
          paymentIntents: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.invoice.count({ where })
    ])

    return NextResponse.json({
      success: true,
      invoices,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage)
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
    const body = await request.json()
    
    const invoice = await prisma.invoice.create({
      data: {
        orgId: body.orgId,
        number: body.number || `INV-${Date.now()}`,
        status: body.status || 'DRAFT',
        currency: body.currency || 'USD',
        total: body.total || 0,
        subtotal: body.subtotal || 0,
        vat: body.vat || 0,
        notes: body.notes,
        issuedAt: body.issuedAt ? new Date(body.issuedAt) : new Date(),
        lines: {
          create: body.lines || []
        }
      },
      include: {
        org: true,
        lines: {
          include: {
            vehicle: true
          }
        }
      }
    })

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