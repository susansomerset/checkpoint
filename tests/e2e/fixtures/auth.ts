import { test as base } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route('**/api/auth/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ sub: 'test-user-123', email: 'test@example.com', name: 'Test User' })
      });
    });
    await use(page);
  }
});
export const expect = test.expect;
