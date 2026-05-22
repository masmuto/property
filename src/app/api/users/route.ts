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

export async function GET() {
  try {
    const supabase = getServerClient()
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    const users = (data as UserRow[]).map(mapUserRow)
    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users, using fallback:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({
      users: [
        { id: 'admin_001', name: 'Admin PropMart', email: 'admin@propmart.id', whatsapp: '81234567890', role: 'admin', avatar: null, active: true, createdAt: new Date().toISOString() },
        { id: 'agent_001', name: 'Rina Sari', email: 'rina@propmart.id', whatsapp: '81345678901', role: 'agent', avatar: null, active: true, createdAt: new Date().toISOString() },
        { id: 'agent_002', name: 'Budi Santoso', email: 'budi@propmart.id', whatsapp: '81456789012', role: 'agent', avatar: null, active: true, createdAt: new Date().toISOString() },
      ],
      _fallback: true,
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, whatsapp, role, avatar } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Nama dan email wajib diisi' }, { status: 400 })
    }

    const supabase = getServerClient()

    // Check duplicate email
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('users')
      .insert({
        name,
        email,
        whatsapp: whatsapp || '',
        role: role || 'agent',
        avatar: avatar || null,
      })
      .select()
      .single()

    if (error) throw error

    const user = mapUserRow(data as UserRow)
    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Gagal membuat user. Pastikan database Supabase sudah terkonfigurasi.' }, { status: 500 })
  }
}
