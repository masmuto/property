import { MetadataRoute } from 'next'
import { getServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://propmart.id'

  let propertyEntries: MetadataRoute.Sitemap = []

  try {
    const supabase = getServerClient()

    // Get SEO settings for canonical URL
    const { data: seo } = await supabase
      .from('seo_settings')
      .select('canonical_url')
      .eq('id', 'main')
      .maybeSingle()

    const effectiveBaseUrl = seo?.canonical_url || baseUrl

    // Get all active properties
    const { data: properties } = await supabase
      .from('properties')
      .select('id, updated_at')
      .eq('status', 'active')

    if (properties) {
      propertyEntries = properties.map((property) => ({
        url: `${effectiveBaseUrl}/property/${property.id}`,
        lastModified: new Date(property.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
    }

    return [
      {
        url: effectiveBaseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1,
      },
      ...propertyEntries,
    ]
  } catch {
    // Fallback when database is not available (e.g. during build)
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 1,
      },
    ]
  }
}
