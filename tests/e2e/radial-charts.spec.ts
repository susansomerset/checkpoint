import { test, expect } from '@playwright/test';
import { getRealStudentData } from '../fixtures/real-data-cache';

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
  });

  test('radial charts render correctly with golden fixture data', async ({ page }) => {
    // Navigate to the harness page
    await page.goto('/harness/radials');
    
    // Wait for fonts to load
    await page.evaluate(() => document.fonts.ready);
    
    // Wait for charts to render
    await page.waitForSelector('[data-testid="chart-container"], .chart-container', { timeout: 10000 });
    
    // Wait for any animations to complete (even though they're disabled in test mode)
    await page.waitForTimeout(100);
    
    // Take screenshot of the entire harness page
    await expect(page).toHaveScreenshot('radial-charts-harness.png', {
      fullPage: true,
      maxDiffPixels: 120, // Small tolerance for font rendering differences
      threshold: 0.2 // 20% threshold for color differences
    });
  });

  test('radial charts render correctly on progress page', async ({ page }) => {
    // Mock authentication
    await page.route('**/api/auth/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sub: 'test-user-123',
          email: 'test@example.com',
          name: 'Test User',
          preferredName: 'Test User'
        })
      });
    });

    // Use real student data from cache (same as Phase 2)
    await page.route('**/api/student-data', async route => {
      try {
        const realData = await getRealStudentData();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(realData)
        });
      } catch (error) {
        console.error('Failed to get real student data:', error);
        // Fallback to basic mock if real data fails
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ok: true,
            status: 200,
            data: {
              students: {},
              lastLoadedAt: new Date().toISOString(),
              apiVersion: '1'
            }
          })
        });
      }
    });

    // Navigate to progress page
    await page.goto('/progress');
    
    // Wait for fonts to load
    await page.evaluate(() => document.fonts.ready);
    
    // Wait for charts to render
    await page.waitForSelector('.chart-container', { timeout: 10000 });
    
    // Wait for any animations to complete
    await page.waitForTimeout(100);
    
    // Take screenshot of the progress page
    await expect(page).toHaveScreenshot('progress-page-with-charts.png', {
      fullPage: true,
      maxDiffPixels: 120,
      threshold: 0.2
    });
  });

  test('radial charts are accessible', async ({ page }) => {
    // Mock authentication
    await page.route('**/api/auth/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sub: 'test-user-123',
          email: 'test@example.com',
          name: 'Test User',
          preferredName: 'Test User'
        })
      });
    });

    // Use real student data from cache (same as Phase 2)
    await page.route('**/api/student-data', async route => {
      try {
        const realData = await getRealStudentData();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(realData)
        });
      } catch (error) {
        console.error('Failed to get real student data:', error);
        // Fallback to basic mock if real data fails
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ok: true,
            status: 200,
            data: {
              students: {},
              lastLoadedAt: new Date().toISOString(),
              apiVersion: '1'
            }
          })
        });
      }
    });

    await page.goto('/progress');
    
    // Wait for charts to render
    await page.waitForSelector('.chart-container', { timeout: 10000 });
    
    // Check that charts have proper ARIA labels
    const charts = await page.locator('.chart-container').all();
    expect(charts.length).toBeGreaterThan(0);
    
    // Each chart should have a title that serves as an accessible label
    for (const chart of charts) {
      const title = await chart.locator('h3').textContent();
      expect(title).toBeTruthy();
      expect(title).toMatch(/Period \d+/);
    }
  });

  test('radial charts handle different screen sizes', async ({ page }) => {
    // Mock authentication
    await page.route('**/api/auth/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sub: 'test-user-123',
          email: 'test@example.com',
          name: 'Test User',
          preferredName: 'Test User'
        })
      });
    });

    // Use real student data from cache (same as Phase 2)
    await page.route('**/api/student-data', async route => {
      try {
        const realData = await getRealStudentData();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(realData)
        });
      } catch (error) {
        console.error('Failed to get real student data:', error);
        // Fallback to basic mock if real data fails
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ok: true,
            status: 200,
            data: {
              students: {},
              lastLoadedAt: new Date().toISOString(),
              apiVersion: '1'
            }
          })
        });
      }
    });

    // Test desktop size
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/progress');
    await page.evaluate(() => document.fonts.ready);
    await page.waitForSelector('.chart-container', { timeout: 10000 });
    await page.waitForTimeout(100);
    
    await expect(page).toHaveScreenshot('progress-page-desktop.png', {
      fullPage: true,
      maxDiffPixels: 120,
      threshold: 0.2
    });

    // Test tablet size
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForSelector('.chart-container', { timeout: 10000 });
    await page.waitForTimeout(100);
    
    await expect(page).toHaveScreenshot('progress-page-tablet.png', {
      fullPage: true,
      maxDiffPixels: 120,
      threshold: 0.2
    });

    // Test mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForSelector('.chart-container', { timeout: 10000 });
    await page.waitForTimeout(100);
    
    await expect(page).toHaveScreenshot('progress-page-mobile.png', {
      fullPage: true,
      maxDiffPixels: 120,
      threshold: 0.2
    });
  });
});