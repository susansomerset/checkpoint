# Canvas Scraper

Automated scraper for Canvas external tool data that the API doesn't provide.

## Overview

This scraper uses Playwright to:
- Log in to Canvas with username/password
- Navigate to external tool pages for each course
- Extract vector and assignment grade data
- Save session state for reuse (faster subsequent runs)

## Setup

### 1. Environment Variables

Create a `.env.local` file in the project root:

```bash
CANVAS_USERNAME=your_username
CANVAS_PASSWORD=your_password
CANVAS_BASE_URL=https://djusd.instructure.com
HEADLESS=true
```

**Note**: Currently hardcoded to scrape course 23758. Dynamic course fetching will be added later.

### 2. Install Dependencies

Playwright is already installed. If you need to reinstall browsers:

```bash
npx playwright install chromium
```

## Usage

### Run the scraper

```bash
npm run scrape:canvas
```

### Run with visible browser (debugging)

```bash
HEADLESS=false npm run scrape:canvas
```

### Clear saved authentication

```bash
npm run scrape:canvas -- --clear-auth
```

### Get JSON output

```bash
npm run scrape:canvas -- --json
```

## File Structure

```
scraper/
├── auth.ts              # Canvas login + session management
├── parsers.ts           # HTML parsing to extract data
├── canvas-scraper.ts    # Main entry point
├── types.ts             # TypeScript interfaces
├── auth-state.json      # Saved session (gitignored)
└── README.md            # This file
```

## How It Works

1. **Authentication**: Logs in once, saves cookies/session state
2. **Reuse**: Subsequent runs reuse the saved session (much faster)
3. **Scraping**: Navigates to each course's external tool page
4. **Parsing**: Extracts assignment data including vectors
5. **Output**: Returns structured data for integration

## Session Management

- Session state is saved in `auth-state.json` (gitignored)
- If session expires, automatically logs in again
- Use `--clear-auth` flag to force fresh login

## Scheduling

This scraper is designed to run via GitHub Actions on a schedule:
- 5:00 AM Pacific (12:00 UTC)
- 5:00 PM Pacific (00:00 UTC next day)

See `.github/workflows/canvas-scraper.yml` for automation setup.

## Debugging

1. Run with `HEADLESS=false` to see the browser
2. Screenshots are saved as `debug-course-{id}.png` in headful mode
3. Check console output for detailed logs

## Next Steps

After scraping, the data needs to be:
1. Transformed to match our internal schema
2. Sent to our API endpoint for storage
3. Integrated with existing student data

## Security

- **Never commit credentials** - use environment variables
- `auth-state.json` is gitignored (contains session cookies)
- Use GitHub Secrets for automation

