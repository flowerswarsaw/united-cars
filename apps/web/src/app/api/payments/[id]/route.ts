import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const payment = await prisma.paymentIntent.findUnique({
      where: { id },
      include: {
        org: true,
        invoice: true,
        createdByUser: true
      }
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      payment
    })

  } catch (error) {
    console.error('Error fetching payment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const payment = await prisma.paymentIntent.update({
      where: { id },
      data: {
        status: body.status,
        ref: body.ref
      },
      include: {
        org: true,
        invoice: true,
        createdByUser: true
      }
    })

    // If payment is approved, create journal entry
    if (body.status === 'APPROVED') {
      await prisma.journalEntry.create({
        data: {
          orgId: payment.orgId,
          category: 'PAYMENT',
          amount: payment.amount,
          currency: payment.currency,
          description: `Payment for Invoice ${payment.invoice?.number || 'N/A'}`,
          ref: payment.ref,
          lines: {
            create: [
              {
                account: 'CASH',
                debit: payment.amount,
                credit: 0,
                description: `Payment received: ${payment.method}`
              },
              {
                account: 'ACCOUNTS_RECEIVABLE',
                debit: 0,
                credit: payment.amount,
                description: `Payment for Invoice ${payment.invoice?.number || 'N/A'}`
              }
            ]
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      payment
    })

  } catch (error) {
    console.error('Error updating payment:', error)
    return NextResponse.json(
      { error: 'Failed to update payment' },
      { status: 500 }
    )
  }
}