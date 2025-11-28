# Scripts

Scripts for ingestion, enrichment, and data management.

---

## Event Ingestion

These scripts allow you to run event ingestion locally and upload results to your database.

## Why Offline Ingestion?

- **Puppeteer Support**: Puppeteer (used for Paramount Theatre) works better in local environments than serverless
- **Resource Control**: Run scrapers on your own machine with full control
- **Low Frequency**: Perfect for running every few days manually
- **Debugging**: Easier to debug and test locally

## Usage

### Run All Scrapers

```bash
npm run ingest:all
```

This will:
- Run Moody Center scraper
- Run Paramount Theatre scraper (uses Puppeteer)
- Upload all events to your database
- Show a summary of results

### Run Individual Scraper

```bash
# Moody Center only
npm run ingest:moody

# Paramount Theatre only
npm run ingest:paramount
```

### Custom Venue

```bash
npm run ingest:offline -- --venue=moody-center
npm run ingest:offline -- --venue=paramount
```

## Output

The script will show:
- Number of events found per venue
- How many were created vs updated
- Any errors encountered
- Summary statistics

Example output:
```
🚀 Starting offline ingestion...

Running all scrapers...

Running scraper: Moody Center
Moody Center: Found 70 events
  Found 70 events
Running scraper: Paramount Theatre
Paramount Theatre: Found 15 events
  Found 15 events

📊 Summary:
  Total events found: 85
  Created: 57
  Updated: 28
  Errors: 0

📋 Scraper Results:
  moody-center: 70 events
  paramount-theatre: 15 events

✅ Ingestion complete!
```

## Scheduling

You can schedule this to run automatically on your local machine:

### Windows (Task Scheduler)
1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (e.g., daily at 3 AM)
4. Action: Start a program
5. Program: `npm`
6. Arguments: `run ingest:all`
7. Start in: `C:\Projects\ryesvp`

### macOS/Linux (Cron)
Add to crontab (`crontab -e`):
```bash
# Run every 2 days at 3 AM
0 3 */2 * * cd /path/to/ryesvp && npm run ingest:all >> /path/to/logs/ingestion.log 2>&1
```

## Requirements

- Node.js installed
- `.env.local` file with database credentials
- Internet connection (for scraping)
- For Paramount: Puppeteer will download Chromium on first run (~170MB)

## Troubleshooting

**Puppeteer fails to launch:**
- Make sure you have the required system dependencies
- On Linux, you may need: `sudo apt-get install -y libgbm-dev`

**No events found:**
- Check that the venue websites are accessible
- For Paramount, ensure Puppeteer can launch (may take longer first time)
- Check console output for specific errors

**Database connection errors:**
- Verify `.env.local` has correct `DATABASE_URL`
- Ensure database is accessible from your network

---

## Data Enrichment

### LLM + Spotify + Knowledge Graph

```bash
npx dotenvx run -- npx tsx scripts/enrich-events.ts [--limit=N] [--force]
```

Options:
- `--limit=N` - Maximum events to process (default: 50)
- `--force` - Re-process all events, even those already enriched

### Ticketmaster Enrichment

Matches events to Ticketmaster and adds pricing, buy links, presales, etc.

**Two-step process: Download cache, then match offline**

```bash
# Step 1: Download all TM events to cache (6 API calls total, ~30 sec)
npx tsx scripts/download-tm-cache.ts [--months=6]

# Step 2: Match our events against cache (no API calls, instant)
npx tsx scripts/enrich-tm-from-cache.ts [--limit=N] [--venue=slug] [--dry-run]
```

**Setup (one-time):**
1. Get a free API key at [developer.ticketmaster.com](https://developer.ticketmaster.com/)
2. Add to `.env.local`: `TICKETMASTER_API_KEY=your_key_here`
3. Run `npx tsx scripts/lookup-tm-venues.ts` to get TM venue IDs
4. Update `src/lib/ticketmaster/venues.ts` with the IDs

**Cache Strategy:**
- `download-tm-cache.ts` fetches ALL events at our venues (next 6 months)
- Stored in `TMEventCache` table
- `enrich-tm-from-cache.ts` matches offline (no API rate limits)
- Re-run cache download daily/weekly to keep prices fresh

---

## Other Scripts

### Delete Mock Events
```bash
npx dotenvx run -- npx tsx scripts/delete-mock-events.ts
```

### Delete Seed Events
```bash
npx dotenvx run -- npx tsx scripts/delete-seed-events.ts
```

