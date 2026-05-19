import { MetadataRoute } from 'next'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://propmart.id'

  let propertyEntries: MetadataRoute.Sitemap = []

  try {
    const { db } = await import('@/lib/db')

    // Get SEO settings for canonical URL
    const seo = await db.seoSetting.findUnique({ where: { id: 'main' } })
    const effectiveBaseUrl = seo?.canonicalUrl || baseUrl

    // Get all active properties
    const properties = await db.property.findMany({
      where: { status: 'active' },
      select: { id: true, updatedAt: true },
    })

    propertyEntries = properties.map((property) => ({
      url: `${effectiveBaseUrl}/property/${property.id}`,
      lastModified: property.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

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
