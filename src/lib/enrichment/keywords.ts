// Keyword extraction from event titles for API searches

const REMOVE_PATTERNS = [
  /\s+at\s+.+$/i,              // "at Moody Center"
  /^an evening with\s+/i,      // "An Evening with"
  /^a night with\s+/i,         // "A Night with"
  /\s*:\s*.+tour.*/i,          // ": Baby J Tour"
  /\s*-\s*.+tour.*/i,          // "- World Tour 2024"
  /\s+tour\s*$/i,              // "...Tour"
  /\s*live\s*(in\s+.+)?$/i,    // "Live in Austin", "Live"
  /\s*presents?\s*/i,          // "presents"
  /\([^)]*\)/g,                // (anything in parens)
  /\[[^\]]*\]/g,               // [anything in brackets]
  /\s*\d{4}\s*$/,              // trailing year "2024"
  /\s*-\s*\d{1,2}\/\d{1,2}.*/i, // date patterns "- 12/15..."
];

const SPLIT_PATTERNS = [
  /\s+with\s+/i,               // "A with B"
  /\s+feat\.?\s+/i,            // "A feat. B"
  /\s+featuring\s+/i,          // "A featuring B"
  /\s+ft\.?\s+/i,              // "A ft. B"
  /\s+&\s+/,                   // "A & B"
  /\s+vs\.?\s+/i,              // "A vs B" (sports)
  /\s+versus\s+/i,             // "A versus B"
];

// Words that shouldn't be split on "and" (band names, etc.)
const PROTECTED_PHRASES = [
  'mumford and sons',
  'florence and the machine',
  'earth wind and fire',
  'earth, wind and fire',
  'simon and garfunkel',
  'hall and oates',
  'guns n roses',
  'ac/dc',
];

/**
 * Extract searchable keywords from an event title
 * Returns array of keywords, primary first
 */
export function extractKeywords(title: string, venueName?: string): string[] {
  let cleaned = title.trim();
  
  // Check for protected phrases first
  const lowerTitle = cleaned.toLowerCase();
  for (const phrase of PROTECTED_PHRASES) {
    if (lowerTitle.includes(phrase)) {
      // Return the protected phrase as-is
      return [cleaned];
    }
  }
  
  // Remove venue name if present
  if (venueName) {
    cleaned = cleaned.replace(new RegExp(escapeRegex(venueName), 'gi'), '');
  }
  
  // Apply remove patterns
  for (const pattern of REMOVE_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  // Trim and check if anything left
  cleaned = cleaned.trim();
  if (!cleaned || cleaned.length < 3) {
    return [];
  }
  
  // Split on featuring patterns
  let keywords = [cleaned];
  for (const pattern of SPLIT_PATTERNS) {
    keywords = keywords.flatMap(k => k.split(pattern).map(s => s.trim()));
  }
  
  // Filter empty, too short, and clean up
  return keywords
    .map(k => k.trim())
    .filter(k => k.length > 2)
    .map(k => normalizeKeyword(k));
}

/**
 * Normalize a keyword for consistent searching
 */
function normalizeKeyword(keyword: string): string {
  return keyword
    .replace(/\s+/g, ' ')  // Collapse whitespace
    .trim();
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get the primary keyword (most likely the main artist/performer)
 */
export function getPrimaryKeyword(title: string, venueName?: string): string | null {
  const keywords = extractKeywords(title, venueName);
  return keywords.length > 0 ? keywords[0] : null;
}

