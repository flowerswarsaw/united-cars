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

    // Check if user has permission to decline payments (admin/ops only)
    const roles = session.user.roles || []
    if (!roles.includes('ADMIN') && !roles.includes('OPS')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to decline payments' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { reason } = body

    // Validate decline reason
    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: 'Decline reason is required' },
        { status: 400 }
      )
    }

    // Get the current payment
    const payment = await db.paymentIntents.findById(id)
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Check if payment can be declined (must be PENDING)
    if (payment.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Cannot decline payment with status: ${payment.status}` },
        { status: 400 }
      )
    }

    // Update payment status to DECLINED
    const updatedPayment = {
      ...payment,
      status: 'DECLINED' as const,
      declineReason: reason.trim(),
      reviewedBy: session.user.id,
      reviewedAt: new Date(),
      updatedAt: new Date(),
      version: payment.version + 1
    }

    // For mock database, we'll need to update it through the create method
    // In real implementation, this would be an update operation
    await db.paymentIntents.create(updatedPayment)

    return NextResponse.json({
      success: true,
      message: 'Payment declined successfully',
      payment: updatedPayment
    })

  } catch (error) {
    console.error('Error declining payment:', error)
    return NextResponse.json(
      { error: 'Failed to decline payment' },
      { status: 500 }
    )
  }
}