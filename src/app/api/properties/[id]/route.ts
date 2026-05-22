import { getServerClient, PropertyRow } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { fallbackProperties } from '@/lib/fallback-data'

function propertyToCamel(row: PropertyRow, leadsCount = 0) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: row.price,
    location: row.location,
    city: row.city,
    type: row.type,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    landArea: row.land_area,
    buildingArea: row.building_area,
    image: row.image,
    featured: row.featured,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    _count: { leads: leadsCount },
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getServerClient()

    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      // Check fallback data
      const fallback = fallbackProperties.find(p => p.id === id)
      if (fallback) {
        return NextResponse.json({ property: fallback, _fallback: true })
      }
      return NextResponse.json({ error: 'Properti tidak ditemukan' }, { status: 404 })
    }

    // Get lead count for this property
    const { count, error: countError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('property_id', id)

    const property = propertyToCamel(data as PropertyRow, countError ? 0 : (count || 0))

    return NextResponse.json({ property })
  } catch (error) {
    console.error('Error fetching property, trying fallback:', error instanceof Error ? error.message : 'Unknown error')
    // Check fallback data
    const { id } = await params
    const fallback = fallbackProperties.find(p => p.id === id)
    if (fallback) {
      return NextResponse.json({ property: fallback, _fallback: true })
    }
    return NextResponse.json({ error: 'Gagal mengambil data properti' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getServerClient()
    const body = await request.json()
    const { title, description, price, location, city, type, bedrooms, bathrooms, landArea, buildingArea, image, featured, status } = body

    // Check if property exists
    const { data: existing, error: findError } = await supabase
      .from('properties')
      .select('id')
      .eq('id', id)
      .single()

    if (findError || !existing) {
      return NextResponse.json({ error: 'Properti tidak ditemukan' }, { status: 404 })
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (price !== undefined) updateData.price = parseInt(String(price))
    if (location !== undefined) updateData.location = location
    if (city !== undefined) updateData.city = city
    if (type !== undefined) updateData.type = type
    if (bedrooms !== undefined) updateData.bedrooms = bedrooms ? parseInt(String(bedrooms)) : null
    if (bathrooms !== undefined) updateData.bathrooms = bathrooms ? parseInt(String(bathrooms)) : null
    if (landArea !== undefined) updateData.land_area = landArea ? parseInt(String(landArea)) : null
    if (buildingArea !== undefined) updateData.building_area = buildingArea ? parseInt(String(buildingArea)) : null
    if (image !== undefined) updateData.image = image
    if (featured !== undefined) updateData.featured = Boolean(featured)
    if (status !== undefined) updateData.status = status

    const { data, error } = await supabase
      .from('properties')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Supabase error updating property:', error.message)
      return NextResponse.json({ error: 'Gagal mengupdate properti. Pastikan database Supabase sudah terkonfigurasi.' }, { status: 500 })
    }

    // Get lead count for this property
    const { count } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('property_id', id)

    const property = propertyToCamel(data as PropertyRow, count || 0)

    return NextResponse.json({ property })
  } catch (error) {
    console.error('Error updating property:', error)
    return NextResponse.json({ error: 'Gagal mengupdate properti. Pastikan database Supabase sudah terkonfigurasi.' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getServerClient()

    // Check if property exists
    const { data: existing, error: findError } = await supabase
      .from('properties')
      .select('id')
      .eq('id', id)
      .single()

    if (findError || !existing) {
      return NextResponse.json({ error: 'Properti tidak ditemukan' }, { status: 404 })
    }

    // Delete related leads first
    const { error: leadsDeleteError } = await supabase
      .from('leads')
      .delete()
      .eq('property_id', id)

    if (leadsDeleteError) {
      console.error('Supabase error deleting related leads:', leadsDeleteError.message)
    }

    // Delete the property
    const { error: deleteError } = await supabase
      .from('properties')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Supabase error deleting property:', deleteError.message)
      return NextResponse.json({ error: 'Gagal menghapus properti. Pastikan database Supabase sudah terkonfigurasi.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting property:', error)
    return NextResponse.json({ error: 'Gagal menghapus properti. Pastikan database Supabase sudah terkonfigurasi.' }, { status: 500 })
  }
}
