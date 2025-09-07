import { NextRequest, NextResponse } from 'next/server'
import { generateInvoicePDF, type InvoicePDFData } from '@united-cars/pdf'
import { z } from 'zod'

// Comprehensive validation schema for antifragile design
const InvoiceGenerationSchema = z.object({
  company: z.enum(['united_cars', 'copart', 'iaa']),
  date: z.string().transform((str) => new Date(str)),
  customerType: z.enum(['private', 'legal_entity']),
  customerName: z.string().min(1, 'Customer name is required').max(200, 'Customer name too long'),
  documentNumber: z.string().min(1, 'Document number is required').max(50, 'Document number too long'),
  street: z.string().min(1, 'Street address is required').max(200, 'Street address too long'),
  city: z.string().min(1, 'City is required').max(100, 'City name too long'),
  state: z.string().min(1, 'State is required').max(50, 'State name too long'),
  postalCode: z.string().min(1, 'Postal code is required').max(20, 'Postal code too long'),
  country: z.string().min(1, 'Country is required').max(100, 'Country name too long'),
  vehicleMake: z.string().min(1, 'Vehicle make is required').max(50, 'Vehicle make too long'),
  vehicleModel: z.string().min(1, 'Vehicle model is required').max(50, 'Vehicle model too long'),
  vehicleYear: z.string().regex(/^\d{4}$/, 'Vehicle year must be a 4-digit number')
    .transform((str) => parseInt(str))
    .refine((year) => year >= 1900 && year <= new Date().getFullYear() + 1, 'Invalid vehicle year'),
  vinNumber: z.string()
    .regex(/^[A-HJ-NPR-Z0-9]{17}$/i, 'VIN must be 17 characters, no I, O, or Q')
    .transform((str) => str.toUpperCase()),
  lotStockNumber: z.string().min(1, 'Lot/Stock number is required').max(50, 'Lot/Stock number too long'),
  memberBuyerNumber: z.string().optional(),
  purposeOfPayment: z.string().min(1, 'Purpose of payment is required').max(200, 'Purpose too long'),
  price: z.number().min(0.01, 'Price must be greater than 0').max(10000000, 'Price too high'),
  additionalPayments: z.array(z.object({
    id: z.string(),
    description: z.string().min(1, 'Payment item description is required').max(200, 'Description too long'),
    amount: z.number().min(0, 'Payment item amount cannot be negative').max(10000000, 'Payment item amount too high')
  })).optional().default([]),
})

// Custom validation for member/buyer number based on company
const validateMemberNumber = (data: any) => {
  if ((data.company === 'copart' || data.company === 'iaa') && !data.memberBuyerNumber?.trim()) {
    throw new Error('Member/Buyer number is required for Copart and IAA')
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body with comprehensive error handling
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      return NextResponse.json(
        { 
          error: 'Invalid JSON format', 
          details: 'Request body must be valid JSON',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Validate the data structure
    let validatedData
    try {
      validatedData = InvoiceGenerationSchema.parse(body)
      
      // Additional custom validation
      validateMemberNumber(validatedData)
      
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { 
            error: 'Validation failed', 
            details: validationError.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            })),
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationError instanceof Error ? validationError.message : 'Unknown validation error',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }

    // Generate unique invoice number with company prefix and timestamp
    const companyPrefixes = {
      united_cars: 'INV',
      copart: 'CP',
      iaa: 'IAA'
    }
    
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const randomSuffix = Math.random().toString(36).substr(2, 6).toUpperCase()
    const invoiceNumber = `${companyPrefixes[validatedData.company]}-${timestamp}-${randomSuffix}`

    // Calculate totals
    const subtotal = validatedData.price + (validatedData.additionalPayments?.reduce((sum, payment) => sum + payment.amount, 0) || 0)
    const tax = 0 // No tax for generated invoices
    const total = subtotal + tax

    // Prepare invoice data for PDF generation using standard format
    const invoiceData: InvoicePDFData = {
      invoiceNumber,
      issuedAt: validatedData.date,
      dueDate: new Date(validatedData.date.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from issue date
      orgName: 'United Cars',
      orgAddress: '1234 Commerce Street, Suite 500\nLos Angeles, CA 90028, USA\nPhone: +1 (555) 123-4567\nEmail: billing@unitedcars.com\nTax ID: 12-3456789',
      customerName: validatedData.customerName,
      customerAddress: `${validatedData.street}\n${validatedData.city}, ${validatedData.state} ${validatedData.postalCode}\n${validatedData.country}`,
      total,
      subtotal,
      tax,
      currency: 'USD',
      notes: `Generated invoice for ${validatedData.customerType === 'private' ? 'individual' : 'company'} customer.\nDocument: ${validatedData.documentNumber}${validatedData.memberBuyerNumber ? `\nMember/Buyer: ${validatedData.memberBuyerNumber}` : ''}`,
      lines: [
        {
          description: validatedData.purposeOfPayment,
          vehicle: {
            vin: validatedData.vinNumber,
            year: validatedData.vehicleYear,
            make: validatedData.vehicleMake,
            model: validatedData.vehicleModel
          },
          qty: 1,
          unitPrice: validatedData.price,
          total: validatedData.price
        },
        ...(validatedData.additionalPayments?.map(payment => ({
          description: payment.description,
          vehicle: null,
          qty: 1,
          unitPrice: payment.amount,
          total: payment.amount
        })) || [])
      ]
    }

    // Generate PDF with error handling
    let pdfBuffer: Buffer
    try {
      pdfBuffer = await generateInvoicePDF(invoiceData)
    } catch (pdfError) {
      console.error('PDF Generation Error:', pdfError)
      return NextResponse.json(
        { 
          error: 'PDF generation failed', 
          details: 'Unable to generate invoice PDF. Please try again.',
          invoiceNumber,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    // Ensure PDF was generated successfully
    if (!pdfBuffer || pdfBuffer.length === 0) {
      return NextResponse.json(
        { 
          error: 'Empty PDF generated', 
          details: 'PDF generation completed but resulted in empty file',
          invoiceNumber,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    // Return PDF with proper headers
    const response = new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoiceNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
        'X-Invoice-Number': invoiceNumber,
        'X-Generated-At': new Date().toISOString(),
        'X-Company': validatedData.company.toUpperCase(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

    return response

  } catch (error) {
    // Comprehensive error logging for debugging
    console.error('Invoice Generation API Error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      requestUrl: request.url,
      userAgent: request.headers.get('user-agent')
    })

    // Antifragile response - don't expose internal errors to user
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: 'An unexpected error occurred while generating the invoice. Please try again.',
        timestamp: new Date().toISOString(),
        supportReference: `ERR-${Date.now()}`
      },
      { status: 500 }
    )
  }
}

// Optional: Add GET method for health check
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'invoice-generator',
    timestamp: new Date().toISOString(),
    supportedCompanies: ['united_cars', 'copart', 'iaa']
  })
}