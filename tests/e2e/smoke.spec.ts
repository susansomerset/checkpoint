// tests/e2e/smoke.spec.ts
// Minimal smoke tests to validate core functionality before running full suite

import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Core Functionality', () => {
  test('should load homepage without errors', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Should load without errors
    await expect(page.locator('body')).toBeVisible();
    
    // Check for any console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Wait a moment for any async errors
    await page.waitForTimeout(1000);
    
    // Should have no console errors
    expect(errors).toHaveLength(0);
  });

  test('should handle authentication flow', async ({ page }) => {
    // Navigate to assignments page (requires auth)
    await page.goto('/assignments');
    
    // Should either show auth required or load successfully
    const authRequired = page.locator('text=Sign in required to view assignments');
    const signInButton = page.getByRole('link', { name: 'Sign In' }).first(); // Target header link specifically
    const studentSelector = page.locator('text=Student:');
    
    // Wait for one of these to appear
    await Promise.race([
      authRequired.waitFor({ timeout: 5000 }),
      signInButton.waitFor({ timeout: 5000 }),
      studentSelector.waitFor({ timeout: 5000 })
    ]);
    
    // At least one should be visible
    const hasAuthRequired = await authRequired.isVisible();
    const hasSignInButton = await signInButton.isVisible();
    const hasStudentSelector = await studentSelector.isVisible();
    
    expect(hasAuthRequired || hasSignInButton || hasStudentSelector).toBeTruthy();
  });

  test('should have working auth endpoints', async ({ request }) => {
    // Test /api/auth/me endpoint
    const response = await request.get('/api/auth/me');
    
    // Should return either 204 (logged out) or 200 (logged in)
    expect([200, 204]).toContain(response.status());
  });
});
