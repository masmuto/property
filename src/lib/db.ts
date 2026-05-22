import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// For Supabase: DATABASE_URL uses the pooler (port 6543 for transaction mode)
// DIRECT_URL uses the direct connection (port 5432 for migrations)
// Connection pooling is handled by Supavisor on Supabase's side
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
