# Canvas Scraper

## Scope

To set one courseID as an optional input parameter, defaulting to 21874, use playwright to browse WITH FIREFOX (Chromium will not work) to authenticate headlessly (if HEADLESS=true) or non-headless (if HEADLESS=false) to CANVAS_LOGIN_URL using CANVAS_USERNAME with CANVAS_PASSWORD from .env.local, and once authentication is successful, navigate to <CANVAS_BASE_URL>/courses/<courseID>. Wait for the content to load, scrape the HTML source into docs/zxq_<courseID>_html.txt (overwrite if necessary) and react page content to docs/zxq_<courseID>_react.txt (overwrite if necessary).

## Environment Variables Required

- `CANVAS_LOGIN_URL` - The Canvas login URL
- `CANVAS_USERNAME` - Canvas username for authentication
- `CANVAS_PASSWORD` - Canvas password for authentication
- `CANVAS_BASE_URL` - Base URL for Canvas instance
- `HEADLESS` - Set to "true" for headless mode, "false" for visible browser

## Usage

```bash
npm run scrape [courseID]
```

If no courseID is provided, defaults to 21874.