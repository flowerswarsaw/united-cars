import { jsPDF } from 'jspdf'

export interface InvoicePDFData {
  invoiceNumber: string
  issuedAt: Date
  orgName: string
  orgAddress?: string
  customerName: string
  customerAddress?: string
  total: number
  subtotal: number
  tax?: number
  lines: Array<{
    description: string
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
  
  // Header
  doc.setFontSize(20)
  doc.text('INVOICE', 20, 30)
  
  doc.setFontSize(12)
  doc.text(`Invoice #: ${data.invoiceNumber}`, 20, 45)
  doc.text(`Date: ${data.issuedAt.toLocaleDateString()}`, 20, 55)
  
  // Company info
  doc.setFontSize(14)
  doc.text('From:', 20, 75)
  doc.setFontSize(12)
  doc.text(data.orgName, 20, 85)
  if (data.orgAddress) {
    doc.text(data.orgAddress, 20, 95)
  }
  
  // Customer info
  doc.setFontSize(14)
  doc.text('To:', 120, 75)
  doc.setFontSize(12)
  doc.text(data.customerName, 120, 85)
  if (data.customerAddress) {
    doc.text(data.customerAddress, 120, 95)
  }
  
  // Line items
  let yPos = 120
  doc.setFontSize(12)
  doc.text('Description', 20, yPos)
  doc.text('Qty', 120, yPos)
  doc.text('Unit Price', 140, yPos)
  doc.text('Total', 170, yPos)
  
  yPos += 10
  doc.line(20, yPos - 5, 190, yPos - 5)
  
  data.lines.forEach(line => {
    doc.text(line.description, 20, yPos)
    doc.text(line.qty.toString(), 120, yPos)
    doc.text(`$${line.unitPrice.toFixed(2)}`, 140, yPos)
    doc.text(`$${line.total.toFixed(2)}`, 170, yPos)
    yPos += 10
  })
  
  // Totals
  yPos += 10
  doc.line(140, yPos - 5, 190, yPos - 5)
  doc.text(`Subtotal: $${data.subtotal.toFixed(2)}`, 140, yPos)
  
  if (data.tax && data.tax > 0) {
    yPos += 10
    doc.text(`Tax: $${data.tax.toFixed(2)}`, 140, yPos)
  }
  
  yPos += 10
  doc.setFontSize(14)
  doc.text(`Total: $${data.total.toFixed(2)}`, 140, yPos)
  
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