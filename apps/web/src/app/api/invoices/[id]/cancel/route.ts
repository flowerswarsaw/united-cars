import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db-service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await params;
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin users can cancel invoices
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only admins can cancel invoices' }, { status: 403 })
    }

    const body = await request.json()
    const { reason } = body

    if (!reason) {
      return NextResponse.json({ error: 'Cancellation reason is required' }, { status: 400 })
    }

    // Get the invoice
    const invoice = await db.invoices.findById(invoiceId)
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Check if invoice can be canceled (only PENDING or OVERDUE)
    if (!['PENDING', 'OVERDUE'].includes(invoice.status)) {
      return NextResponse.json({ 
        error: `Cannot cancel invoice with status ${invoice.status}` 
      }, { status: 400 })
    }

    // Cancel the invoice
    const canceledInvoice = await db.invoices.cancel(invoiceId, {
      cancelReason: reason,
      canceledBy: session.user.id,
      canceledAt: new Date()
    })

    return NextResponse.json({ 
      message: 'Invoice canceled successfully',
      invoice: canceledInvoice
    })
  } catch (error) {
    console.error('Error canceling invoice:', error)
    return NextResponse.json(
      { error: 'Failed to cancel invoice' },
      { status: 500 }
    )
  }
}