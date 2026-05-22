-- ========================================
-- PropMart Database Schema for Supabase
-- ========================================
-- Run this SQL in the Supabase SQL Editor
-- (Dashboard > SQL Editor > New Query)
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- Table: properties
-- ========================================
CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL, -- in juta (millions IDR)
  location TEXT NOT NULL,
  city TEXT NOT NULL,
  type TEXT NOT NULL, -- Rumah, Apartemen, Tanah, Ruko
  bedrooms INTEGER,
  bathrooms INTEGER,
  land_area INTEGER, -- in m2
  building_area INTEGER, -- in m2
  image TEXT NOT NULL DEFAULT '/properties/rumah-1.png',
  featured BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active', -- active, sold, reserved
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================================
-- Table: leads
-- ========================================
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  property_type TEXT, -- Jenis Properti
  location TEXT, -- Lokasi yang dicari
  dp TEXT, -- DP / Uang Muka
  promo TEXT, -- Kode promo
  property_id TEXT REFERENCES properties(id) ON DELETE SET NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new', -- new, contacted, qualified, closed
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================================
-- Table: users
-- ========================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  whatsapp TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'agent', -- admin, agent
  avatar TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================================
-- Table: seo_settings
-- ========================================
CREATE TABLE IF NOT EXISTS seo_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  site_name TEXT NOT NULL DEFAULT 'PropMart',
  title TEXT NOT NULL DEFAULT 'PropMart - Temukan Properti Impian Anda',
  description TEXT NOT NULL DEFAULT 'Jual beli properti terpercaya di seluruh Indonesia. Rumah, apartemen, tanah, dan ruko dengan harga terbaik.',
  keywords TEXT NOT NULL DEFAULT 'properti, jual beli rumah, apartemen, tanah, ruko, Indonesia, real estate, KPR',
  og_image TEXT NOT NULL DEFAULT '/properties/hero-banner.png',
  canonical_url TEXT NOT NULL DEFAULT '',
  robots TEXT NOT NULL DEFAULT 'index, follow',
  google_verification TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================================
-- Indexes for performance
-- ========================================
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_featured ON properties(featured);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_property_id ON leads(property_id);
CREATE INDEX IF NOT EXISTS idx_leads_property_type ON leads(property_type);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ========================================
-- Disable RLS for development (enable later for production)
-- ========================================
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW Level SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_settings ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anon and authenticated users
-- (Tighten these policies for production)
CREATE POLICY "Allow all on properties" ON properties FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on leads" ON leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on seo_settings" ON seo_settings FOR ALL USING (true) WITH CHECK (true);

-- ========================================
-- Auto-update updated_at trigger
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER seo_settings_updated_at
  BEFORE UPDATE ON seo_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ========================================
-- Seed Data
-- ========================================

-- Users
INSERT INTO users (id, name, email, whatsapp, role, active) VALUES
  ('user_admin_001', 'Admin PropMart', 'admin@propmart.id', '81234567890', 'admin', true),
  ('user_agent_001', 'Rina Sari', 'rina@propmart.id', '81345678901', 'agent', true),
  ('user_agent_002', 'Budi Santoso', 'budi@propmart.id', '81456789012', 'agent', true)
ON CONFLICT (id) DO NOTHING;

-- Properties
INSERT INTO properties (id, title, description, price, location, city, type, bedrooms, bathrooms, land_area, building_area, image, featured, status) VALUES
  ('prop_001', 'Rumah Modern Minimalist BSD', 'Rumah modern minimalist dengan desain kontemporer, cocok untuk keluarga muda. Dilengkapi taman depan dan belakang, carport untuk 2 mobil, dan akses mudah ke fasilitas publik.', 2500, 'BSD City, Tangerang', 'Tangerang', 'Rumah', 3, 2, 120, 90, '/properties/rumah-1.png', true, 'active'),
  ('prop_002', 'Apartemen CBD Jakarta', 'Apartemen mewah di jantung kota Jakarta dengan pemandangan skyline yang menakjubkan. Unit fully furnished dengan fasilitas lengkap: kolam renang, gym, dan concierge 24 jam.', 1800, 'Sudirman, Jakarta Pusat', 'Jakarta', 'Apartemen', 2, 1, NULL, 65, '/properties/apartemen-1.png', true, 'active'),
  ('prop_003', 'Villa Tropis Bali', 'Villa mewah dengan kolam renang private di Bali. Desain tropical modern yang memadukan unsur alami dan kemewahan. Ideal untuk investasi atau tempat tinggal.', 5800, 'Canggu, Badung', 'Bali', 'Rumah', 4, 3, 300, 200, '/properties/rumah-2.png', true, 'active'),
  ('prop_004', 'Ruko 3 Lantai Kelapa Gading', 'Ruko strategis di area komersial Kelapa Gading. Cocok untuk usaha retail, kantor, atau F&B. Akses mudah dan lokasi prime di kawasan bisnis.', 3200, 'Kelapa Gading, Jakarta Utara', 'Jakarta', 'Ruko', NULL, 3, 75, 225, '/properties/ruko-1.png', false, 'active'),
  ('prop_005', 'Tanah Kavling Premium Bogor', 'Tanah kavling premium di kawasan berkembang Bogor. Cocok untuk investasi jangka panjang atau pembangunan rumah impian. SHM, menghadap utara, dan akses jalan lebar.', 800, 'Dramaga, Bogor', 'Bogor', 'Tanah', NULL, NULL, 200, NULL, '/properties/tanah-1.png', false, 'active'),
  ('prop_006', 'Rumah Cluster Surabaya', 'Rumah cluster dengan keamanan 24 jam di Surabaya barat. Desain tropical modern, taman asri, dan lingkungan keluarga. Dekat sekolah internasional dan mall.', 1900, 'Pakuwon City, Surabaya', 'Surabaya', 'Rumah', 3, 2, 100, 80, '/properties/rumah-3.png', false, 'active')
ON CONFLICT (id) DO NOTHING;

-- SEO Settings
INSERT INTO seo_settings (id, site_name, title, description, keywords, og_image, canonical_url, robots, google_verification)
VALUES ('main', 'PropMart', 'PropMart - Temukan Properti Impian Anda', 'Jual beli properti terpercaya di seluruh Indonesia. Rumah, apartemen, tanah, dan ruko dengan harga terbaik.', 'properti, jual beli rumah, apartemen, tanah, ruko, Indonesia, real estate, KPR', '/properties/hero-banner.png', '', 'index, follow', '')
ON CONFLICT (id) DO NOTHING;
