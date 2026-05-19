import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// Default SEO settings
const DEFAULT_SEO = {
  id: 'main',
  siteName: 'PropMart',
  title: 'PropMart - Temukan Properti Impian Anda',
  description: 'Jual beli properti terpercaya di seluruh Indonesia. Rumah, apartemen, tanah, dan ruko dengan harga terbaik.',
  keywords: 'properti, jual beli rumah, apartemen, tanah, ruko, Indonesia, real estate, KPR',
  ogImage: '/properties/hero-banner.png',
  canonicalUrl: '',
  robots: 'index, follow',
  googleVerification: '',
}

export async function GET() {
  try {
    let seo = await db.seoSetting.findUnique({ where: { id: 'main' } })
    if (!seo) {
      seo = await db.seoSetting.create({ data: DEFAULT_SEO })
    }
    return NextResponse.json({ seo })
  } catch (error) {
    console.error('Error fetching SEO settings:', error)
    return NextResponse.json({ seo: DEFAULT_SEO })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { siteName, title, description, keywords, ogImage, canonicalUrl, robots, googleVerification } = body

    // Upsert: create if not exists, update if exists
    const seo = await db.seoSetting.upsert({
      where: { id: 'main' },
      update: {
        ...(siteName !== undefined && { siteName }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(keywords !== undefined && { keywords }),
        ...(ogImage !== undefined && { ogImage }),
        ...(canonicalUrl !== undefined && { canonicalUrl }),
        ...(robots !== undefined && { robots }),
        ...(googleVerification !== undefined && { googleVerification }),
      },
      create: {
        id: 'main',
        siteName: siteName || DEFAULT_SEO.siteName,
        title: title || DEFAULT_SEO.title,
        description: description || DEFAULT_SEO.description,
        keywords: keywords || DEFAULT_SEO.keywords,
        ogImage: ogImage || DEFAULT_SEO.ogImage,
        canonicalUrl: canonicalUrl || '',
        robots: robots || DEFAULT_SEO.robots,
        googleVerification: googleVerification || '',
      },
    })

    return NextResponse.json({ seo })
  } catch (error) {
    console.error('Error updating SEO settings:', error)
    return NextResponse.json({ error: 'Gagal mengupdate pengaturan SEO' }, { status: 500 })
  }
}
