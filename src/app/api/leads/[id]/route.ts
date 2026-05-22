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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getServerClient()
    const body = await request.json()
    const { status } = body

    // Check if lead exists
    const { data: existing, error: findError } = await supabase
      .from('leads')
      .select('id')
      .eq('id', id)
      .single()

    if (findError || !existing) {
      return NextResponse.json({ error: 'Lead tidak ditemukan' }, { status: 404 })
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (status !== undefined) updateData.status = status

    const { data, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', id)
      .select('*, properties(*)')
      .single()

    if (error) {
      console.error('Supabase error updating lead:', error.message)
      return NextResponse.json({ error: 'Gagal mengupdate lead' }, { status: 500 })
    }

    const lead = leadToCamel(data as LeadWithPropertyRow)

    return NextResponse.json({ lead })
  } catch (error) {
    console.error('Error updating lead:', error)
    return NextResponse.json({ error: 'Gagal mengupdate lead' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = getServerClient()

    // Check if lead exists
    const { data: existing, error: findError } = await supabase
      .from('leads')
      .select('id')
      .eq('id', id)
      .single()

    if (findError || !existing) {
      return NextResponse.json({ error: 'Lead tidak ditemukan' }, { status: 404 })
    }

    const { error: deleteError } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Supabase error deleting lead:', deleteError.message)
      return NextResponse.json({ error: 'Gagal menghapus lead' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting lead:', error)
    return NextResponse.json({ error: 'Gagal menghapus lead' }, { status: 500 })
  }
}
