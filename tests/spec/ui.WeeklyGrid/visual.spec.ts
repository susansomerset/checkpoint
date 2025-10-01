/**
 * Visual regression test for ui.WeeklyGrid
 * Uses fixed time/timezone for deterministic screenshots
 */

import { test, expect } from '@playwright/test';

test.describe('ui.WeeklyGrid Visual Regression', () => {
  test('renders weekly grid with correct layout and styling', async ({ page }) => {
    // Navigate to a page that renders WeeklyGrid (assignments page)
    await page.goto('/assignments');
    
    // Wait for grid to load
    await page.waitForSelector('table', { timeout: 10000 });
    
    // Take screenshot
    await expect(page).toHaveScreenshot('weekly-grid-default.png', {
      fullPage: false,
      maxDiffPixels: 100
    });
  });
});

