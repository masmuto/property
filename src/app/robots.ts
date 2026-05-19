import { MetadataRoute } from 'next'

export const dynamic = 'force-dynamic'

export default async function robots(): Promise<MetadataRoute.Robots> {
  let robotsValue = 'index, follow'
  let canonicalUrl = 'https://propmart.id'

  try {
    const { db } = await import('@/lib/db')
    const seo = await db.seoSetting.findUnique({ where: { id: 'main' } })
    if (seo) {
      robotsValue = seo.robots
      if (seo.canonicalUrl) canonicalUrl = seo.canonicalUrl
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
