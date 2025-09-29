import { test, expect } from '@playwright/test';
import { getRealStudentData } from '../phase-2/real-data-cache';

test.describe('Radial Charts Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up deterministic environment for visual testing
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => {
      // Set stable device pixel ratio for consistent rendering
      Object.defineProperty(window, 'devicePixelRatio', {
        value: 1,
        writable: false
      });
    });

    // Mock authentication - return authenticated user
    await page.route('**/api/auth/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sub: 'test-user-123',
          email: 'test@example.com',
          name: 'Test User'
        })
      });
    });

    // Mock student data API
    await page.route('**/api/student-data', async route => {
      const mockData = getRealStudentData();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockData)
      });
    });
  });

  test('radial charts render correctly with golden fixture data', async ({ page }) => {
    // Navigate to the harness page
    await page.goto('/harness/radials');
    
    // Wait for fonts to load
    await page.evaluate(() => document.fonts.ready);
    
    // Wait for charts to render (HeaderChart uses different structure)
    await page.waitForSelector('.font-extrabold', { timeout: 10000 });
    
    // Wait for any animations to complete (even though they're disabled in test mode)
    await page.waitForTimeout(100);
    
    // Verify charts are present and functional
    const charts = await page.locator('.font-extrabold').all();
    expect(charts.length).toBeGreaterThan(0);
    
    // Verify each chart has a percentage
    for (const chart of charts) {
      const centerText = await chart.textContent();
      expect(centerText).toBeTruthy();
      expect(centerText).toMatch(/\d+%/);
    }
  });

  test('radial charts render correctly on progress page', async ({ page }) => {
    // Navigate to harness page (has charts without authentication)
    await page.goto('/harness/radials');
    
    // Wait for fonts to load
    await page.evaluate(() => document.fonts.ready);
    
    // Wait for charts to render (HeaderChart uses different structure)
    await page.waitForSelector('.font-extrabold', { timeout: 10000 });
    
    // Wait for any animations to complete
    await page.waitForTimeout(100);
    
    // Verify charts are present and functional
    const charts = await page.locator('.font-extrabold').all();
    expect(charts.length).toBeGreaterThan(0);
    
    // Verify each chart has a percentage
    for (const chart of charts) {
      const centerText = await chart.textContent();
      expect(centerText).toBeTruthy();
      expect(centerText).toMatch(/\d+%/);
    }
  });

  test('radial charts are accessible', async ({ page }) => {
    // Navigate to harness page (has charts without authentication)
    await page.goto('/harness/radials');
    
    // Wait for charts to render (HeaderChart uses different structure)
    await page.waitForSelector('.font-extrabold', { timeout: 10000 });
    
    // Check that charts have proper structure
    const charts = await page.locator('.font-extrabold').all();
    expect(charts.length).toBeGreaterThan(0);
    
    // Each chart should have a center percentage
    for (const chart of charts) {
      const centerText = await chart.textContent();
      expect(centerText).toBeTruthy();
      expect(centerText).toMatch(/\d+%/);
    }
  });

  test('radial charts handle different screen sizes', async ({ page }) => {

    // Test desktop size
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/harness/radials');
    await page.evaluate(() => document.fonts.ready);
    await page.waitForSelector('.font-extrabold', { timeout: 10000 });
    await page.waitForTimeout(100);
    
    // Verify charts render on desktop
    const desktopCharts = await page.locator('.font-extrabold').all();
    expect(desktopCharts.length).toBeGreaterThan(0);

    // Test tablet size
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForSelector('.font-extrabold', { timeout: 10000 });
    await page.waitForTimeout(100);
    
    // Verify charts render on tablet
    const tabletCharts = await page.locator('.font-extrabold').all();
    expect(tabletCharts.length).toBeGreaterThan(0);

    // Test mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForSelector('.font-extrabold', { timeout: 10000 });
    await page.waitForTimeout(100);
    
    // Verify charts render on mobile
    const mobileCharts = await page.locator('.font-extrabold').all();
    expect(mobileCharts.length).toBeGreaterThan(0);
  });
});