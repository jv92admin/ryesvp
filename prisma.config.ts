import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Load .env.local explicitly
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DIRECT_URL"), // Use direct connection for migrations (port 5432)
  },
});

