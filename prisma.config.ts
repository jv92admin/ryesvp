import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env.local for local development (no-op on Vercel where file doesn't exist)
config({ path: ".env.local" });

// Get DIRECT_URL from process.env (works both locally after dotenv and on Vercel)
const directUrl = process.env.DIRECT_URL;

if (!directUrl) {
  throw new Error("Missing required environment variable: DIRECT_URL");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: directUrl, // Use direct connection for migrations (port 5432)
  },
});

