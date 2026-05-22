import { db } from '../src/lib/db'

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data (order matters due to foreign keys)
  await db.lead.deleteMany()
  await db.property.deleteMany()
  await db.seoSetting.deleteMany()
  await db.user.deleteMany()

  // Seed admin users
  const users = await Promise.all([
    db.user.create({
      data: {
        name: 'Admin PropMart',
        email: 'admin@propmart.id',
        whatsapp: '81234567890',
        role: 'admin',
        active: true,
      },
    }),
    db.user.create({
      data: {
        name: 'Rina Sari',
        email: 'rina@propmart.id',
        whatsapp: '81345678901',
        role: 'agent',
        active: true,
      },
    }),
    db.user.create({
      data: {
        name: 'Budi Santoso',
        email: 'budi@propmart.id',
        whatsapp: '81456789012',
        role: 'agent',
        active: true,
      },
    }),
  ])

  const properties = await db.property.createMany({
    data: [
      {
        title: 'Rumah Modern Minimalist BSD',
        description: 'Rumah modern minimalist dengan desain kontemporer, cocok untuk keluarga muda. Dilengkapi taman depan dan belakang, carport untuk 2 mobil, dan akses mudah ke fasilitas publik.',
        price: 2500,
        location: 'BSD City, Tangerang',
        city: 'Tangerang',
        type: 'Rumah',
        bedrooms: 3,
        bathrooms: 2,
        landArea: 120,
        buildingArea: 90,
        image: '/properties/rumah-1.png',
        featured: true,
        status: 'active',
      },
      {
        title: 'Apartemen CBD Jakarta',
        description: 'Apartemen mewah di jantung kota Jakarta dengan pemandangan skyline yang menakjubkan. Unit fully furnished dengan fasilitas lengkap: kolam renang, gym, dan concierge 24 jam.',
        price: 1800,
        location: 'Sudirman, Jakarta Pusat',
        city: 'Jakarta',
        type: 'Apartemen',
        bedrooms: 2,
        bathrooms: 1,
        landArea: null,
        buildingArea: 65,
        image: '/properties/apartemen-1.png',
        featured: true,
        status: 'active',
      },
      {
        title: 'Villa Tropis Bali',
        description: 'Villa mewah dengan kolam renang private di Bali. Desain tropical modern yang memadukan unsur alami dan kemewahan. Ideal untuk investasi atau tempat tinggal.',
        price: 5800,
        location: 'Canggu, Badung',
        city: 'Bali',
        type: 'Rumah',
        bedrooms: 4,
        bathrooms: 3,
        landArea: 300,
        buildingArea: 200,
        image: '/properties/rumah-2.png',
        featured: true,
        status: 'active',
      },
      {
        title: 'Ruko 3 Lantai Kelapa Gading',
        description: 'Ruko strategis di area komersial Kelapa Gading. Cocok untuk usaha retail, kantor, atau F&B. Akses mudah dan lokasi prime di kawasan bisnis.',
        price: 3200,
        location: 'Kelapa Gading, Jakarta Utara',
        city: 'Jakarta',
        type: 'Ruko',
        bedrooms: null,
        bathrooms: 3,
        landArea: 75,
        buildingArea: 225,
        image: '/properties/ruko-1.png',
        featured: false,
        status: 'active',
      },
      {
        title: 'Tanah Kavling Premium Bogor',
        description: 'Tanah kavling premium di kawasan berkembang Bogor. Cocok untuk investasi jangka panjang atau pembangunan rumah impian. SHM, menghadap utara, dan akses jalan lebar.',
        price: 800,
        location: 'Dramaga, Bogor',
        city: 'Bogor',
        type: 'Tanah',
        bedrooms: null,
        bathrooms: null,
        landArea: 200,
        buildingArea: null,
        image: '/properties/tanah-1.png',
        featured: false,
        status: 'active',
      },
      {
        title: 'Rumah Cluster Surabaya',
        description: 'Rumah cluster dengan keamanan 24 jam di Surabaya barat. Desain tropical modern, taman asri, dan lingkungan keluarga. Dekat sekolah internasional dan mall.',
        price: 1900,
        location: 'Pakuwon City, Surabaya',
        city: 'Surabaya',
        type: 'Rumah',
        bedrooms: 3,
        bathrooms: 2,
        landArea: 100,
        buildingArea: 80,
        image: '/properties/rumah-3.png',
        featured: false,
        status: 'active',
      },
    ],
  })

  // Seed default SEO settings
  await db.seoSetting.upsert({
    where: { id: 'main' },
    update: {},
    create: {
      id: 'main',
      siteName: 'PropMart',
      title: 'PropMart - Temukan Properti Impian Anda',
      description: 'Jual beli properti terpercaya di seluruh Indonesia. Rumah, apartemen, tanah, dan ruko dengan harga terbaik.',
      keywords: 'properti, jual beli rumah, apartemen, tanah, ruko, Indonesia, real estate, KPR',
      ogImage: '/properties/hero-banner.png',
      canonicalUrl: '',
      robots: 'index, follow',
      googleVerification: '',
    },
  })

  console.log(`✅ Seeded ${properties.count} properties, ${users.length} users, and default SEO settings`)
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
