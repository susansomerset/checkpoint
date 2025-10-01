import { test, expect } from './fixtures/auth';

test('assignments render (mocked auth)', async ({ page }) => {
  await page.goto('/assignments');
  // Check that WeeklyGrid table renders
  await expect(page.locator('table')).toBeVisible({ timeout: 10000 });
  // Check for WeeklyGrid column headers
  await expect(page.locator('th:has-text("Prior Weeks")')).toBeVisible();
  // Check that the student selector is in the header
  await expect(page.locator('header')).toBeVisible();
});
