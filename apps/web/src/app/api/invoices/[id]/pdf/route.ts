import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db-service'
import { 
  getSession, 
  createApiResponse
} from '@/lib/auth-utils'
import { 
  withErrorHandler,
  createErrorResponse,
  ErrorCode,
  NotFoundError
} from '@/lib/error-handler'
import { generateInvoicePDF, InvoicePDFData } from '@united-cars/pdf'

export const GET = withErrorHandler(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const session = await getSession(request)
    if (!session?.user) {
      return createErrorResponse(ErrorCode.UNAUTHORIZED)
    }

    const { id } = await params
    const roles = session.user.roles || []

    // Try to find by ID first, then by invoice number
    let invoice = await db.invoices.findById(id)
    if (!invoice) {
      invoice = await db.invoices.findByNumber(id)
    }

    if (!invoice) {
      throw new NotFoundError('Invoice')
    }

    // Check access based on role
    if (!roles.includes('ADMIN') && !roles.includes('OPS')) {
      // Dealers can only see their own org's invoices
      if (invoice.orgId !== session.user.orgId) {
        throw new NotFoundError('Invoice')
      }
    }

    // Convert invoice data to PDF format
    const pdfData: InvoicePDFData = {
      invoiceNumber: invoice.number,
      issuedAt: new Date(invoice.issuedAt),
      dueDate: invoice.dueDate ? new Date(invoice.dueDate) : null,
      orgName: 'United Cars',
      orgAddress: '1234 Commerce Street, Suite 500\nLos Angeles, CA 90028, USA\nPhone: +1 (555) 123-4567\nEmail: billing@unitedcars.com\nTax ID: 12-3456789',
      customerName: invoice.org.name,
      customerAddress: 'Attention: Accounts Payable\n123 Business Avenue\nCity, State 12345\nUnited States',
      total: invoice.total,
      subtotal: invoice.subtotal,
      tax: invoice.vat,
      currency: invoice.currency,
      notes: invoice.notes,
      lines: invoice.lines.map(line => ({
        description: line.description,
        vehicle: line.vehicle ? {
          vin: line.vehicle.vin,
          year: line.vehicle.year,
          make: line.vehicle.make,
          model: line.vehicle.model
        } : null,
        qty: line.qty,
        unitPrice: line.unitPrice,
        total: line.qty * line.unitPrice
      }))
    }

    try {
      const pdfBuffer = await generateInvoicePDF(pdfData)
      
      const response = new NextResponse(pdfBuffer)
      response.headers.set('Content-Type', 'application/pdf')
      response.headers.set('Content-Disposition', `attachment; filename="invoice-${invoice.number}.pdf"`)
      
      return response
    } catch (error) {
      console.error('PDF generation error:', error)
      return createErrorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to generate PDF')
    }
  },
  { path: '/api/invoices/[id]/pdf', method: 'GET' }
)