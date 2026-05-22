import { getServerClient, PropertyRow, LeadRow } from '@/lib/supabase'
import { NextResponse } from 'next/server'

interface LeadWithPropertyRow extends LeadRow {
  properties: { title: string } | null
}

export async function GET() {
  try {
    const supabase = getServerClient()

    // Fetch all data needed for the dashboard in parallel
    const [
      propertiesResult,
      leadsResult,
      usersResult,
    ] = await Promise.all([
      supabase.from('properties').select('*'),
      supabase.from('leads').select('*, properties(title)'),
      supabase.from('users').select('id'),
    ])

    if (propertiesResult.error) throw propertiesResult.error
    if (leadsResult.error) throw leadsResult.error
    if (usersResult.error) throw usersResult.error

    const properties = (propertiesResult.data as PropertyRow[]) || []
    const leads = (leadsResult.data as LeadWithPropertyRow[]) || []
    const users = usersResult.data || []

    // Compute stats
    const totalProperties = properties.length
    const totalLeads = leads.length
    const totalUsers = users.length
    const newLeads = leads.filter(l => l.status === 'new').length
    const activeProperties = properties.filter(p => p.status === 'active').length
    const soldProperties = properties.filter(p => p.status === 'sold').length

    // Leads today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const leadsToday = leads.filter(l => new Date(l.created_at) >= today).length

    // Leads grouped by property type (where property_type is not null)
    const leadsByTypeMap: Record<string, number> = {}
    for (const lead of leads) {
      if (lead.property_type) {
        leadsByTypeMap[lead.property_type] = (leadsByTypeMap[lead.property_type] || 0) + 1
      }
    }
    const leadsByType = Object.entries(leadsByTypeMap).map(([propertyType, count]) => ({
      propertyType,
      _count: count,
    }))

    // Properties grouped by type
    const propertiesByTypeMap: Record<string, number> = {}
    for (const prop of properties) {
      propertiesByTypeMap[prop.type] = (propertiesByTypeMap[prop.type] || 0) + 1
    }
    const propertiesByType = Object.entries(propertiesByTypeMap).map(([type, count]) => ({
      type,
      _count: count,
    }))

    // Recent 5 leads with property info
    const recentLeads = leads
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map(l => ({
        id: l.id,
        name: l.name,
        whatsapp: l.whatsapp,
        propertyType: l.property_type,
        location: l.location,
        dp: l.dp,
        promo: l.promo,
        propertyId: l.property_id,
        message: l.message,
        status: l.status,
        createdAt: l.created_at,
        property: l.properties ? { title: l.properties.title } : null,
      }))

    // Top 5 properties by lead count
    const leadCountsByProperty: Record<string, number> = {}
    for (const lead of leads) {
      if (lead.property_id) {
        leadCountsByProperty[lead.property_id] = (leadCountsByProperty[lead.property_id] || 0) + 1
      }
    }

    // Sort properties by lead count desc and take top 5
    const topPropertyIds = Object.entries(leadCountsByProperty)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id)

    const topProperties = topPropertyIds
      .map(id => {
        const prop = properties.find(p => p.id === id)
        if (!prop) return null
        return {
          id: prop.id,
          title: prop.title,
          description: prop.description,
          price: prop.price,
          location: prop.location,
          city: prop.city,
          type: prop.type,
          bedrooms: prop.bedrooms,
          bathrooms: prop.bathrooms,
          landArea: prop.land_area,
          buildingArea: prop.building_area,
          image: prop.image,
          featured: prop.featured,
          status: prop.status,
          createdAt: prop.created_at,
          updatedAt: prop.updated_at,
          _count: { leads: leadCountsByProperty[id] || 0 },
        }
      })
      .filter(Boolean)

    // If no leads, show top 5 properties with 0 leads
    const finalTopProperties = topProperties.length > 0
      ? topProperties
      : properties.slice(0, 5).map(prop => ({
          id: prop.id,
          title: prop.title,
          description: prop.description,
          price: prop.price,
          location: prop.location,
          city: prop.city,
          type: prop.type,
          bedrooms: prop.bedrooms,
          bathrooms: prop.bathrooms,
          landArea: prop.land_area,
          buildingArea: prop.building_area,
          image: prop.image,
          featured: prop.featured,
          status: prop.status,
          createdAt: prop.created_at,
          updatedAt: prop.updated_at,
          _count: { leads: 0 },
        }))

    return NextResponse.json({
      stats: {
        totalProperties,
        totalLeads,
        totalUsers,
        newLeads,
        activeProperties,
        soldProperties,
        leadsToday,
      },
      leadsByType,
      propertiesByType,
      recentLeads,
      topProperties: finalTopProperties,
    })
  } catch (error) {
    console.error('Error fetching dashboard, using fallback:', error instanceof Error ? error.message : 'Unknown error')
    // Return fallback dashboard data
    return NextResponse.json({
      stats: {
        totalProperties: 6,
        totalLeads: 0,
        totalUsers: 3,
        newLeads: 0,
        activeProperties: 6,
        soldProperties: 0,
        leadsToday: 0,
      },
      leadsByType: [],
      propertiesByType: [
        { type: 'Rumah', _count: 3 },
        { type: 'Apartemen', _count: 1 },
        { type: 'Ruko', _count: 1 },
        { type: 'Tanah', _count: 1 },
      ],
      recentLeads: [],
      topProperties: [],
      _fallback: true,
    })
  }
}
