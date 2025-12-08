import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Externalize packages that shouldn't be bundled (keeps binaries intact)
  serverExternalPackages: [
    '@sparticuz/chromium-min',
    'puppeteer-core',
  ],
};

export default nextConfig;
