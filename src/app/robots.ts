import { MetadataRoute } from 'next'
import { getServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function robots(): Promise<MetadataRoute.Robots> {
  let robotsValue = 'index, follow'
  let canonicalUrl = 'https://propmart.id'

  try {
    const supabase = getServerClient()
    const { data: seo } = await supabase
      .from('seo_settings')
      .select('robots, canonical_url')
      .eq('id', 'main')
      .maybeSingle()

    if (seo) {
      robotsValue = seo.robots
      if (seo.canonical_url) canonicalUrl = seo.canonical_url
    }
  } catch {
    // Fallback when database is not available (e.g. during build)
  }

  const isNoIndex = robotsValue.includes('noindex')

  return {
    rules: isNoIndex
      ? { userAgent: '*', disallow: '/' }
      : { userAgent: '*', allow: '/', disallow: ['/api/'] },
    sitemap: `${canonicalUrl}/sitemap.xml`,
  }
}
