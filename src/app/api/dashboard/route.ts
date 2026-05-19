import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const [
      totalProperties,
      totalLeads,
      totalUsers,
      newLeads,
      activeProperties,
      soldProperties,
      leadsToday,
    ] = await Promise.all([
      db.property.count(),
      db.lead.count(),
      db.user.count(),
      db.lead.count({ where: { status: 'new' } }),
      db.property.count({ where: { status: 'active' } }),
      db.property.count({ where: { status: 'sold' } }),
      db.lead.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ])

    // Leads by type
    const leadsByType = await db.lead.groupBy({
      by: ['propertyType'],
      _count: true,
      where: { propertyType: { not: null } },
    })

    // Properties by type
    const propertiesByType = await db.property.groupBy({
      by: ['type'],
      _count: true,
    })

    // Recent leads
    const recentLeads = await db.lead.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { property: { select: { title: true } } },
    })

    // Top properties by leads
    const topProperties = await db.property.findMany({
      take: 5,
      include: { _count: { select: { leads: true } } },
      orderBy: { leads: { _count: 'desc' } },
    })

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
      topProperties,
    })
  } catch (error) {
    console.error('Error fetching dashboard:', error)
    return NextResponse.json({ error: 'Gagal mengambil data dashboard' }, { status: 500 })
  }
}
