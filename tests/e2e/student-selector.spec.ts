import { test, expect } from '@playwright/test';

test.describe('Student Selector', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to assignments page
    await page.goto('/assignments');
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

  test('should show loading state initially', async ({ page }) => {
    // Navigate to page and immediately check for loading state
    await page.goto('/assignments');
    
    // Should show loading indicator
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
