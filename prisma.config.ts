import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Load .env.local explicitly
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
    // shadowDatabaseUrl: env("DIRECT_URL"), // Optional - Prisma will use url if not provided
  },
});

