// tests/e2e/smoke.spec.ts
// Minimal smoke tests to validate core functionality before running full suite

import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Core Functionality', () => {
  test('should load homepage without errors', async ({ page }) => {
    // Set up console error tracking
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Navigate to homepage
    await page.goto('/');
    
    // Should load without errors
    await expect(page.locator('body')).toBeVisible();
    
    // Wait for fonts to load and any async operations
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1000);
    
    // Should have no console errors
    expect(errors).toHaveLength(0);
  });

  test('should handle authentication flow', async ({ page }) => {
    // Set up console error tracking
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
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
    
    // Wait for fonts and async operations
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1000);
    
    // Should have no console errors
    expect(errors).toHaveLength(0);
  });

  test('should have working auth endpoints', async ({ request }) => {
    // Test /api/auth/me endpoint
    const response = await request.get('/api/auth/me');
    
    // Should return either 204 (logged out) or 200 (logged in)
    expect([200, 204]).toContain(response.status());
  });

  test('should load progress page with charts without console errors', async ({ page }) => {
    // Set up console error tracking
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

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

    // Mock student data
    await page.route('**/api/student-data', async route => {
      const mockData = {
        ok: true,
        status: 200,
        data: {
          students: {
            'student-001': {
              studentId: 'student-001',
              meta: { legalName: 'Test Student', preferredName: 'Test' },
              courses: {
                'course-101': {
                  courseId: 'course-101',
                  canvas: { name: 'Algebra I' },
                  meta: { shortName: 'Algebra I', teacher: 'Ms. Johnson', period: 1 },
                  assignments: {
                    'assignment-001': {
                      assignmentId: 'assignment-001',
                      courseId: 'course-101',
                      canvas: { name: 'Quiz 1', due_at: '2024-10-15T23:59:59Z' },
                      pointsPossible: 100,
                      meta: { checkpointStatus: 'Graded', assignmentType: 'Pointed' }
                    }
                  },
                  orphanSubmissions: {}
                }
              }
            }
          },
          lastLoadedAt: new Date().toISOString(),
          apiVersion: '1'
        }
      };
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockData)
      });
    });

    // Navigate to progress page
    await page.goto('/progress');
    
    // Wait for charts to render
    await page.waitForSelector('.chart-container', { timeout: 10000 });
    
    // Wait for fonts and async operations
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1000);
    
    // Should have no console errors
    expect(errors).toHaveLength(0);
    
    // Should have charts visible
    const charts = await page.locator('.chart-container').count();
    expect(charts).toBeGreaterThan(0);
  });
});
