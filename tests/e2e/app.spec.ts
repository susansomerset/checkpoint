import { test, expect } from './fixtures/auth';

test('assignments render (mocked auth)', async ({ page }) => {
  await page.goto('/assignments');
  await expect(page.getByText('Student:')).toBeVisible();
});
