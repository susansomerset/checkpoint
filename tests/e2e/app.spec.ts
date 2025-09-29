import { test, expect } from './fixtures/auth';

test('assignments render (mocked auth)', async ({ page }) => {
  await page.goto('/assignments');
  // Check for the main page heading (not the nav link)
  await expect(page.getByRole('heading', { name: 'Assignments' })).toBeVisible();
  await expect(page.getByText('View all assignments with Canvas links and status information')).toBeVisible();
  // Check that the student selector is in the header
  await expect(page.locator('header')).toBeVisible();
});
