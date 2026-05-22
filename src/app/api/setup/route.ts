import { getServerClient, isSupabaseConfigured } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  // Check if Supabase is configured
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      status: 'not_configured',
      message: 'Supabase URL or key is missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env',
    })
  }

  try {
    const supabase = getServerClient()

    // Check if properties table exists by trying to query it
    const { error: propError } = await supabase
      .from('properties')
      .select('id')
      .limit(1)

    if (propError) {
      const isTableMissing = propError.code === 'PGRST205' || propError.message?.includes('not find the table')

      if (isTableMissing) {
        return NextResponse.json({
          status: 'tables_missing',
          message: 'Database tables have not been created yet. Run the SQL migration in your Supabase SQL Editor.',
          instructions: [
            '1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/alxhqjnpmkzvgparlzrb',
            '2. Navigate to SQL Editor',
            '3. Copy and paste the SQL from: supabase/migrations/001_create_tables.sql',
            '4. Click "Run" to create the tables and seed data',
            '5. Refresh this page to verify',
          ],
          sqlFile: '/supabase/migrations/001_create_tables.sql',
        })
      }

      return NextResponse.json({
        status: 'error',
        message: `Database error: ${propError.message}`,
        hint: 'Check your Supabase configuration and RLS policies.',
      })
    }

    // Tables exist - check data
    const [properties, leads, users, seo] = await Promise.all([
      supabase.from('properties').select('id', { count: 'exact', head: true }),
      supabase.from('leads').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('seo_settings').select('id').eq('id', 'main').maybeSingle(),
    ])

    return NextResponse.json({
      status: 'connected',
      message: 'Supabase is connected and tables exist!',
      counts: {
        properties: properties.count || 0,
        leads: leads.count || 0,
        users: users.count || 0,
        seoConfigured: !!seo.data,
      },
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
  }
}
