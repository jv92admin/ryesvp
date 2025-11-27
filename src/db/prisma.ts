import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';

// Ensure environment variables are loaded (Next.js should handle this, but being explicit)
if (typeof window === 'undefined') {
  config({ path: '.env.local' });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // Use DATABASE_URL (pooled connection) for app runtime - DIRECT_URL is only for migrations
  let connectionString = process.env.DATABASE_URL;
  
  // Fallback: try loading from .env.local if not set (Next.js should handle this, but be safe)
  if (!connectionString && typeof window === 'undefined') {
    try {
      const { config } = require('dotenv');
      const result = config({ path: '.env.local' });
      connectionString = process.env.DATABASE_URL;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📝 Loaded .env.local, DATABASE_URL:', connectionString ? 'SET' : 'NOT SET');
      }
    } catch (e) {
      console.warn('⚠️ Could not load .env.local:', e);
    }
  }
  
  if (!connectionString) {
    const error = 'DATABASE_URL environment variable is not set. Make sure .env.local exists and contains DATABASE_URL.';
    console.error('❌', error);
    throw new Error(error);
  }

  // URL-encode the connection string to handle special characters in password
  // Supabase connection strings use format: postgresql://postgres.[PROJECT]:[PASSWORD]@[HOST]:[PORT]/[DB]
  // We need to encode special characters in the password
  let encodedConnectionString = connectionString;
  try {
    // Parse the connection string manually to handle Supabase's format
    // Format: postgresql://postgres.kofjctwacqywsbcgtcwn:PASSWORD@host:port/db
    const match = connectionString.match(/^(postgresql:\/\/)([^:]+):([^@]+)@(.+)$/);
    if (match) {
      const [, protocol, username, password, rest] = match;
      // Check if password contains unencoded special characters
      let decodedPassword: string;
      try {
        decodedPassword = decodeURIComponent(password);
      } catch {
        decodedPassword = password; // If decode fails, assume not encoded
      }
      
      if (decodedPassword === password && /[!@#$%^&*(),.?":{}|<>\[\]\\\/]/.test(password)) {
        // Password needs encoding
        const encodedPassword = encodeURIComponent(password);
        encodedConnectionString = `${protocol}${username}:${encodedPassword}@${rest}`;
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ URL-encoded password in connection string (special chars: $, !, etc.)');
          // Log first few chars of encoded password for debugging (don't log full password!)
          console.log('   Encoded password starts with:', encodedPassword.substring(0, 5) + '...');
        }
      }
    }
  } catch (e) {
    // If parsing fails, use connection string as-is
    console.warn('⚠️ Could not parse connection string for encoding, using as-is');
  }

  // Verify we're using the pooled connection, not direct
  if (encodedConnectionString.includes('db.') && !encodedConnectionString.includes('pooler')) {
    console.warn('⚠️ Warning: DATABASE_URL appears to be a direct connection. Should use pooled connection.');
  }

  // Debug: Log which connection we're using
  if (process.env.NODE_ENV === 'development') {
    const hostMatch = encodedConnectionString.match(/@([^:]+)/);
    console.log('🔗 Prisma using connection host:', hostMatch?.[1] || 'unknown');
  }

  // Parse connection string - Supabase pooled connections use format:
  // postgresql://postgres.[PROJECT_REF]:[PASSWORD]@[HOST]:6543/postgres
  // The pg Pool should handle this, but let's be explicit about SSL
  const poolConfig: any = {
    connectionString: encodedConnectionString,
    max: 10,
    ssl: encodedConnectionString.includes('supabase') 
      ? { rejectUnauthorized: false }
      : undefined,
  };

  try {
    const pool = new Pool(poolConfig);
    const adapter = new PrismaPg(pool);
    
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  } catch (error) {
    console.error('❌ Failed to create Prisma client:', error);
    throw error;
  }
}

// Always recreate in development to pick up env changes, reuse in production
export const prisma = 
  process.env.NODE_ENV === 'production' 
    ? (globalForPrisma.prisma ?? createPrismaClient())
    : createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;

