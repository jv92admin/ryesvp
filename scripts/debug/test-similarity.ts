#!/usr/bin/env npx tsx
/**
 * Test similarity calculation directly
 */
import { calculateSimilarity } from '../../src/lib/ticketmaster/matcher';

const testCases = [
  // Should be 0 (gender mismatch)
  ['Texas WBB', 'Texas Longhorns Mens Basketball vs. Vanderbilt Commodores Mens Basketball'],
  ['Texas MBB', 'Texas Longhorns Womens Basketball vs. North Carolina'],
  
  // Should match
  ['Texas MBB', 'Texas Longhorns Mens Basketball vs. Texas A&M'],
  ['Texas WBB', 'Texas Longhorns Womens Basketball vs. North Carolina'],
  ['Billy Strings', 'Billy Strings'],
];

console.log('Testing calculateSimilarity:\n');

for (const [our, tm] of testCases) {
  const similarity = calculateSimilarity(our, tm);
  const status = similarity === 0 ? '🚫 REJECT' : `✓ ${(similarity * 100).toFixed(1)}%`;
  console.log(`${status}`);
  console.log(`  Ours: "${our}"`);
  console.log(`  TM:   "${tm}"`);
  console.log('');
}

