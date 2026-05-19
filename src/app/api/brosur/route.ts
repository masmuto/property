import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

function formatPrice(priceInJuta: number): string {
  if (priceInJuta >= 1000) {
    return `Rp ${(priceInJuta / 1000).toFixed(priceInJuta % 1000 === 0 ? 0 : 1)} Miliar`
  }
  return `Rp ${priceInJuta.toLocaleString('id-ID')} Juta`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('id')

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID required' }, { status: 400 })
    }

    const property = await db.property.findUnique({ where: { id: propertyId } })
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Generate PDF brochure
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842]) // A4 size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // Colors
    const emerald = rgb(0.05, 0.6, 0.35)
    const darkGray = rgb(0.2, 0.2, 0.2)
    const lightGray = rgb(0.6, 0.6, 0.6)
    const white = rgb(1, 1, 1)
    const lightBg = rgb(0.96, 0.99, 0.96)

    const W = 595
    let y = 842

    // Header bar
    page.drawRectangle({ x: 0, y: y - 60, width: W, height: 60, color: emerald })
    page.drawText('PropMart', { x: 30, y: y - 40, size: 24, font: fontBold, color: white })
    page.drawText('Brosur Properti', { x: W - 170, y: y - 40, size: 14, font: font, color: white })
    y -= 60

    // Property title
    y -= 40
    const title = property.title.length > 30 ? property.title.substring(0, 30) + '...' : property.title
    page.drawText(title, { x: 30, y, size: 22, font: fontBold, color: darkGray })
    y -= 25

    // Type badge
    page.drawRectangle({ x: 30, y: y - 16, width: 90, height: 20, color: emerald })
    page.drawText(property.type, { x: 42, y: y - 12, size: 11, font: fontBold, color: white })
    if (property.featured) {
      page.drawRectangle({ x: 130, y: y - 16, width: 80, height: 20, color: rgb(0.9, 0.7, 0) })
      page.drawText('Unggulan', { x: 140, y: y - 12, size: 11, font: fontBold, color: white })
    }
    y -= 35

    // Price
    page.drawText(formatPrice(property.price), { x: 30, y, size: 20, font: fontBold, color: emerald })
    y -= 30

    // Location
    page.drawText(`${property.location}, ${property.city}`, { x: 30, y, size: 12, font: font, color: lightGray })
    y -= 40

    // Separator
    page.drawLine({ start: { x: 30, y }, end: { x: W - 30, y }, thickness: 1, color: rgb(0.9, 0.9, 0.9) })
    y -= 25

    // Description section
    page.drawText('Deskripsi', { x: 30, y, size: 14, font: fontBold, color: darkGray })
    y -= 20

    const descLines = wrapText(property.description, font, 11, W - 60)
    for (const line of descLines.slice(0, 8)) {
      page.drawText(line, { x: 30, y, size: 11, font: font, color: rgb(0.4, 0.4, 0.4) })
      y -= 16
    }
    y -= 15

    // Specs section
    page.drawText('Spesifikasi', { x: 30, y, size: 14, font: fontBold, color: darkGray })
    y -= 25

    const specs: [string, string][] = []
    if (property.bedrooms !== null) specs.push(['Kamar Tidur', `${property.bedrooms}`])
    if (property.bathrooms !== null) specs.push(['Kamar Mandi', `${property.bathrooms}`])
    if (property.landArea !== null) specs.push(['Luas Tanah', `${property.landArea} m²`])
    if (property.buildingArea !== null) specs.push(['Luas Bangunan', `${property.buildingArea} m²`])
    specs.push(['Jenis', property.type])
    specs.push(['Lokasi', property.location])

    for (const [label, value] of specs) {
      page.drawRectangle({ x: 30, y: y - 14, width: W - 60, height: 22, color: lightBg })
      page.drawText(label, { x: 40, y: y - 9, size: 11, font: font, color: rgb(0.4, 0.4, 0.4) })
      page.drawText(value, { x: W - 40 - font.widthOfTextAtSize(value, 11), y: y - 9, size: 11, font: fontBold, color: darkGray })
      y -= 26
    }
    y -= 15

    // KPR Simulation section
    page.drawText('Simulasi KPR', { x: 30, y, size: 14, font: fontBold, color: darkGray })
    y -= 25

    const priceRp = property.price * 1_000_000
    const dpPct = 20
    const dpRp = priceRp * (dpPct / 100)
    const loanAmount = priceRp - dpRp
    const tenorYears = 20
    const annualRate = 7.5
    const monthlyRate = annualRate / 100 / 12
    const totalMonths = tenorYears * 12
    const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1)

    const kprInfo: [string, string][] = [
      ['Harga Properti', `Rp ${priceRp.toLocaleString('id-ID')}`],
      ['Uang Muka (20%)', `Rp ${Math.round(dpRp).toLocaleString('id-ID')}`],
      ['Jumlah Pinjaman', `Rp ${Math.round(loanAmount).toLocaleString('id-ID')}`],
      ['Tenor', `${tenorYears} tahun`],
      ['Suku Bunga (fix)', `${annualRate}% per tahun`],
      ['Angsuran/Bulan', `Rp ${Math.round(monthlyPayment).toLocaleString('id-ID')}`],
    ]

    for (const [label, value] of kprInfo) {
      page.drawRectangle({ x: 30, y: y - 14, width: W - 60, height: 22, color: lightBg })
      page.drawText(label, { x: 40, y: y - 9, size: 11, font: font, color: rgb(0.4, 0.4, 0.4) })
      page.drawText(value, { x: W - 40 - font.widthOfTextAtSize(value, 10), y: y - 9, size: 10, font: fontBold, color: label === 'Angsuran/Bulan' ? emerald : darkGray })
      y -= 26
    }

    // Footer
    y = 50
    page.drawLine({ start: { x: 30, y: y + 20 }, end: { x: W - 30, y: y + 20 }, thickness: 1, color: rgb(0.9, 0.9, 0.9) })
    page.drawText('PropMart - Jual beli properti terpercaya di seluruh Indonesia', { x: 30, y, size: 9, font: font, color: lightGray })
    page.drawText('wa.me/6281234567890', { x: W - 140, y, size: 9, font: font, color: emerald })

    const pdfBytes = await pdfDoc.save()

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="brosur-${property.title.replace(/\s+/g, '-').toLowerCase()}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generating brochure:', error)
    return NextResponse.json({ error: 'Gagal membuat brosur' }, { status: 500 })
  }
}

function wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const testWidth = font.widthOfTextAtSize(testLine, fontSize)
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) lines.push(currentLine)
  return lines
}
