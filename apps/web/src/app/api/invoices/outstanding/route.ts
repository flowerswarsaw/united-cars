import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-service'
import { getSession } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get outstanding invoices for the user's organization
    // Admin can see all, dealers see only their own
    const orgId = session.user.roles?.includes('ADMIN') ? undefined : session.user.orgId
    
    const outstandingInvoices = await db.invoices.getOutstanding(orgId)

    // Enrich with organization information
    const enrichedInvoices = outstandingInvoices.map(invoice => {
      const org = orgId ? { name: 'Your Organization' } : { name: 'Unknown Organization' }
      return {
        id: invoice.id,
        number: invoice.number,
        total: invoice.total,
        paidAmount: invoice.paidAmount,
        remainingAmount: invoice.remainingAmount,
        currency: invoice.currency,
        issuedAt: invoice.issuedAt,
        status: invoice.status,
        org
      }
    })

    return NextResponse.json({
      success: true,
      invoices: enrichedInvoices,
      count: enrichedInvoices.length,
      totalOutstanding: enrichedInvoices.reduce((sum, inv) => sum + inv.remainingAmount, 0)
    })

  } catch (error) {
    console.error('Error fetching outstanding invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch outstanding invoices' },
      { status: 500 }
    )
  }
}