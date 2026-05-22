import { getServerClient, SeoSettingRow } from '@/lib/supabase'
import { fallbackSeo } from '@/lib/fallback-data'
import { NextRequest, NextResponse } from 'next/server'

// Default SEO settings
const DEFAULT_SEO = { ...fallbackSeo }

function mapSeoRow(row: SeoSettingRow) {
  return {
    id: row.id,
    siteName: row.site_name,
    title: row.title,
    description: row.description,
    keywords: row.keywords,
    ogImage: row.og_image,
    canonicalUrl: row.canonical_url,
    robots: row.robots,
    googleVerification: row.google_verification,
    updatedAt: row.updated_at,
  }
}

export async function GET() {
  try {
    const supabase = getServerClient()
    const { data, error } = await supabase
      .from('seo_settings')
      .select('*')
      .eq('id', 'main')
      .maybeSingle()

    if (error) throw error

    if (!data) {
      // Create default SEO settings if none exist
      const { data: created, error: createError } = await supabase
        .from('seo_settings')
        .insert({
          id: 'main',
          site_name: DEFAULT_SEO.siteName,
          title: DEFAULT_SEO.title,
          description: DEFAULT_SEO.description,
          keywords: DEFAULT_SEO.keywords,
          og_image: DEFAULT_SEO.ogImage,
          canonical_url: DEFAULT_SEO.canonicalUrl || '',
          robots: DEFAULT_SEO.robots,
          google_verification: DEFAULT_SEO.googleVerification || '',
        })
        .select()
        .single()

      if (createError) throw createError

      const seo = mapSeoRow(created as SeoSettingRow)
      return NextResponse.json({ seo })
    }

    const seo = mapSeoRow(data as SeoSettingRow)
    return NextResponse.json({ seo })
  } catch (error) {
    console.error('Error fetching SEO settings, using fallback:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ seo: DEFAULT_SEO, _fallback: true })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { siteName, title, description, keywords, ogImage, canonicalUrl, robots, googleVerification } = body

    const supabase = getServerClient()

    // Build upsert data with snake_case keys for Supabase
    const updateData: Record<string, unknown> = { id: 'main' }
    if (siteName !== undefined) updateData.site_name = siteName
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (keywords !== undefined) updateData.keywords = keywords
    if (ogImage !== undefined) updateData.og_image = ogImage
    if (canonicalUrl !== undefined) updateData.canonical_url = canonicalUrl
    if (robots !== undefined) updateData.robots = robots
    if (googleVerification !== undefined) updateData.google_verification = googleVerification

    const { data, error } = await supabase
      .from('seo_settings')
      .upsert(updateData, { onConflict: 'id' })
      .select()
      .single()

    if (error) throw error

    const seo = mapSeoRow(data as SeoSettingRow)
    return NextResponse.json({ seo })
  } catch (error) {
    console.error('Error updating SEO settings:', error)
    return NextResponse.json({ error: 'Gagal mengupdate pengaturan SEO. Pastikan database Supabase sudah terkonfigurasi.' }, { status: 500 })
  }
}
