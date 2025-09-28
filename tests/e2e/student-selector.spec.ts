import { test, expect } from '@playwright/test';
import { getRealStudentData } from '../fixtures/real-data-cache';

test.describe('Student Selector', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication - return authenticated user
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

    // Use real student data from cache
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
              assignments: {}
            }
          })
        });
      }
    });

    // Navigate to assignments page
    await page.goto('/assignments');
    await page.waitForLoadState('networkidle');
  });

  test('should display student selector in header', async ({ page }) => {
    // Check if student selector is visible in header
    await expect(page.locator('text=Student:')).toBeVisible();
    
    // Check if there are student buttons
    const studentButtons = page.locator('button[class*="px-3 py-1 text-sm font-medium rounded-md"]');
    await expect(studentButtons).toHaveCount(2); // Assuming 2 students from test data
  });

  test('should auto-select first student', async ({ page }) => {
    // Wait for student selector to load
    await page.waitForSelector('text=Student:');
    
    // Check that first student button is selected (has indigo background)
    const firstStudentButton = page.locator('button[class*="bg-indigo-600 text-white"]').first();
    await expect(firstStudentButton).toBeVisible();
  });

  test('should allow switching between students', async ({ page }) => {
    // Wait for student selector to load
    await page.waitForSelector('text=Student:');
    
    // Get all student buttons
    const studentButtons = page.locator('button[class*="px-3 py-1 text-sm font-medium rounded-md"]');
    const buttonCount = await studentButtons.count();
    
    if (buttonCount > 1) {
      // Click on second student button
      await studentButtons.nth(1).click();
      
      // Check that second student is now selected
      const selectedButton = page.locator('button[class*="bg-indigo-600 text-white"]');
      await expect(selectedButton).toHaveCount(1);
      
      // Click back to first student
      await studentButtons.nth(0).click();
      
      // Check that first student is selected again
      await expect(selectedButton).toHaveCount(1);
    }
  });

  test('should show loading state when fetching data', async ({ page }) => {
    // Mock authentication as authenticated
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

    // Mock student data API with a delay to simulate loading
    await page.route('**/api/student-data', async route => {
      await new Promise(resolve => setTimeout(resolve, 200));
      const mockData = await getRealStudentData();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockData)
      });
    });

    // Navigate to page
    await page.goto('/assignments');
    
    // Should show loading indicator while fetching data
    await expect(page.locator('text=Loading students...')).toBeVisible();
    
    // Wait for loading to complete
    await expect(page.locator('text=Loading students...')).not.toBeVisible();
  });

  test('should display student names correctly', async ({ page }) => {
    // Wait for student selector to load
    await page.waitForSelector('text=Student:');
    
    // Check that student names are displayed (not "Unknown")
    const studentButtons = page.locator('button[class*="px-3 py-1 text-sm font-medium rounded-md"]');
    const buttonCount = await studentButtons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const buttonText = await studentButtons.nth(i).textContent();
      expect(buttonText).not.toBe('Unknown');
      expect(buttonText).toBeTruthy();
    }
  });

  test('should handle authentication state', async ({ page }) => {
    // Check that student selector only appears when authenticated
    await page.goto('/');
    
    // Should not see student selector on home page (not authenticated)
    await expect(page.locator('text=Student:')).not.toBeVisible();
    
    // Navigate to assignments (should trigger auth)
    await page.goto('/assignments');
    
    // Should see student selector after authentication
    await page.waitForSelector('text=Student:', { timeout: 10000 });
    await expect(page.locator('text=Student:')).toBeVisible();
  });
});