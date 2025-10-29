/* eslint-disable no-console, no-restricted-syntax, @typescript-eslint/no-require-imports */
/**
 * Main Canvas scraper entry point
 * 
 * Usage:
 *   npm run scrape:canvas
 */
import { getAuthenticatedContext, clearAuthState } from './auth';
import { scrapeExternalToolPage } from './parsers';
import { ScraperConfig, ScrapeResult } from './types';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

/**
 * Main scraper function
 */
export async function scrapeCanvas(config: ScraperConfig): Promise<ScrapeResult> {
  const startTime = Date.now();
  const result: ScrapeResult = {
    success: false,
    coursesScraped: 0,
    errors: [],
    data: [],
    duration: 0,
  };

  let browser;
  
  try {
    console.log('🚀 Starting Canvas scraper...');
    console.log(`📚 Courses to scrape: ${config.courseIds.length}`);

    // Authenticate
    const { browser: b, context } = await getAuthenticatedContext({
      username: config.username,
      password: config.password,
      baseUrl: config.canvasBaseUrl,
      headless: config.headless,
    });
    browser = b;

    // Scrape each course
    for (const courseId of config.courseIds) {
      try {
        const page = await context.newPage();
        
        // Navigate to external tool page
        const url = `${config.canvasBaseUrl}/courses/${courseId}/external_tools/493`;
        console.log(`🔗 Navigating to: ${url}`);
        
        await page.goto(url, { waitUntil: 'networkidle' });
        
        // Wait for LTI iframe to appear (use class selector as ID may vary)
        await page.waitForSelector('iframe.tool_launch[data-lti-launch="true"]', { timeout: 15000 });
        await page.waitForTimeout(5000); // Extra time for Echo Gradebook to load
        
        // DEBUG: Capture iframe content
        // Get all iframes and find the LTI one
        const frames = page.frames();
        const ltiFrame = frames.find(f => f.name().includes('tool_content'));
        
        if (ltiFrame) {
          const iframeHtml = await ltiFrame.content();
          await require('fs').promises.writeFile(`src/lib/scraper/debug-iframe-${courseId}.html`, iframeHtml);
          await page.screenshot({ path: `src/lib/scraper/debug-course-${courseId}.png`, fullPage: true });
          console.log(`  💾 Debug files saved (iframe: ${ltiFrame.name()})`);
        } else {
          console.warn(`  ⚠️  Could not find LTI iframe. Available frames: ${frames.map(f => f.name()).join(', ')}`);
        }
        
        // Scrape the page
        const courseData = await scrapeExternalToolPage(page, courseId);
        result.data.push(courseData);
        result.coursesScraped++;

        await page.close();
        
        // Be polite - wait between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        const errorMsg = `Failed to scrape course ${courseId}: ${error}`;
        console.error(`❌ ${errorMsg}`);
        result.errors.push(errorMsg);
      }
    }

    await context.close();
    result.success = result.errors.length === 0;

  } catch (error) {
    const errorMsg = `Scraper failed: ${error}`;
    console.error(`❌ ${errorMsg}`);
    result.errors.push(errorMsg);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  result.duration = Date.now() - startTime;
  
  console.log('\n📊 Scrape Results:');
  console.log(`  ✓ Courses scraped: ${result.coursesScraped}/${config.courseIds.length}`);
  console.log(`  ⏱️  Duration: ${(result.duration / 1000).toFixed(2)}s`);
  if (result.errors.length > 0) {
    console.log(`  ⚠️  Errors: ${result.errors.length}`);
  }
  
  // DEBUG: Show what we extracted
  if (result.data.length > 0) {
    console.log('\n📋 Extracted Data:');
    result.data.forEach(course => {
      console.log(`\n  Course ${course.courseId}:`);
      console.log(`    Vector Metadata: ${course.vectorMetadata.length} vectors`);
      course.vectorMetadata.forEach(v => {
        console.log(`      - ${v.abbreviation} (${v.name}): ${v.percentage}% (${v.currentScore}/${v.possiblePoints}) - ${v.weight}% Wt`);
      });
      console.log(`    Assignments: ${course.assignments.length}`);
      if (course.assignments.length > 0 && course.assignments.length <= 5) {
        course.assignments.forEach(a => {
          const vectorStr = a.vectorScores.map(vs => `${vs.vector}:${vs.score}/${vs.possiblePoints}`).join(', ');
          console.log(`      - ${a.name}: ${vectorStr || 'no scores'}`);
        });
      } else if (course.assignments.length > 5) {
        console.log(`      First 3:`);
        course.assignments.slice(0, 3).forEach(a => {
          const vectorStr = a.vectorScores.map(vs => `${vs.vector}:${vs.score}/${vs.possiblePoints}`).join(', ');
          console.log(`      - ${a.name}: ${vectorStr || 'no scores'}`);
        });
      }
    });
  }

  return result;
}

/**
 * CLI entry point
 */
async function main() {
  // Validate environment variables
  const requiredVars = ['CANVAS_USERNAME', 'CANVAS_PASSWORD'];
  const missing = requiredVars.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(v => console.error(`   - ${v}`));
    process.exit(1);
  }

  // For now, just scrape one course (will make dynamic later)
  const courseIds = ['23758'];

  const config: ScraperConfig = {
    canvasBaseUrl: process.env.CANVAS_BASE_URL || 'https://djusd.instructure.com',
    username: process.env.CANVAS_USERNAME!,
    password: process.env.CANVAS_PASSWORD!,
    authStatePath: './src/lib/scraper/auth-state.json',
    headless: process.env.HEADLESS !== 'false',
    courseIds,
  };

  // Handle --clear-auth flag
  if (process.argv.includes('--clear-auth')) {
    clearAuthState();
    console.log('✅ Authentication state cleared');
    return;
  }

  // Run the scraper
  const result = await scrapeCanvas(config);

  // Output results as JSON if requested
  if (process.argv.includes('--json')) {
    console.log('\n📋 JSON Output:');
    console.log(JSON.stringify(result, null, 2));
  }

  // Exit with appropriate code
  process.exit(result.success ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

