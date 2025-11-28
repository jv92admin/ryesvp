#!/usr/bin/env npx tsx
/**
 * TM Venue Lookup Script
 * 
 * Queries Ticketmaster for Austin venues to get their IDs.
 * Use this to populate VENUE_TM_MAPPING in src/lib/ticketmaster/venues.ts
 * 
 * Usage:
 *   npx dotenvx run -- npx tsx scripts/lookup-tm-venues.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

const TM_API_KEY = process.env.TICKETMASTER_API_KEY;

if (!TM_API_KEY) {
  console.error('❌ TICKETMASTER_API_KEY not set in .env.local');
  process.exit(1);
}

interface TMVenue {
  id: string;
  name: string;
  city?: { name: string };
  state?: { stateCode: string };
  upcomingEvents?: { _total?: number };
}

interface TMResponse {
  _embedded?: {
    venues?: TMVenue[];
  };
  page?: {
    totalElements: number;
    totalPages: number;
  };
}

async function searchVenues(keyword?: string): Promise<TMVenue[]> {
  const params = new URLSearchParams({
    apikey: TM_API_KEY!,
    city: 'Austin',
    stateCode: 'TX',
    countryCode: 'US',
    size: '50',
    sort: 'relevance,desc',
  });

  if (keyword) {
    params.set('keyword', keyword);
  }

  const url = `https://app.ticketmaster.com/discovery/v2/venues.json?${params}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`TM API error: ${response.status}`);
  }

  const data: TMResponse = await response.json();
  return data._embedded?.venues || [];
}

async function main() {
  console.log('🎫 Ticketmaster Venue Lookup for Austin, TX\n');
  console.log('=' .repeat(60));

  // Our venues to look up
  const ourVenues = [
    { slug: 'moody-center', searchTerms: ['Moody Center'] },
    { slug: 'acl-live', searchTerms: ['ACL Live', 'Moody Theater'] },
    { slug: 'stubbs', searchTerms: ["Stubb's", 'Stubbs'] },
    { slug: 'paramount-theatre', searchTerms: ['Paramount Theatre', 'Paramount Theater'] },
    { slug: 'bass-concert-hall', searchTerms: ['Bass Concert Hall'] },
    { slug: 'long-center', searchTerms: ['Long Center', 'Dell Hall'] },
  ];

  // First, get all Austin venues
  console.log('\n📍 All Austin Venues on Ticketmaster:\n');
  
  const allVenues = await searchVenues();
  
  for (const venue of allVenues.slice(0, 20)) {
    const events = venue.upcomingEvents?._total || 0;
    console.log(`  ${venue.name}`);
    console.log(`    ID: ${venue.id}`);
    console.log(`    Upcoming Events: ${events}`);
    console.log('');
  }

  // Now search for our specific venues
  console.log('=' .repeat(60));
  console.log('\n🔍 Looking up YOUR venues:\n');

  const mappings: Record<string, { id: string; name: string }> = {};

  for (const ourVenue of ourVenues) {
    console.log(`\n${ourVenue.slug}:`);
    
    for (const searchTerm of ourVenue.searchTerms) {
      const results = await searchVenues(searchTerm);
      
      if (results.length > 0) {
        const match = results[0];
        console.log(`  ✓ Found: "${match.name}" (ID: ${match.id})`);
        mappings[ourVenue.slug] = { id: match.id, name: match.name };
        break;
      } else {
        console.log(`  ✗ No results for "${searchTerm}"`);
      }
    }

    // Rate limiting
    await new Promise(r => setTimeout(r, 250));
  }

  // Output the mapping code
  console.log('\n' + '=' .repeat(60));
  console.log('\n📋 Copy this into src/lib/ticketmaster/venues.ts:\n');
  console.log('export const VENUE_TM_MAPPING: Record<string, VenueMapping> = {');
  
  for (const [slug, mapping] of Object.entries(mappings)) {
    console.log(`  '${slug}': {`);
    console.log(`    tmVenueId: '${mapping.id}',`);
    console.log(`    tmVenueName: '${mapping.name}',`);
    console.log(`  },`);
  }
  
  console.log('};');
  console.log('\n✅ Done!\n');
}

main().catch(console.error);

