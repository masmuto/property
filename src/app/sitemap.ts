import { db } from '@/lib/db'
import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Get SEO settings for canonical URL
  let seo = null
  try {
    seo = await db.seoSetting.findUnique({ where: { id: 'main' } })
  } catch { /* fallback */ }

  const baseUrl = seo?.canonicalUrl || 'https://propmart.id'

  // Get all active properties
  let properties: { id: string; updatedAt: Date }[] = []
  try {
    properties = await db.property.findMany({
      where: { status: 'active' },
      select: { id: true, updatedAt: true },
    })
  } catch { /* fallback */ }

  const propertyEntries: MetadataRoute.Sitemap = properties.map((property) => ({
    url: `${baseUrl}/property/${property.id}`,
    lastModified: property.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...propertyEntries,
  ]
}
