// LLM-based event categorization using OpenAI

import { EventCategory } from '@prisma/client';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

export interface LLMEnrichmentResult {
  category: EventCategory;
  performer: string | null;
  description: string;
  confidence: 'high' | 'medium' | 'low';
}

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIChoice {
  message: {
    content: string;
  };
}

interface OpenAIResponse {
  choices: OpenAIChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const SYSTEM_PROMPT = `You categorize events for a concert/event discovery app in Austin, TX.

Your task: Given event details, determine the category, extract the performer name (if applicable), and write a brief description to help someone decide if they want to attend.

Categories:
- CONCERT: Music performances (bands, solo artists, DJs, orchestras)
- COMEDY: Stand-up comedy, comedy shows
- THEATER: Plays, musicals, dance performances, Broadway shows
- MOVIE: Film screenings, movie events
- SPORTS: Sporting events, games, matches
- FESTIVAL: Multi-day or multi-act festivals
- OTHER: Events that don't fit above categories

Guidelines:
- Use venue context: Stubb's and ACL Live are music venues. Paramount hosts theater and films.
- "Texas" at Moody Center likely means UT Austin sports.
- Extract the main performer/artist name when possible.
- Write descriptions as if helping a friend decide whether to attend.
- Be concise: 1-2 sentences max for description.

Respond ONLY with valid JSON, no other text.`;

function buildUserPrompt(
  title: string,
  venueName: string,
  date: string,
  description?: string | null,
  url?: string | null,
  currentCategory?: string,
  tmClassification?: {
    genre?: string | null;
    subGenre?: string | null;
    segment?: string | null;
  } | null
): string {
  let prompt = `Event: "${title}"
Venue: ${venueName} (Austin, TX)
Date: ${date}`;

  if (description) {
    prompt += `\nEvent Description: ${description}`;
  }
  if (url) {
    prompt += `\nSource URL: ${url}`;
  }
  if (currentCategory && currentCategory !== 'OTHER') {
    prompt += `\nVenue's category guess: ${currentCategory}`;
  }
  
  // Add Ticketmaster classification data if available
  if (tmClassification && (tmClassification.segment || tmClassification.genre)) {
    const tmParts: string[] = [];
    if (tmClassification.segment) tmParts.push(`Segment: ${tmClassification.segment}`);
    if (tmClassification.genre) tmParts.push(`Genre: ${tmClassification.genre}`);
    if (tmClassification.subGenre) tmParts.push(`Sub-genre: ${tmClassification.subGenre}`);
    prompt += `\nTicketmaster classification: ${tmParts.join(', ')}`;
  }

  prompt += `

Respond in JSON:
{
  "category": "CONCERT" | "COMEDY" | "THEATER" | "MOVIE" | "SPORTS" | "FESTIVAL" | "OTHER",
  "performer": "performer/artist name" or null,
  "description": "1-2 sentence description for attendees",
  "confidence": "high" | "medium" | "low"
}`;

  return prompt;
}

/**
 * Call OpenAI API to categorize and describe an event
 */
export async function categorizeWithLLM(
  title: string,
  venueName: string,
  date: string,
  options?: {
    description?: string | null;
    url?: string | null;
    currentCategory?: string;
    tmClassification?: {
      genre?: string | null;
      subGenre?: string | null;
      segment?: string | null;
    } | null;
  }
): Promise<LLMEnrichmentResult | null> {
  if (!OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY not set, skipping LLM enrichment');
    return null;
  }

  const messages: OpenAIMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: buildUserPrompt(
        title,
        venueName,
        date,
        options?.description,
        options?.url,
        options?.currentCategory,
        options?.tmClassification
      ),
    },
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.3, // Lower temperature for more consistent categorization
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return null;
    }

    const data: OpenAIResponse = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      console.error('No content in OpenAI response');
      return null;
    }

    // Log token usage for cost tracking
    if (data.usage) {
      console.log(`  LLM tokens: ${data.usage.prompt_tokens} in, ${data.usage.completion_tokens} out`);
    }

    // Parse JSON response
    const parsed = JSON.parse(content);

    // Validate and normalize the response
    const validCategories: EventCategory[] = [
      'CONCERT', 'COMEDY', 'THEATER', 'MOVIE', 'SPORTS', 'FESTIVAL', 'OTHER'
    ];
    
    const category = validCategories.includes(parsed.category) 
      ? parsed.category as EventCategory
      : 'OTHER';

    return {
      category,
      performer: parsed.performer || null,
      description: parsed.description || '',
      confidence: ['high', 'medium', 'low'].includes(parsed.confidence) 
        ? parsed.confidence 
        : 'medium',
    };
  } catch (error) {
    console.error('LLM categorization error:', error);
    return null;
  }
}

/**
 * Batch categorize multiple events (with rate limiting)
 */
export async function categorizeEventsBatch(
  events: Array<{
    id: string;
    title: string;
    venueName: string;
    date: string;
    description?: string | null;
    url?: string | null;
    currentCategory?: string;
    tmClassification?: {
      genre?: string | null;
      subGenre?: string | null;
      segment?: string | null;
    } | null;
  }>,
  delayMs: number = 200
): Promise<Map<string, LLMEnrichmentResult | null>> {
  const results = new Map<string, LLMEnrichmentResult | null>();

  for (const event of events) {
    const result = await categorizeWithLLM(
      event.title,
      event.venueName,
      event.date,
      {
        description: event.description,
        url: event.url,
        currentCategory: event.currentCategory,
        tmClassification: event.tmClassification,
      }
    );
    results.set(event.id, result);

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  return results;
}

