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

    // Check if user has permission to approve payments (admin/ops only)
    const roles = session.user.roles || []
    if (!roles.includes('ADMIN') && !roles.includes('OPS')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to approve payments' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Get the current payment
    const payment = await db.paymentIntents.findById(id)
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Check if payment can be approved (must be PENDING)
    if (payment.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Cannot approve payment with status: ${payment.status}` },
        { status: 400 }
      )
    }

    // FINANCIAL INTEGRATION: Process payment approval with full financial logic
    console.log(`🏦 Processing payment approval for ${payment.id} - Amount: $${payment.amount}`)

    try {
      // Parse payment allocations
      const allocations = payment.allocations ? JSON.parse(payment.allocations) : {}
      const allocatedInvoices = Object.keys(allocations)
      
      console.log(`📋 Payment allocations:`, allocations)

      // Apply payment to each allocated invoice
      const invoiceUpdates = []
      for (const invoiceId of allocatedInvoices) {
        const allocatedAmount = allocations[invoiceId]
        
        console.log(`📄 Applying $${allocatedAmount} to invoice ${invoiceId}`)
        const updatedInvoice = await db.invoices.applyPayment(invoiceId, allocatedAmount)
        
        if (updatedInvoice) {
          invoiceUpdates.push(updatedInvoice)
          console.log(`✅ Invoice ${invoiceId}: ${updatedInvoice.status} - Paid: $${updatedInvoice.paidAmount}/$${updatedInvoice.total}`)
        }
      }

      // Update user balance if payment adds to balance (remaining amount or overpayment)
      if (payment.balanceChange && payment.balanceChange !== 0) {
        const currentBalance = await db.users.getBalance(payment.createdByUserId)
        const newBalance = currentBalance + payment.balanceChange
        
        console.log(`💰 Updating balance for user ${payment.createdByUserId}: $${currentBalance} → $${newBalance}`)
        await db.users.updateBalance(payment.createdByUserId, newBalance)
      }

      // Update payment status to APPROVED
      const updatedPayment = {
        ...payment,
        status: 'APPROVED' as const,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        updatedAt: new Date(),
        version: payment.version + 1
      }

      // Save updated payment
      await db.paymentIntents.create(updatedPayment)

      console.log(`🎉 Payment ${payment.id} approved successfully!`)
      console.log(`📊 Summary: ${invoiceUpdates.filter(i => i.status === 'PAID').length} invoice(s) marked as PAID`)

      return NextResponse.json({
        success: true,
        message: 'Payment approved successfully',
        payment: updatedPayment,
        invoiceUpdates: invoiceUpdates.map(inv => ({
          id: inv.id,
          number: inv.number,
          status: inv.status,
          paidAmount: inv.paidAmount,
          remainingAmount: inv.remainingAmount
        }))
      })
    } catch (financialError) {
      console.error('Error in financial processing:', financialError)
      return NextResponse.json(
        { error: 'Failed to process payment financial updates' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error approving payment:', error)
    return NextResponse.json(
      { error: 'Failed to approve payment' },
      { status: 500 }
    )
  }
}