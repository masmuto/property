-- ========================================
-- PropMart - Supabase Database Setup
-- ========================================
-- Run this SQL in the Supabase SQL Editor
-- (Dashboard > SQL Editor > New Query)
-- ========================================

-- 1. Create custom Prisma user (recommended by Supabase docs)
CREATE USER "prisma" WITH PASSWORD 'prisma_secure_password_2025' bypassrls createdb;

-- Extend prisma's privileges to postgres
GRANT "prisma" TO "postgres";

-- Grant necessary permissions over the public schema
GRANT usage ON schema public TO prisma;
GRANT create ON schema public TO prisma;
GRANT all ON all tables IN schema public TO prisma;
GRANT all ON all routines IN schema public TO prisma;
GRANT all ON all sequences IN schema public TO prisma;

ALTER default privileges FOR role postgres IN schema public GRANT all ON tables TO prisma;
ALTER default privileges FOR role postgres IN schema public GRANT all ON routines TO prisma;
ALTER default privileges FOR role postgres IN schema public GRANT all ON sequences TO prisma;

-- 2. Create tables

-- Properties table
CREATE TABLE IF NOT EXISTS "properties" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "price" INTEGER NOT NULL,
  "location" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "bedrooms" INTEGER,
  "bathrooms" INTEGER,
  "landArea" INTEGER,
  "buildingArea" INTEGER,
  "image" TEXT NOT NULL,
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "status" TEXT NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- Leads table
CREATE TABLE IF NOT EXISTS "leads" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "whatsapp" TEXT NOT NULL,
  "property_type" TEXT,
  "location" TEXT,
  "dp" TEXT,
  "promo" TEXT,
  "property_id" TEXT,
  "message" TEXT,
  "status" TEXT NOT NULL DEFAULT 'new',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- Users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "whatsapp" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'agent',
  "avatar" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "users_email_key" UNIQUE ("email")
);

-- SEO Settings table
CREATE TABLE IF NOT EXISTS "seo_settings" (
  "id" TEXT NOT NULL,
  "site_name" TEXT NOT NULL DEFAULT 'PropMart',
  "title" TEXT NOT NULL DEFAULT 'PropMart - Temukan Properti Impian Anda',
  "description" TEXT NOT NULL DEFAULT 'Jual beli properti terpercaya di seluruh Indonesia. Rumah, apartemen, tanah, dan ruko dengan harga terbaik.',
  "keywords" TEXT NOT NULL DEFAULT 'properti, jual beli rumah, apartemen, tanah, ruko, Indonesia, real estate, KPR',
  "og_image" TEXT NOT NULL DEFAULT '/properties/hero-banner.png',
  "canonical_url" TEXT NOT NULL DEFAULT '',
  "robots" TEXT NOT NULL DEFAULT 'index, follow',
  "google_verification" TEXT NOT NULL DEFAULT '',
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "seo_settings_pkey" PRIMARY KEY ("id")
);

-- 3. Add foreign key constraint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'leads_property_id_fkey'
  ) THEN
    ALTER TABLE "leads" ADD CONSTRAINT "leads_property_id_fkey"
      FOREIGN KEY ("property_id") REFERENCES "properties"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- 4. Enable RLS (Row Level Security) - required by Supabase for Data API access
ALTER TABLE "properties" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "leads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "seo_settings" ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies (allow public read for properties and seo_settings,
--    authenticated access for leads and users)
-- Properties: anyone can read, only service_role can write
CREATE POLICY "Properties are publicly readable" ON "properties" FOR SELECT USING (true);
CREATE POLICY "Properties insert via service_role" ON "properties" FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Properties update via service_role" ON "properties" FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "Properties delete via service_role" ON "properties" FOR DELETE USING (auth.role() = 'service_role');

-- Leads: anyone can insert (lead capture form), only service_role can read/update/delete
CREATE POLICY "Leads insert by anyone" ON "leads" FOR INSERT WITH CHECK (true);
CREATE POLICY "Leads read via service_role" ON "leads" FOR SELECT USING (auth.role() = 'service_role');
CREATE POLICY "Leads update via service_role" ON "leads" FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "Leads delete via service_role" ON "leads" FOR DELETE USING (auth.role() = 'service_role');

-- Users: only service_role can access
CREATE POLICY "Users read via service_role" ON "users" FOR SELECT USING (auth.role() = 'service_role');
CREATE POLICY "Users insert via service_role" ON "users" FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Users update via service_role" ON "users" FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "Users delete via service_role" ON "users" FOR DELETE USING (auth.role() = 'service_role');

-- SEO Settings: anyone can read, only service_role can write
CREATE POLICY "SEO Settings are publicly readable" ON "seo_settings" FOR SELECT USING (true);
CREATE POLICY "SEO Settings insert via service_role" ON "seo_settings" FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "SEO Settings update via service_role" ON "seo_settings" FOR UPDATE USING (auth.role() = 'service_role');

-- 6. Seed default data

-- Default SEO settings
INSERT INTO "seo_settings" ("id", "site_name", "title", "description", "keywords", "og_image", "canonical_url", "robots", "google_verification")
VALUES (
  'main',
  'PropMart',
  'PropMart - Temukan Properti Impian Anda',
  'Jual beli properti terpercaya di seluruh Indonesia. Rumah, apartemen, tanah, dan ruko dengan harga terbaik.',
  'properti, jual beli rumah, apartemen, tanah, ruko, Indonesia, real estate, KPR',
  '/properties/hero-banner.png',
  '',
  'index, follow',
  ''
) ON CONFLICT ("id") DO NOTHING;

-- Default admin user
INSERT INTO "users" ("id", "name", "email", "whatsapp", "role", "active")
VALUES
  ('admin_001', 'Admin PropMart', 'admin@propmart.id', '81234567890', 'admin', true),
  ('agent_001', 'Rina Sari', 'rina@propmart.id', '81345678901', 'agent', true),
  ('agent_002', 'Budi Santoso', 'budi@propmart.id', '81456789012', 'agent', true)
ON CONFLICT ("email") DO NOTHING;

-- Sample properties
INSERT INTO "properties" ("id", "title", "description", "price", "location", "city", "type", "bedrooms", "bathrooms", "landArea", "buildingArea", "image", "featured", "status")
VALUES
  ('prop_001', 'Rumah Modern Minimalist BSD', 'Rumah modern minimalist dengan desain kontemporer, cocok untuk keluarga muda. Dilengkapi taman depan dan belakang, carport untuk 2 mobil, dan akses mudah ke fasilitas publik.', 2500, 'BSD City, Tangerang', 'Tangerang', 'Rumah', 3, 2, 120, 90, '/properties/rumah-1.png', true, 'active'),
  ('prop_002', 'Apartemen CBD Jakarta', 'Apartemen mewah di jantung kota Jakarta dengan pemandangan skyline yang menakjubkan. Unit fully furnished dengan fasilitas lengkap: kolam renang, gym, dan concierge 24 jam.', 1800, 'Sudirman, Jakarta Pusat', 'Jakarta', 'Apartemen', 2, 1, NULL, 65, '/properties/apartemen-1.png', true, 'active'),
  ('prop_003', 'Villa Tropis Bali', 'Villa mewah dengan kolam renang private di Bali. Desain tropical modern yang memadukan unsur alami dan kemewahan. Ideal untuk investasi atau tempat tinggal.', 5800, 'Canggu, Badung', 'Bali', 'Rumah', 4, 3, 300, 200, '/properties/rumah-2.png', true, 'active'),
  ('prop_004', 'Ruko 3 Lantai Kelapa Gading', 'Ruko strategis di area komersial Kelapa Gading. Cocok untuk usaha retail, kantor, atau F&B. Akses mudah dan lokasi prime di kawasan bisnis.', 3200, 'Kelapa Gading, Jakarta Utara', 'Jakarta', 'Ruko', NULL, 3, 75, 225, '/properties/ruko-1.png', false, 'active'),
  ('prop_005', 'Tanah Kavling Premium Bogor', 'Tanah kavling premium di kawasan berkembang Bogor. Cocok untuk investasi jangka panjang atau pembangunan rumah impian. SHM, menghadap utara, dan akses jalan lebar.', 800, 'Dramaga, Bogor', 'Bogor', 'Tanah', NULL, NULL, 200, NULL, '/properties/tanah-1.png', false, 'active'),
  ('prop_006', 'Rumah Cluster Surabaya', 'Rumah cluster dengan keamanan 24 jam di Surabaya barat. Desain tropical modern, taman asri, dan lingkungan keluarga. Dekat sekolah internasional dan mall.', 1900, 'Pakuwon City, Surabaya', 'Surabaya', 'Rumah', 3, 2, 100, 80, '/properties/rumah-3.png', false, 'active')
ON CONFLICT ("id") DO NOTHING;

-- ========================================
-- Setup Complete!
-- ========================================
-- Next steps:
-- 1. Copy the Prisma connection string from Supabase Dashboard > Settings > Database
-- 2. Update your .env file with the DATABASE_URL and DIRECT_URL
-- 3. Run: npx prisma generate
-- 4. Your app is ready!
-- ========================================
