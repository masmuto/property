import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    const existing = await db.lead.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Lead tidak ditemukan' }, { status: 404 })
    }

    const lead = await db.lead.update({
      where: { id },
      data: { ...(status !== undefined && { status }) },
      include: { property: true },
    })

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

    const existing = await db.lead.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Lead tidak ditemukan' }, { status: 404 })
    }

    await db.lead.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting lead:', error)
    return NextResponse.json({ error: 'Gagal menghapus lead' }, { status: 500 })
  }
}
