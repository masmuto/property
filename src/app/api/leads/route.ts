import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, whatsapp, propertyType, location, dp, promo, propertyId, message } = body

    if (!name || !whatsapp) {
      return NextResponse.json(
        { error: 'Nama dan nomor WhatsApp wajib diisi' },
        { status: 400 }
      )
    }

    // Validate property exists if propertyId is provided
    let property = null
    if (propertyId) {
      property = await db.property.findUnique({
        where: { id: propertyId },
      })
      if (!property) {
        return NextResponse.json(
          { error: 'Properti tidak ditemukan' },
          { status: 404 }
        )
      }
    }

    const lead = await db.lead.create({
      data: {
        name,
        whatsapp,
        propertyType: propertyType || null,
        location: location || null,
        dp: dp || null,
        promo: promo || null,
        propertyId: propertyId || null,
        message: message || null,
      },
    })

    return NextResponse.json({ lead, property }, { status: 201 })
  } catch (error) {
    console.error('Error creating lead:', error)
    return NextResponse.json(
      { error: 'Gagal menyimpan data lead' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const leads = await db.lead.findMany({
      orderBy: { createdAt: 'desc' },
      include: { property: true },
    })
    return NextResponse.json({ leads })
  } catch (error) {
    console.error('Error fetching leads:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data lead' },
      { status: 500 }
    )
  }
}
