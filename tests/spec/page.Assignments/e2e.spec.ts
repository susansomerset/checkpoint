/**
 * E2E tests for page.Assignments
 * Tests page-level smoke: loads, renders WeeklyGrid, links work
 */

import { test, expect } from '@playwright/test';

test.describe('page.Assignments E2E', () => {
  test('loads assignments page without errors', async ({ page }) => {
    await page.goto('/assignments');
    
    // Should not have 404 error
    await expect(page.locator('text=404')).not.toBeVisible();
    
    // Should render WeeklyGrid table
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
  });

  test('renders WeeklyGrid with student data', async ({ page }) => {
    await page.goto('/assignments');
    
    // Wait for grid to load
    await page.waitForSelector('table', { timeout: 10000 });
    
    // Check for column headers
    await expect(page.locator('th:has-text("Prior Weeks")')).toBeVisible();
    await expect(page.locator('th:has-text("Mon")')).toBeVisible();
    await expect(page.locator('th:has-text("Next Week")')).toBeVisible();
  });

  test('assignment links open in new tab with noopener', async ({ page }) => {
    await page.goto('/assignments');
    
    // Wait for grid to load
    await page.waitForSelector('table', { timeout: 10000 });
    
    // Find first assignment link
    const firstLink = page.locator('table a[target="_blank"]').first();
    
    if (await firstLink.count() > 0) {
      // Check attributes
      await expect(firstLink).toHaveAttribute('target', '_blank');
      await expect(firstLink).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });
});

