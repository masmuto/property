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

export async function GET(request: NextRequest) {
  try {
    const supabase = getServerClient()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''
    const city = searchParams.get('city') || ''
    const status = searchParams.get('status') || ''

    let query = supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (search) {
      // Supabase doesn't support OR across multiple columns in a single ilike,
      // so we use .or() with ilike on each column
      query = query.or(
        `title.ilike.%${search}%,location.ilike.%${search}%,city.ilike.%${search}%,description.ilike.%${search}%`
      )
    }

    if (type) {
      query = query.eq('type', type)
    }

    if (city) {
      query = query.ilike('city', `%${city}%`)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase error fetching properties:', error.message)
      return NextResponse.json({ properties: fallbackProperties, _fallback: true })
    }

    const rows = (data as PropertyRow[]) || []

    // Get lead counts for all properties
    const propertyIds = rows.map(r => r.id)
    let leadCounts: Record<string, number> = {}

    if (propertyIds.length > 0) {
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select('property_id')
        .in('property_id', propertyIds)

      if (!leadError && leadData) {
        for (const lead of leadData) {
          if (lead.property_id) {
            leadCounts[lead.property_id] = (leadCounts[lead.property_id] || 0) + 1
          }
        }
      }
    }

    const properties = rows.map(row =>
      propertyToCamel(row, leadCounts[row.id] || 0)
    )

    return NextResponse.json({ properties })
  } catch (error) {
    console.error('Error fetching properties, using fallback data:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ properties: fallbackProperties, _fallback: true })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getServerClient()
    const body = await request.json()
    const { title, description, price, location, city, type, bedrooms, bathrooms, landArea, buildingArea, image, featured, status } = body

    if (!title || !price || !location || !city || !type) {
      return NextResponse.json(
        { error: 'Judul, harga, lokasi, kota, dan jenis wajib diisi' },
        { status: 400 }
      )
    }

    const insertData = {
      title,
      description: description || '',
      price: parseInt(String(price)),
      location,
      city,
      type,
      bedrooms: bedrooms ? parseInt(String(bedrooms)) : null,
      bathrooms: bathrooms ? parseInt(String(bathrooms)) : null,
      land_area: landArea ? parseInt(String(landArea)) : null,
      building_area: buildingArea ? parseInt(String(buildingArea)) : null,
      image: image || '/properties/rumah-1.png',
      featured: Boolean(featured),
      status: status || 'active',
    }

    const { data, error } = await supabase
      .from('properties')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Supabase error creating property:', error.message)
      return NextResponse.json(
        { error: 'Gagal membuat properti. Pastikan database Supabase sudah terkonfigurasi.' },
        { status: 500 }
      )
    }

    const property = propertyToCamel(data as PropertyRow, 0)

    return NextResponse.json({ property }, { status: 201 })
  } catch (error) {
    console.error('Error creating property:', error)
    return NextResponse.json(
      { error: 'Gagal membuat properti. Pastikan database Supabase sudah terkonfigurasi.' },
      { status: 500 }
    )
  }
}
