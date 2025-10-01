import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('progress table has zero serious/critical accessibility violations', async ({ page }) => {
    // Navigate to progress table with test data
    await page.goto('/progress?student=synthetic-student-1');
    
    // Wait for content to load
    await page.waitForSelector('[data-testid="progress-table"]', { timeout: 10000 });
    
    // Run axe accessibility analysis
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    
    // Filter for serious and critical violations only
    const seriousViolations = results.violations.filter(v => 
      ['serious', 'critical'].includes(v.impact ?? 'minor')
    );
    
    // Log violations for debugging
    if (seriousViolations.length > 0) {
      console.log('Accessibility violations found:', JSON.stringify(seriousViolations, null, 2));
    }
    
    expect(seriousViolations, 'Should have zero serious/critical accessibility violations').toHaveLength(0);
  });

  test('progress table supports keyboard navigation', async ({ page }) => {
    await page.goto('/progress?student=synthetic-student-1');
    await page.waitForSelector('[data-testid="progress-table"]');
    
    // Test tab navigation through interactive elements
    await page.keyboard.press('Tab');
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(firstFocused).toBeTruthy();
    
    // Test that focus is visible
    const focusVisible = await page.evaluate(() => {
      const active = document.activeElement as HTMLElement;
      return active && getComputedStyle(active).outline !== 'none';
    });
    expect(focusVisible).toBe(true);
  });

  test('progress table has proper ARIA labels and structure', async ({ page }) => {
    await page.goto('/progress?student=synthetic-student-1');
    await page.waitForSelector('[data-testid="progress-table"]');
    
    // Check for proper table structure
    const table = page.locator('table[role="table"]');
    await expect(table).toBeVisible();
    
    // Check for proper headers
    const headers = page.locator('th[scope="col"]');
    await expect(headers).toHaveCount(4); // Class Name, Points Graded, Points Possible, Graded %
    
    // Check for expandable rows with proper ARIA
    const expandableRows = page.locator('button[aria-expanded]');
    await expect(expandableRows).toHaveCount.greaterThan(0);
  });
});
