/**
 * Browser utility for Puppeteer that works in both local and serverless environments.
 * 
 * - On Vercel/AWS Lambda: Uses @sparticuz/chromium + puppeteer-core
 * - Locally: Uses regular puppeteer with system Chrome
 */

import type { Browser } from 'puppeteer-core';

/**
 * Launch a browser instance that works in both local and serverless environments.
 * 
 * Usage:
 * ```ts
 * const browser = await launchBrowser();
 * const page = await browser.newPage();
 * // ... use the page
 * await browser.close();
 * ```
 */
export async function launchBrowser(): Promise<Browser> {
  // Check if we're in a serverless environment (Vercel, AWS Lambda)
  const isServerless = !!(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_VERSION ||
    process.env.AWS_EXECUTION_ENV
  );

  if (isServerless) {
    // Serverless environment: use @sparticuz/chromium-min
    const chromium = await import('@sparticuz/chromium-min');
    const puppeteerCore = await import('puppeteer-core');

    return puppeteerCore.default.launch({
      args: chromium.default.args,
      executablePath: await chromium.default.executablePath(),
      headless: true,
    });
  } else {
    // Local environment: use regular puppeteer
    const puppeteer = await import('puppeteer');

    return puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }) as unknown as Browser;
  }
}

