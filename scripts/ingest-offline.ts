#!/usr/bin/env tsx
/**
 * Offline Ingestion Script
 * 
 * Run this script locally to scrape events and upload them to the database.
 * 
 * Usage:
 *   npm run ingest:offline
 *   npm run ingest:offline -- --venue moody-center
 *   npm run ingest:offline -- --venue paramount
 *   npm run ingest:offline -- --all
 */

import { runAllScrapers, runScraper } from '../src/ingestion/orchestrator';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function main() {
  const args = process.argv.slice(2);
  const venueArg = args.find(arg => arg.startsWith('--venue='));
  const venue = venueArg ? venueArg.split('=')[1] : null;
  const allArg = args.includes('--all');

  console.log('🚀 Starting offline ingestion...\n');

  try {
    if (allArg || !venue) {
      // Run all scrapers
      console.log('Running all scrapers...\n');
      const result = await runAllScrapers();
      
      console.log('\n📊 Summary:');
      console.log(`  Total events found: ${result.summary.totalEvents}`);
      console.log(`  Created: ${result.summary.created}`);
      console.log(`  Updated: ${result.summary.updated}`);
      console.log(`  Errors: ${result.summary.errors.length}`);
      
      if (result.summary.errors.length > 0) {
        console.log('\n❌ Errors:');
        result.summary.errors.forEach(error => console.log(`  - ${error}`));
      }
      
      console.log('\n📋 Scraper Results:');
      result.results.forEach((scraperResult) => {
        console.log(`  ${scraperResult.venueSlug}: ${scraperResult.events.length} events${scraperResult.error ? ` (Error: ${scraperResult.error})` : ''}`);
      });
    } else {
      // Run single scraper
      console.log(`Running scraper: ${venue}\n`);
      const result = await runScraper(venue);
      
      console.log('\n📊 Result:');
      console.log(`  Venue: ${result.venueSlug}`);
      console.log(`  Events found: ${result.events.length}`);
      console.log(`  Source: ${result.source}`);
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
    }
    
    console.log('\n✅ Ingestion complete!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Ingestion failed:', error);
    process.exit(1);
  }
}

main();

