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

    // Get all matching payments first to get the total count
    const allPayments = await db.paymentIntents.findMany(filter)
    const total = allPayments.length

    // Apply pagination
    const startIndex = (page - 1) * perPage
    const paginatedPayments = allPayments.slice(startIndex, startIndex + perPage)

    // Get status counts for filter buttons (always get counts for all statuses)
    const statusCountFilter: any = {
      where: {}
    }
    
    // Apply same org scoping for counts
    if (session.user.roles?.includes('ADMIN')) {
      // Admin can see all payments
    } else {
      statusCountFilter.where.orgId = session.user.orgId
    }

    const allUserPayments = await db.paymentIntents.findMany(statusCountFilter)
    const statusCounts = {
      all: allUserPayments.length,
      PENDING: allUserPayments.filter(p => p.status === 'PENDING').length,
      APPROVED: allUserPayments.filter(p => p.status === 'APPROVED').length,
      DECLINED: allUserPayments.filter(p => p.status === 'DECLINED').length,
      CANCELED: allUserPayments.filter(p => p.status === 'CANCELED').length,
    }

    return NextResponse.json({
      success: true,
      payments: paginatedPayments,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage)
      },
      statusCounts
    })

  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}

interface PaymentAllocation {
  invoiceId: string
  invoiceNumber: string
  allocatedAmount: number
  remainingAmount: number
}

interface PaymentResult {
  paymentId: string
  totalAmount: number
  allocations: PaymentAllocation[]
  balanceChange: number
  newBalance: number
}

// Real balance management using database
async function getUserBalance(userId: string): Promise<number> {
  return await db.users.getBalance(userId)
}

async function updateUserBalance(userId: string, newBalance: number): Promise<void> {
  await db.users.updateBalance(userId, newBalance)
  console.log(`Updated user ${userId} balance to ${newBalance}`)
}

async function savePaymentProof(paymentId: string, file: File): Promise<string> {
  // Mock file save - replace with actual file storage
  const fileName = `payment-proof-${paymentId}-${Date.now()}.pdf`
  console.log(`Saved payment proof: ${fileName}`)
  return `/uploads/payment-proofs/${fileName}`
}


export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type')
    let method: string
    let amount: number
    let senderName: string
    let transferDate: string
    let allocations: Record<string, number>
    let proofFile: File | null = null

    if (contentType?.includes('multipart/form-data')) {
      // Handle form data (with file upload)
      const formData = await request.formData()
      
      method = formData.get('method') as string
      amount = parseFloat(formData.get('amount') as string)
      senderName = formData.get('senderName') as string
      transferDate = formData.get('transferDate') as string
      allocations = JSON.parse(formData.get('allocations') as string || '{}')
      proofFile = formData.get('proofFile') as File
    } else {
      // Handle JSON data (for balance payments)
      const body = await request.json()
      method = body.method
      amount = body.amount
      senderName = body.senderName
      transferDate = body.transferDate
      allocations = body.allocations || {}
    }

    // Validation
    if (!method || !['bank_transfer', 'balance'].includes(method)) {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      )
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    const currentBalance = await getUserBalance(session.user.id)

    // Validate balance payment
    if (method === 'balance' && amount > currentBalance) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      )
    }

    // Validate bank transfer requirements
    if (method === 'bank_transfer') {
      if (!senderName?.trim()) {
        return NextResponse.json(
          { error: 'Sender name is required for bank transfers' },
          { status: 400 }
        )
      }
      if (!transferDate) {
        return NextResponse.json(
          { error: 'Transfer date is required for bank transfers' },
          { status: 400 }
        )
      }
      if (!proofFile || proofFile.type !== 'application/pdf') {
        return NextResponse.json(
          { error: 'Valid PDF proof is required for bank transfers' },
          { status: 400 }
        )
      }
    }

    // Process manual allocations
    const totalAllocated = Object.values(allocations).reduce((sum, allocation) => sum + allocation, 0)
    const remainingAmount = amount - totalAllocated
    
    // Convert allocations to the format expected by the result
    const allocationResults: PaymentAllocation[] = Object.entries(allocations).map(([invoiceId, allocatedAmount]) => ({
      invoiceId,
      invoiceNumber: `INV-${invoiceId}`, // Mock - in real implementation, lookup invoice number
      allocatedAmount,
      remainingAmount: 0 // This would be calculated based on invoice amount - allocated amount
    })).filter(allocation => allocation.allocatedAmount > 0)

    // Calculate new balance
    let newBalance = currentBalance
    if (method === 'balance') {
      // Deduct from balance
      newBalance = currentBalance - amount
    } else {
      // Add overpayment to balance
      newBalance = currentBalance + remainingAmount
    }

    // Create payment record
    const paymentId = `payment-${Date.now()}`
    const paymentData = {
      id: paymentId,
      orgId: session.user.orgId,
      method,
      amount,
      currency: 'USD',
      status: 'PENDING',
      senderName: method === 'bank_transfer' ? senderName : null,
      transferDate: method === 'bank_transfer' ? transferDate : null,
      ref: method === 'bank_transfer' ? `TXN-${Date.now()}` : null,
      proofUrl: null,
      allocations: JSON.stringify(allocations), // Store allocation details
      totalAllocated,
      remainingAmount,
      balanceChange: newBalance - currentBalance,
      declineReason: null,
      reviewedBy: null,
      reviewedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdByUserId: session.user.id,
      version: 1
    }

    // Save payment proof if provided
    if (proofFile) {
      paymentData.proofUrl = await savePaymentProof(paymentId, proofFile)
    }

    // Save payment to database
    const payment = await db.paymentIntents.create(paymentData)

    // Update user balance
    await updateUserBalance(session.user.id, newBalance)

    const result: PaymentResult = {
      paymentId,
      totalAmount: amount,
      allocations: allocationResults,
      balanceChange: newBalance - currentBalance,
      newBalance
    }

    return NextResponse.json({
      success: true,
      message: 'Payment submitted successfully',
      payment,
      data: result
    })

  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    )
  }
}