import { getServerClient, LeadRow, PropertyRow } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

interface LeadWithPropertyRow extends LeadRow {
  properties: PropertyRow | null
}

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

function leadToCamel(row: LeadWithPropertyRow) {
  return {
    id: row.id,
    name: row.name,
    whatsapp: row.whatsapp,
    propertyType: row.property_type,
    location: row.location,
    dp: row.dp,
    promo: row.promo,
    propertyId: row.property_id,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
    // Map 'properties' (Supabase join) to 'property' (frontend expects singular)
    property: row.properties ? propertyToCamel(row.properties) : null,
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getServerClient()
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
      const { data: propData, error: propError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single()

      if (propError || !propData) {
        return NextResponse.json(
          { error: 'Properti tidak ditemukan' },
          { status: 404 }
        )
      }
      property = propertyToCamel(propData as PropertyRow)
    }

    const insertData = {
      name,
      whatsapp,
      property_type: propertyType || null,
      location: location || null,
      dp: dp || null,
      promo: promo || null,
      property_id: propertyId || null,
      message: message || null,
    }

    const { data, error } = await supabase
      .from('leads')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Supabase error creating lead:', error.message)
      return NextResponse.json(
        { error: 'Gagal menyimpan data lead. Pastikan database Supabase sudah terkonfigurasi.' },
        { status: 500 }
      )
    }

    const lead = {
      id: (data as LeadRow).id,
      name: (data as LeadRow).name,
      whatsapp: (data as LeadRow).whatsapp,
      propertyType: (data as LeadRow).property_type,
      location: (data as LeadRow).location,
      dp: (data as LeadRow).dp,
      promo: (data as LeadRow).promo,
      propertyId: (data as LeadRow).property_id,
      message: (data as LeadRow).message,
      status: (data as LeadRow).status,
      createdAt: (data as LeadRow).created_at,
      property,
    }

    return NextResponse.json({ lead, property }, { status: 201 })
  } catch (error) {
    console.error('Error creating lead:', error)
    return NextResponse.json(
      { error: 'Gagal menyimpan data lead. Pastikan database Supabase sudah terkonfigurasi.' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = getServerClient()

    const { data, error } = await supabase
      .from('leads')
      .select('*, properties(*)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error fetching leads:', error.message)
      return NextResponse.json({ leads: [], _fallback: true })
    }

    const rows = (data as LeadWithPropertyRow[]) || []
    const leads = rows.map(row => leadToCamel(row))

    return NextResponse.json({ leads })
  } catch (error) {
    console.error('Error fetching leads, returning empty:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ leads: [], _fallback: true })
  }
}
