import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Client-side Supabase client (uses publishable/anon key)
// This is subject to Row Level Security policies
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

// Server-side admin Supabase client (uses service_role key)
// This bypasses Row Level Security - only use in server-side code
let _supabaseAdmin: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (serviceRoleKey) {
      _supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    } else {
      // Fall back to anon key if service role key is not available
      console.warn('SUPABASE_SERVICE_ROLE_KEY not set, using anon key (RLS policies apply)')
      _supabaseAdmin = supabase
    }
  }
  return _supabaseAdmin
}

// Get the server-side client (prefers admin if available, otherwise anon)
export function getServerClient(): SupabaseClient {
  return getSupabaseAdmin()
}

// Helper to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey)
}

// Type helpers for Supabase tables
export interface PropertyRow {
  id: string
  title: string
  description: string
  price: number
  location: string
  city: string
  type: string
  bedrooms: number | null
  bathrooms: number | null
  land_area: number | null
  building_area: number | null
  image: string
  featured: boolean
  status: string
  created_at: string
  updated_at: string
}

export interface LeadRow {
  id: string
  name: string
  whatsapp: string
  property_type: string | null
  location: string | null
  dp: string | null
  promo: string | null
  property_id: string | null
  message: string | null
  status: string
  created_at: string
}

export interface UserRow {
  id: string
  name: string
  email: string
  whatsapp: string
  role: string
  avatar: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface SeoSettingRow {
  id: string
  site_name: string
  title: string
  description: string
  keywords: string
  og_image: string
  canonical_url: string
  robots: string
  google_verification: string
  updated_at: string
}
