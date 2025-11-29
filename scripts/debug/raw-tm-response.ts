#!/usr/bin/env npx tsx
/**
 * Debug: See raw TM API response for an event
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

const API_KEY = process.env.TICKETMASTER_API_KEY;
const MOODY_VENUE_ID = 'KovZ917ANwG';

async function main() {
  const search = process.argv[2] || 'Billy Strings';
  
  console.log(`🔍 Raw TM API response for: "${search}"\n`);

  const url = new URL('https://app.ticketmaster.com/discovery/v2/events.json');
  url.searchParams.set('apikey', API_KEY!);
  url.searchParams.set('venueId', MOODY_VENUE_ID);
  url.searchParams.set('keyword', search);
  url.searchParams.set('size', '1');

  const res = await fetch(url.toString());
  const data = await res.json();

  const event = data._embedded?.events?.[0];
  
  if (!event) {
    console.log('No event found');
    return;
  }

  console.log('=== EVENT BASICS ===');
  console.log('ID:', event.id);
  console.log('Name:', event.name);
  console.log('URL:', event.url);
  console.log('Source:', event.source ?? 'NOT IN RESPONSE');
  
  console.log('\n=== DATES ===');
  console.log('Start:', event.dates?.start);
  console.log('Status:', event.dates?.status);
  
  console.log('\n=== PRICE RANGES ===');
  console.log('priceRanges:', event.priceRanges ? JSON.stringify(event.priceRanges, null, 2) : 'NOT IN RESPONSE');
  
  console.log('\n=== PRODUCTS (might have pricing) ===');
  console.log('products:', event.products ? JSON.stringify(event.products, null, 2) : 'NOT IN RESPONSE');
  
  console.log('\n=== TICKET LIMIT ===');
  console.log('ticketLimit:', event.ticketLimit ?? 'NOT IN RESPONSE');
  
  console.log('\n=== TICKETING ===');
  console.log('ticketing:', event.ticketing ? JSON.stringify(event.ticketing, null, 2) : 'NOT IN RESPONSE');
  
  console.log('\n=== SALES ===');
  console.log('Public:', event.sales?.public);
  console.log('Presales:', event.sales?.presales?.length ?? 0, 'presales');

  console.log('\n=== RAW KEYS ===');
  console.log('Top-level keys:', Object.keys(event).join(', '));
}

main().catch(console.error);

