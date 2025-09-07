import { jsPDF } from 'jspdf'

export interface InvoicePDFData {
  invoiceNumber: string
  issuedAt: Date
  dueDate?: Date | null
  status?: string
  orgName: string
  orgAddress?: string
  customerName: string
  customerAddress?: string
  total: number
  subtotal: number
  tax?: number
  currency?: string
  notes?: string
  lines: Array<{
    description: string
    vehicle?: {
      vin: string
      year?: number | null
      make?: string | null
      model?: string | null
    } | null
    qty: number
    unitPrice: number
    total: number
  }>
}

export interface QuotePDFData {
  quoteNumber: string
  issuedAt: Date
  orgName: string
  customerName: string
  validUntil: Date
  total: number
  items: Array<{
    service: string
    description: string
    amount: number
  }>
}

export async function generateInvoicePDF(data: InvoicePDFData): Promise<Buffer> {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  
  // Colors matching the web design
  const darkGray = [55, 65, 81] as [number, number, number]    // text-gray-700
  const mediumGray = [107, 114, 128] as [number, number, number] // text-gray-500
  const lightGray = [249, 250, 251] as [number, number, number]  // bg-gray-50
  const blueAccent = [59, 130, 246] as [number, number, number]  // text-blue-600
  const darkBackground = [55, 65, 81] as [number, number, number] // bg-gray-800
  
  let yPos = 30
  
  // Main Header Section (with border)
  doc.setDrawColor(229, 231, 235) // border-gray-200
  doc.setLineWidth(0.5)
  
  // Company Information (Left side)
  doc.setTextColor(...darkGray)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('UNITED CARS', 20, yPos)
  
  yPos += 6
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...mediumGray)
  
  const companyDetails = [
    'Vehicle Import & Export Services',
    '1234 Commerce Street, Suite 500',
    'Los Angeles, CA 90028, USA',
    'Phone: +1 (555) 123-4567',
    'Email: billing@unitedcars.com',
    'Tax ID: 12-3456789'
  ]
  
  companyDetails.forEach(line => {
    doc.text(line, 20, yPos)
    yPos += 4
  })
  
  // Invoice Details (Right side)
  let invoiceYPos = 30
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...darkGray)
  doc.text('INVOICE', pageWidth - 20, invoiceYPos, { align: 'right' })
  
  invoiceYPos += 10
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  
  const invoiceDetails = [
    `Invoice #: ${data.invoiceNumber}`,
    `Date: ${data.issuedAt.toLocaleDateString('en-US')}`,
    ...(data.dueDate ? [`Due Date: ${data.dueDate.toLocaleDateString('en-US')}`] : [])
  ]
  
  invoiceDetails.forEach(detail => {
    const [label, value] = detail.split(': ')
    doc.setTextColor(...mediumGray)
    doc.text(`${label}:`, pageWidth - 120, invoiceYPos, { align: 'left' })
    doc.setTextColor(...darkGray)
    doc.text(value, pageWidth - 20, invoiceYPos, { align: 'right' })
    invoiceYPos += 5
  })
  
  yPos = Math.max(yPos, invoiceYPos) + 10
  
  // Header border
  doc.line(20, yPos, pageWidth - 20, yPos)
  yPos += 15
  
  // Bill To Section (with gray background)
  doc.setFillColor(...lightGray)
  doc.rect(20, yPos - 5, pageWidth - 40, 35, 'F')
  
  // Bill To (Left)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...darkGray)
  doc.text('BILL TO:', 25, yPos)
  
  yPos += 6
  doc.setFontSize(10)
  doc.text(data.customerName, 25, yPos)
  
  yPos += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...mediumGray)
  
  if (data.customerAddress) {
    const customerAddressLines = data.customerAddress.split('\n')
    customerAddressLines.forEach(line => {
      doc.text(line, 25, yPos)
      yPos += 4
    })
  }
  
  // Payment Terms (Right)
  let paymentYPos = yPos - 25
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...darkGray)
  doc.text('PAYMENT TERMS:', 120, paymentYPos)
  
  paymentYPos += 6
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...mediumGray)
  
  const paymentTerms = [
    'Net 30 Days',
    'Payment due within 30 days of invoice date',
    'Late fees may apply after due date'
  ]
  
  paymentTerms.forEach(term => {
    doc.text(term, 120, paymentYPos)
    paymentYPos += 4
  })
  
  yPos += 10
  
  // Line Items Table
  const tableStartY = yPos
  const tableHeaders = [
    { text: 'DESCRIPTION', x: 25, align: 'left' as const },
    { text: 'VEHICLE', x: 80, align: 'left' as const },
    { text: 'QTY', x: 130, align: 'center' as const },
    { text: 'RATE', x: 155, align: 'right' as const },
    { text: 'AMOUNT', x: pageWidth - 25, align: 'right' as const }
  ]
  
  // Table header
  doc.setDrawColor(...mediumGray)
  doc.setLineWidth(1)
  doc.line(20, yPos, pageWidth - 20, yPos)
  yPos += 6
  
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...darkGray)
  
  tableHeaders.forEach(header => {
    doc.text(header.text, header.x, yPos, { align: header.align })
  })
  
  yPos += 3
  doc.line(20, yPos, pageWidth - 20, yPos)
  yPos += 6
  
  // Table rows
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  
  data.lines.forEach((line, index) => {
    // Alternating row background
    if (index % 2 === 0) {
      doc.setFillColor(...lightGray)
      doc.rect(20, yPos - 3, pageWidth - 40, 12, 'F')
    }
    
    doc.setTextColor(...darkGray)
    
    // Description
    const maxDescWidth = 50
    const description = doc.splitTextToSize(line.description, maxDescWidth)
    doc.text(description, 25, yPos)
    
    // Vehicle info
    if (line.vehicle) {
      doc.setFont('helvetica', 'bold')
      doc.text(line.vehicle.vin, 80, yPos)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...mediumGray)
      doc.setFontSize(7)
      const vehicleInfo = `${line.vehicle.year || ''} ${line.vehicle.make || ''} ${line.vehicle.model || ''}`.trim()
      doc.text(vehicleInfo, 80, yPos + 3)
      doc.setFontSize(9)
      doc.setTextColor(...darkGray)
    } else {
      doc.setTextColor(...mediumGray)
      doc.text('—', 80, yPos)
      doc.setTextColor(...darkGray)
    }
    
    // Qty, Rate, Amount
    doc.text(line.qty.toString(), 130, yPos, { align: 'center' })
    
    const currency = data.currency || 'USD'
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2
      }).format(amount)
    }
    
    doc.text(formatCurrency(line.unitPrice), 155, yPos, { align: 'right' })
    
    doc.setFont('helvetica', 'bold')
    doc.text(formatCurrency(line.total), pageWidth - 25, yPos, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    
    yPos += Math.max(8, description.length * 4)
  })
  
  yPos += 5
  doc.line(20, yPos, pageWidth - 20, yPos)
  yPos += 15
  
  // Totals Section
  const totalsX = 140
  const currency = data.currency || 'USD'
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount)
  }
  
  doc.setFontSize(9)
  doc.setTextColor(...mediumGray)
  
  // Subtotal
  doc.text('Subtotal:', totalsX, yPos, { align: 'right' })
  doc.setTextColor(...darkGray)
  doc.text(formatCurrency(data.subtotal), pageWidth - 25, yPos, { align: 'right' })
  yPos += 6
  
  // Tax
  doc.setTextColor(...mediumGray)
  doc.text('Tax:', totalsX, yPos, { align: 'right' })
  doc.setTextColor(...darkGray)
  doc.text(formatCurrency(data.tax || 0), pageWidth - 25, yPos, { align: 'right' })
  yPos += 8
  
  // Total line
  doc.setDrawColor(...mediumGray)
  doc.line(totalsX + 5, yPos, pageWidth - 25, yPos)
  yPos += 8
  
  // Total Due
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...darkGray)
  doc.text('Total Due:', totalsX, yPos, { align: 'right' })
  doc.setTextColor(...blueAccent)
  doc.text(formatCurrency(data.total), pageWidth - 25, yPos, { align: 'right' })
  
  yPos += 20
  
  // Notes and Payment Instructions (if space allows)
  if (yPos < pageHeight - 80) {
    doc.setFillColor(...lightGray)
    doc.rect(20, yPos, pageWidth - 40, 50, 'F')
    
    yPos += 8
    
    // Notes section (if notes exist)
    if (data.notes) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...darkGray)
      doc.text('NOTES:', 25, yPos)
      
      yPos += 6
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...mediumGray)
      const notesWrapped = doc.splitTextToSize(data.notes, 70)
      doc.text(notesWrapped, 25, yPos)
      
      yPos = Math.max(yPos + notesWrapped.length * 4, yPos + 15)
    }
    
    // Payment Instructions (Right side)
    let paymentInstrYPos = yPos - (data.notes ? 35 : 27)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...darkGray)
    doc.text('PAYMENT INSTRUCTIONS:', 120, paymentInstrYPos)
    
    paymentInstrYPos += 6
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...mediumGray)
    
    const paymentInstructions = [
      'Wire Transfer:',
      'Bank: First National Bank',
      'Account: 1234567890',
      'Routing: 987654321',
      '',
      'Please include invoice number in payment reference.'
    ]
    
    paymentInstructions.forEach(instruction => {
      doc.text(instruction, 120, paymentInstrYPos)
      paymentInstrYPos += 4
    })
    
    yPos = Math.max(yPos + 10, paymentInstrYPos + 5)
  }
  
  // Footer
  const footerY = pageHeight - 20
  doc.setFillColor(...darkBackground)
  doc.rect(20, footerY - 15, pageWidth - 40, 25, 'F')
  
  doc.setTextColor(255, 255, 255) // white text
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Thank you for your business!', pageWidth / 2, footerY - 7, { align: 'center' })
  
  doc.setFontSize(8)
  doc.setTextColor(209, 213, 219) // text-gray-300
  doc.text('Questions about this invoice? Contact us at billing@unitedcars.com or +1 (555) 123-4567', pageWidth / 2, footerY - 2, { align: 'center' })
  
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
  return pdfBuffer
}

export async function generateQuotePDF(data: QuotePDFData): Promise<Buffer> {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(20)
  doc.text('QUOTE', 20, 30)
  
  doc.setFontSize(12)
  doc.text(`Quote #: ${data.quoteNumber}`, 20, 45)
  doc.text(`Date: ${data.issuedAt.toLocaleDateString()}`, 20, 55)
  doc.text(`Valid Until: ${data.validUntil.toLocaleDateString()}`, 20, 65)
  
  // Company info
  doc.setFontSize(14)
  doc.text('From:', 20, 85)
  doc.setFontSize(12)
  doc.text(data.orgName, 20, 95)
  
  // Customer info
  doc.setFontSize(14)
  doc.text('To:', 120, 85)
  doc.setFontSize(12)
  doc.text(data.customerName, 120, 95)
  
  // Quote items
  let yPos = 120
  doc.setFontSize(12)
  doc.text('Service', 20, yPos)
  doc.text('Description', 80, yPos)
  doc.text('Amount', 160, yPos)
  
  yPos += 10
  doc.line(20, yPos - 5, 190, yPos - 5)
  
  data.items.forEach(item => {
    doc.text(item.service, 20, yPos)
    doc.text(item.description, 80, yPos)
    doc.text(`$${item.amount.toFixed(2)}`, 160, yPos)
    yPos += 10
  })
  
  // Total
  yPos += 10
  doc.line(160, yPos - 5, 190, yPos - 5)
  doc.setFontSize(14)
  doc.text(`Total: $${data.total.toFixed(2)}`, 160, yPos)
  
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
  return pdfBuffer
}

export interface PaymentLineItem {
  id: string
  description: string
  amount: number
}

export interface VehicleInvoiceData {
  company: 'united_cars' | 'copart' | 'iaa'
  invoiceNumber: string
  date: Date
  customerType: 'private' | 'legal_entity'
  customerName: string
  documentNumber: string
  street: string
  city: string
  state: string
  postalCode: string
  country: string
  vehicleMake: string
  vehicleModel: string
  vehicleYear: string
  vinNumber: string
  lotStockNumber: string
  memberBuyerNumber?: string
  purposeOfPayment: string
  price: number
  additionalPayments?: PaymentLineItem[]
}

const COMPANY_DETAILS = {
  united_cars: {
    name: 'United Cars LLC',
    tagline: 'Premier Automotive Solutions',
    address: '1234 Auto Plaza Drive',
    cityState: 'Atlanta, GA 30309',
    country: 'United States',
    phone: '+1 (555) 123-4567',
    email: 'billing@unitedcars.com',
    website: 'www.unitedcars.com',
    taxId: 'Tax ID: 12-3456789'
  },
  copart: {
    name: 'Copart Inc.',
    tagline: 'Online Vehicle Auctions',
    address: 'Vehicle Purchase via Copart',
    cityState: 'Online Auto Auction Platform',
    country: 'www.copart.com',
    phone: '+1 (972) 391-5000',
    email: 'customerservice@copart.com',
    website: 'www.copart.com',
    taxId: 'Copart Auction Services'
  },
  iaa: {
    name: 'Insurance Auto Auctions',
    tagline: 'IAA Auction Services',
    address: 'Vehicle Purchase via IAA',
    cityState: 'Insurance Auto Auctions',
    country: 'www.iaai.com',
    phone: '+1 (800) 934-2885',
    email: 'customerservice@iaai.com',
    website: 'www.iaai.com',
    taxId: 'IAA Auction Services'
  }
}

export async function generateVehicleInvoicePDF(data: VehicleInvoiceData): Promise<Buffer> {
  const doc = new jsPDF()
  const companyInfo = COMPANY_DETAILS[data.company]
  const pageWidth = doc.internal.pageSize.getWidth()   // A4: 595.28 points
  const pageHeight = doc.internal.pageSize.getHeight() // A4: 841.89 points
  
  // Debug page dimensions
  console.log('Page dimensions:', pageWidth, 'x', pageHeight)
  
  // Simple, clean styling constants
  const darkGray = [60, 60, 60] as [number, number, number]     // For main text
  const mediumGray = [120, 120, 120] as [number, number, number] // For secondary text
  const lightGray = [240, 240, 240] as [number, number, number]  // For backgrounds
  
  let yPos = 30
  
  // Clean header - simple and professional
  doc.setTextColor(...darkGray)
  doc.setFontSize(20)  // Reduced from 24 for better spacing
  doc.setFont('helvetica', 'bold')
  doc.text('INVOICE', 30, yPos)
  
  // Invoice number and date - clean right alignment
  doc.setFontSize(10)  // Reduced from 11
  doc.setFont('helvetica', 'normal')
  doc.text(`Invoice #: ${data.invoiceNumber}`, pageWidth - 30, yPos - 3, { align: 'right' })
  doc.text(`Date: ${data.date.toLocaleDateString('en-US')}`, pageWidth - 30, yPos + 8, { align: 'right' })
  
  yPos += 30  // More space after header
  
  // Simple separator line
  doc.setDrawColor(200, 200, 200)
  doc.line(30, yPos, pageWidth - 30, yPos)
  
  yPos += 25  // More space after separator
  
  // Store starting position for both columns
  const companyStartY = yPos
  
  // Company Information - Left column
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...darkGray)
  doc.text('FROM', 30, yPos)
  
  yPos += 8
  doc.setFontSize(10)
  doc.text(companyInfo.name, 30, yPos)
  
  yPos += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...mediumGray)
  doc.text(companyInfo.address, 30, yPos)
  yPos += 4
  doc.text(companyInfo.cityState, 30, yPos)
  yPos += 4
  doc.text(companyInfo.country, 30, yPos)
  yPos += 5
  doc.text(`Phone: ${companyInfo.phone}`, 30, yPos)
  yPos += 4
  doc.text(`Email: ${companyInfo.email}`, 30, yPos)
  
  const companyEndY = yPos
  
  // Customer Information - Right column (start from same Y as company)
  let customerYPos = companyStartY
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...darkGray)
  doc.text('BILL TO', 320, customerYPos)  // Within page bounds (pageWidth ~595)
  
  customerYPos += 8
  doc.setFontSize(10)
  doc.text(data.customerName, 320, customerYPos)
  
  customerYPos += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...mediumGray)
  
  // Customer address
  doc.text(data.street, 320, customerYPos)
  customerYPos += 4
  doc.text(`${data.city}, ${data.state} ${data.postalCode}`, 320, customerYPos)
  customerYPos += 4
  doc.text(data.country, 320, customerYPos)
  
  customerYPos += 5
  const customerTypeLabel = data.customerType === 'private' ? 'Individual' : 'Company'
  const documentLabel = data.customerType === 'private' ? 'ID/Passport' : 'Registration'
  doc.text(`${documentLabel}: ${data.documentNumber}`, 320, customerYPos)
  
  // Add member/buyer number if needed
  if (data.memberBuyerNumber) {
    const memberLabel = data.company === 'copart' ? 'Member' : 'Buyer'
    customerYPos += 4
    doc.text(`${memberLabel}: ${data.memberBuyerNumber}`, 320, customerYPos)
  }
  
  // Set yPos to the bottom of whichever column is longer
  yPos = Math.max(companyEndY, customerYPos)
  
  // Vehicle Information - Clean and simple
  yPos += 25  // More space before vehicle section
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...darkGray)
  doc.text('VEHICLE INFORMATION', 30, yPos)
  
  yPos += 10
  
  // Simple light background - ensure it fits within page bounds
  doc.setFillColor(...lightGray)
  doc.rect(30, yPos - 3, Math.min(pageWidth - 60, 535), 22, 'F')  // Max width 535 to stay in bounds
  
  // Vehicle details - clean formatting
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...mediumGray)
  
  doc.text(`Vehicle: ${data.vehicleYear} ${data.vehicleMake} ${data.vehicleModel}`, 35, yPos + 2)
  doc.text(`VIN: ${data.vinNumber}`, 35, yPos + 8)
  doc.text(`Lot/Stock: ${data.lotStockNumber}`, 35, yPos + 14)
  
  yPos += 22
  
  yPos += 25  // More space before services section
  
  // Services - Simple and clean
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...darkGray)
  doc.text('SERVICES', 30, yPos)
  
  yPos += 10
  
  // Simple table header
  doc.setDrawColor(150, 150, 150)
  doc.line(30, yPos, pageWidth - 30, yPos)
  yPos += 8
  
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('Description', 35, yPos)
  doc.text('Amount', Math.min(pageWidth - 50, 545), yPos, { align: 'right' })  // Ensure right alignment stays in bounds
  
  yPos += 5
  doc.line(30, yPos, pageWidth - 30, yPos)
  yPos += 8
  
  // Service items - clean and simple
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...mediumGray)
  
  // Main service
  doc.text(data.purposeOfPayment, 35, yPos)
  doc.text(`$${data.price.toFixed(2)}`, Math.min(pageWidth - 50, 545), yPos, { align: 'right' })
  yPos += 7
  
  // Additional services if any
  if (data.additionalPayments && data.additionalPayments.length > 0) {
    data.additionalPayments.forEach(item => {
      if (item.description && item.amount > 0) {
        doc.text(item.description, 35, yPos)
        doc.text(`$${item.amount.toFixed(2)}`, Math.min(pageWidth - 50, 545), yPos, { align: 'right' })
        yPos += 7
      }
    })
  }
  
  // Calculate total
  const additionalTotal = data.additionalPayments?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0
  const totalAmount = data.price + additionalTotal
  
  // Total - clean emphasis
  yPos += 8
  doc.setDrawColor(100, 100, 100)
  doc.line(Math.min(pageWidth - 110, 485), yPos, Math.min(pageWidth - 30, 565), yPos)
  yPos += 8
  
  doc.setFontSize(11)  // Reduced from 12
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...darkGray)
  doc.text('TOTAL', Math.min(pageWidth - 110, 485), yPos)
  doc.text(`$${totalAmount.toFixed(2)}`, Math.min(pageWidth - 50, 545), yPos, { align: 'right' })
  
  yPos += 15
  
  // Payment Terms (United Cars only) - Simple and clean
  if (data.company === 'united_cars') {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...darkGray)
    doc.text('PAYMENT TERMS', 30, yPos)
    
    yPos += 8
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)  // Smaller text to fit better
    doc.setTextColor(...mediumGray)
    doc.text('Payment is due within 30 days of invoice date.', 30, yPos)
    yPos += 4
    doc.text('Make checks payable to "United Cars LLC".', 30, yPos)
    yPos += 4
    doc.text('For questions, contact our billing department.', 30, yPos)
    
    yPos += 10
  }
  
  // Simple footer - ensure it doesn't go off page
  const footerY = Math.min(Math.max(yPos + 20, pageHeight - 40), pageHeight - 30)
  doc.setDrawColor(200, 200, 200)
  doc.line(30, footerY, Math.min(pageWidth - 30, 565), footerY)
  
  doc.setFontSize(7)  // Smaller footer text
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...mediumGray)
  doc.text('This is a computer-generated invoice.', 30, footerY + 6)
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 30, footerY + 10)
  
  doc.text(companyInfo.website, Math.min(pageWidth - 30, 565), footerY + 6, { align: 'right' })
  doc.text(`Invoice #${data.invoiceNumber}`, Math.min(pageWidth - 30, 565), footerY + 10, { align: 'right' })
  
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
  return pdfBuffer
}