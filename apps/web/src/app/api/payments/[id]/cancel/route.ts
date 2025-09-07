import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-service'
import { getSession } from '@/lib/auth-utils'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get the current payment
    const payment = await db.paymentIntents.findById(id)
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Check if user owns this payment or is admin
    const roles = session.user.roles || []
    const isOwner = payment.createdByUserId === session.user.id
    const isAdmin = roles.includes('ADMIN') || roles.includes('OPS')
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'You can only cancel your own payments' },
        { status: 403 }
      )
    }

    // Check if payment can be canceled (must be PENDING)
    if (payment.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Cannot cancel payment with status: ${payment.status}` },
        { status: 400 }
      )
    }

    // Update payment status to CANCELED
    const updatedPayment = {
      ...payment,
      status: 'CANCELED' as const,
      updatedAt: new Date(),
      version: payment.version + 1
    }

    // For mock database, we'll need to update it through the create method
    // In real implementation, this would be an update operation
    await db.paymentIntents.create(updatedPayment)

    return NextResponse.json({
      success: true,
      message: 'Payment canceled successfully',
      payment: updatedPayment
    })

  } catch (error) {
    console.error('Error canceling payment:', error)
    return NextResponse.json(
      { error: 'Failed to cancel payment' },
      { status: 500 }
    )
  }
}