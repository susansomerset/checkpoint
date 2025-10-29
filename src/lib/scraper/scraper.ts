/* eslint-disable @typescript-eslint/no-explicit-any, camelcase */
import { firefox } from 'playwright';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { parseOutcomes_dvjh } from './parser-dvjh';
import { parseOutcomes_dvhs } from './parser-dvhs';

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), '..', '.env.local') });

interface ScraperConfig {
  courseID: string;
  headless: boolean;
  canvasLoginUrl: string;
  canvasUsername: string;
  canvasPassword: string;
  canvasBaseUrl: string;
}

// Session Manager for reusing active Canvas sessions
class SessionManager {
  private static instance: SessionManager;
  private session: { browser: any, context: any, page: any } | null = null;
  private isAuthenticated: boolean = false;

  private constructor() {}

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  async getSession(): Promise<{ browser: any, context: any, page: any }> {
    if (this.isSessionActive() && this.session !== null) {
      return this.session;
    }

    this.session = await authenticateCanvas();
    this.isAuthenticated = true;
    return this.session;
  }

  async closeSession(): Promise<void> {
    if (this.session && this.session.browser) {
      await this.session.browser.close();
      this.session = null;
      this.isAuthenticated = false;
    }
  }

  isSessionActive(): boolean {
    return this.session !== null && this.isAuthenticated;
  }
}

async function authenticateCanvas(): Promise<{ browser: any, context: any, page: any }> {
  const config: ScraperConfig = {
    courseID: '21874',
    headless: process.env.HEADLESS === 'true',
    canvasLoginUrl: process.env.CANVAS_LOGIN_URL || '',
    canvasUsername: process.env.CANVAS_USERNAME || '',
    canvasPassword: process.env.CANVAS_PASSWORD || '',
    canvasBaseUrl: process.env.CANVAS_BASE_URL || ''
  };

  if (!config.canvasLoginUrl || !config.canvasUsername || !config.canvasPassword || !config.canvasBaseUrl) {
    throw new Error('Missing required environment variables: CANVAS_LOGIN_URL, CANVAS_USERNAME, CANVAS_PASSWORD, CANVAS_BASE_URL');
  }

  const browser = await firefox.launch({ 
    headless: config.headless,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(config.canvasLoginUrl, { waitUntil: 'networkidle' });

  await page.fill('input[name="pseudonym_session[unique_id]"]', config.canvasUsername);
  await page.fill('input[name="pseudonym_session[password]"]', config.canvasPassword);

  await page.click('input[type="submit"]');

  await page.waitForLoadState('networkidle');

  return { browser, context, page };
}

// Exported function for parsers to use
export async function pageScrape(url: string, format: 'html' | 'react'): Promise<string> {
  const sessionManager = SessionManager.getInstance();
  const { page } = await sessionManager.getSession();
  
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);
  
  // Wait for the content to be fully rendered
  try {
      await page.waitForSelector('#content', { timeout: 10000 });
    } catch {
      // Continue even if selector not found
    }
  
  // Check if there's an iframe for external tool content
  const iframeHandle = await page.$('iframe.tool_launch');
  if (iframeHandle) {
    try {
      await page.waitForTimeout(5000);
      // Try to extract content from the iframe
      const frame = await iframeHandle.contentFrame();
      if (frame) {
        await frame.waitForTimeout(3000);
        // Get iframe content
        if (format === 'html') {
          return await page.content();
        } else {
          const iframeContent = await frame.evaluate(() => document.body.innerHTML);
          const mainContent = await page.evaluate(() => document.body.innerHTML);
          return mainContent.replace(
            /<iframe[^>]*class="tool_launch"[^>]*>.*?<\/iframe>/s,
            `<div id="iframe_content_wrapper">${iframeContent}</div>`
          );
        }
      }
    } catch {
      // If iframe access fails, continue with main content
    }
  }
  
  await page.waitForTimeout(2000);
  
  if (format === 'html') {
    return await page.content();
  } else {
    return await page.evaluate(() => document.body.innerHTML);
  }
}

// Main wrapper function
interface ScrapeOutcomesResponse {
  courseIDs: number[];
  parseType: string;
  data: any[];
}

export async function scrapeOutcomes(courseIDs: number[], parseType: string, shouldCloseSession: boolean = true): Promise<ScrapeOutcomesResponse> {
    const sessionManager = SessionManager.getInstance();
    await sessionManager.getSession();
  
  try {
    let data: any[] = [];
    
    if (parseType === "dvjh") {
      data = await parseOutcomes_dvjh(courseIDs);
    } else if (parseType === "dvhs") {
      data = await parseOutcomes_dvhs(courseIDs);
    } else {
      throw new Error(`Unknown parseType: ${parseType}`);
    }
    
    const result = {
      courseIDs: courseIDs,
      parseType: parseType,
      data: data
    };
    
    // Close the session if requested (default true for backward compatibility)
    if (shouldCloseSession) {
      await sessionManager.closeSession();
    }
    
    return result;
    
  } catch (error) {
    console.error('Error during scraping:', error);
    if (shouldCloseSession) {
      await sessionManager.closeSession();
    }
    throw error;
  }
}

/**
 * Close the scraper session (call after batch scraping is complete)
 */
export async function closeScraperSession(): Promise<void> {
  const sessionManager = SessionManager.getInstance();
  await sessionManager.closeSession();
}

export { SessionManager };
