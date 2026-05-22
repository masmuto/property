#!/bin/bash
# ========================================
# PropMart - Supabase Setup Helper
# ========================================
# This script helps you configure your
# Supabase database connection
# ========================================

set -e

echo "🏠 PropMart - Supabase Setup"
echo "============================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
  echo "❌ .env file not found!"
  exit 1
fi

echo "📋 Current Supabase Configuration:"
echo "   URL: $(grep NEXT_PUBLIC_SUPABASE_URL .env | cut -d= -f2)"
echo ""

echo "🔧 To complete the Supabase setup, follow these steps:"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Run the SQL migration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  1. Open your Supabase Dashboard:"
echo "     https://supabase.com/dashboard/project/alxhqjnpmkzvgparlzrb"
echo ""
echo "  2. Go to SQL Editor (left sidebar)"
echo ""
echo "  3. Click 'New Query'"
echo ""
echo "  4. Copy and paste the contents of supabase-init.sql"
echo ""
echo "  5. Click 'Run' to execute the SQL"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Get your connection strings"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  1. In your Supabase Dashboard, go to Settings > Database"
echo ""
echo "  2. Scroll down to 'Connection string' section"
echo ""
echo "  3. Click 'Connect' at the top of the dashboard"
echo ""
echo "  4. Copy the Session mode connection string (port 5432)"
echo "     This will be your DIRECT_URL"
echo ""
echo "  5. Copy the Transaction mode connection string (port 6543)"
echo "     This will be your DATABASE_URL"
echo ""
echo "  6. Update the username from 'postgres' to 'prisma' in both URLs"
echo "     Example: postgres://prisma.alxhqjnpmkzvgparlzrb:..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3: Update .env file"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  1. Open .env file"
echo ""
echo "  2. Replace DATABASE_URL with your transaction mode string"
echo "     (Make sure it uses port 6543 and has ?pgbouncer=true)"
echo ""
echo "  3. Replace DIRECT_URL with your session mode string"
echo "     (Make sure it uses port 5432)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 4: Generate Prisma client and push schema"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Run the following commands:"
echo ""
echo "    npx prisma generate"
echo "    npx prisma db push"
echo ""
echo "  (If you already ran the SQL in Step 1, tables already exist."
echo "   Prisma will detect them and sync.)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 5: (Optional) Seed the database"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  If you didn't use the SQL seed data in Step 1:"
echo ""
echo "    bun run db:seed"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Setup complete! Start your dev server with: bun run dev"
echo ""

# Try to test the connection
echo "🔍 Testing database connection..."
if npx prisma db execute --stdin <<< "SELECT 1;" 2>/dev/null; then
  echo "✅ Database connection successful!"
else
  echo "⚠️  Database connection failed. Please check your .env configuration."
  echo "   Make sure DATABASE_URL and DIRECT_URL are correctly set."
fi
