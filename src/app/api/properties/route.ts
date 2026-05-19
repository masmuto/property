import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''
    const city = searchParams.get('city') || ''
    const status = searchParams.get('status') || ''

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { location: { contains: search } },
        { city: { contains: search } },
        { description: { contains: search } },
      ]
    }

    if (type) {
      where.type = type
    }

    if (city) {
      where.city = { contains: city }
    }

    if (status) {
      where.status = status
    }

    const properties = await db.property.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { leads: true } } },
    })

    return NextResponse.json({ properties })
  } catch (error) {
    console.error('Error fetching properties:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data properti' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, price, location, city, type, bedrooms, bathrooms, landArea, buildingArea, image, featured, status } = body

    if (!title || !price || !location || !city || !type) {
      return NextResponse.json(
        { error: 'Judul, harga, lokasi, kota, dan jenis wajib diisi' },
        { status: 400 }
      )
    }

    const property = await db.property.create({
      data: {
        title,
        description: description || '',
        price: parseInt(String(price)),
        location,
        city,
        type,
        bedrooms: bedrooms ? parseInt(String(bedrooms)) : null,
        bathrooms: bathrooms ? parseInt(String(bathrooms)) : null,
        landArea: landArea ? parseInt(String(landArea)) : null,
        buildingArea: buildingArea ? parseInt(String(buildingArea)) : null,
        image: image || '/properties/rumah-1.png',
        featured: Boolean(featured),
        status: status || 'active',
      },
    })

    return NextResponse.json({ property }, { status: 201 })
  } catch (error) {
    console.error('Error creating property:', error)
    return NextResponse.json(
      { error: 'Gagal membuat properti' },
      { status: 500 }
    )
  }
}
