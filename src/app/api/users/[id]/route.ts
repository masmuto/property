import { getServerClient, UserRow } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

function mapUserRow(row: UserRow) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    whatsapp: row.whatsapp,
    role: row.role,
    avatar: row.avatar,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, email, whatsapp, role, avatar, active } = body

    const supabase = getServerClient()

    // Check if user exists
    const { data: existing, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (fetchError) throw fetchError
    if (!existing) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    // Check duplicate email if email is being changed
    if (email && email !== (existing as UserRow).email) {
      const { data: duplicate } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      if (duplicate) {
        return NextResponse.json({ error: 'Email sudah digunakan' }, { status: 400 })
      }
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (whatsapp !== undefined) updateData.whatsapp = whatsapp
    if (role !== undefined) updateData.role = role
    if (avatar !== undefined) updateData.avatar = avatar
    if (active !== undefined) updateData.active = Boolean(active)

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    const user = mapUserRow(data as UserRow)
    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Gagal mengupdate user' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const supabase = getServerClient()

    // Check if user exists
    const { data: existing, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('id', id)
      .maybeSingle()

    if (fetchError) throw fetchError
    if (!existing) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Gagal menghapus user' }, { status: 500 })
  }
}
