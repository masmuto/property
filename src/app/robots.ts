import { db } from '@/lib/db'
import { MetadataRoute } from 'next'

export default async function robots(): Promise<MetadataRoute.Robots> {
  let robotsValue = 'index, follow'
  let canonicalUrl = 'https://propmart.id'

  try {
    const seo = await db.seoSetting.findUnique({ where: { id: 'main' } })
    if (seo) {
      robotsValue = seo.robots
      if (seo.canonicalUrl) canonicalUrl = seo.canonicalUrl
    }
  } catch { /* fallback */ }

  const isNoIndex = robotsValue.includes('noindex')

  return {
    rules: isNoIndex
      ? { userAgent: '*', disallow: '/' }
      : { userAgent: '*', allow: '/', disallow: ['/api/'] },
    sitemap: `${canonicalUrl}/sitemap.xml`,
  }
}
