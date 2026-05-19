import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const property = await db.property.findUnique({
      where: { id },
      include: { _count: { select: { leads: true } } },
    })
    if (!property) {
      return NextResponse.json({ error: 'Properti tidak ditemukan' }, { status: 404 })
    }
    return NextResponse.json({ property })
  } catch (error) {
    console.error('Error fetching property:', error)
    return NextResponse.json({ error: 'Gagal mengambil data properti' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, description, price, location, city, type, bedrooms, bathrooms, landArea, buildingArea, image, featured, status } = body

    const existing = await db.property.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Properti tidak ditemukan' }, { status: 404 })
    }

    const property = await db.property.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseInt(String(price)) }),
        ...(location !== undefined && { location }),
        ...(city !== undefined && { city }),
        ...(type !== undefined && { type }),
        ...(bedrooms !== undefined && { bedrooms: bedrooms ? parseInt(String(bedrooms)) : null }),
        ...(bathrooms !== undefined && { bathrooms: bathrooms ? parseInt(String(bathrooms)) : null }),
        ...(landArea !== undefined && { landArea: landArea ? parseInt(String(landArea)) : null }),
        ...(buildingArea !== undefined && { buildingArea: buildingArea ? parseInt(String(buildingArea)) : null }),
        ...(image !== undefined && { image }),
        ...(featured !== undefined && { featured: Boolean(featured) }),
        ...(status !== undefined && { status }),
      },
    })

    return NextResponse.json({ property })
  } catch (error) {
    console.error('Error updating property:', error)
    return NextResponse.json({ error: 'Gagal mengupdate properti' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.property.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Properti tidak ditemukan' }, { status: 404 })
    }

    // Delete related leads first
    await db.lead.deleteMany({ where: { propertyId: id } })
    await db.property.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting property:', error)
    return NextResponse.json({ error: 'Gagal menghapus properti' }, { status: 500 })
  }
}
