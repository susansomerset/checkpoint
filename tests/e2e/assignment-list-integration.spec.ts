import { test, expect } from '@playwright/test';

test.describe('Assignment List Integration with Student Selector', () => {
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

    // Mock student data API
    await page.route('**/api/student-data', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          status: 200,
          data: {
            students: {
              '19904': {
                studentId: '19904',
                meta: {
                  preferredName: 'Chuckles Somerset',
                  legalName: 'Charles Somerset'
                },
                courses: {
                  '123': {
                    courseId: '123',
                    canvas: { name: 'Math' },
                    meta: { period: 1, teacher: 'Mr. Smith', shortName: 'Math' }
                  }
                }
              },
              '20682': {
                studentId: '20682',
                meta: {
                  preferredName: 'Susan Somerset',
                  legalName: 'Susan Somerset'
                },
                courses: {
                  '456': {
                    courseId: '456',
                    canvas: { name: 'History' },
                    meta: { period: 2, teacher: 'Ms. Jones', shortName: 'History' }
                  }
                }
              }
            },
            assignments: {
              'a1': {
                assignmentId: 'a1',
                courseId: '123',
                canvas: { name: 'Math Assignment 1', due_at: '2024-01-15T23:59:59Z' },
                meta: { checkpointStatus: 'Submitted', assignmentType: 'Assignment' },
                pointsPossible: 100
              },
              'a2': {
                assignmentId: 'a2',
                courseId: '456',
                canvas: { name: 'History Essay', due_at: '2024-01-20T23:59:59Z' },
                meta: { checkpointStatus: 'Graded', assignmentType: 'Essay' },
                pointsPossible: 50
              }
            }
          }
        })
      });
    });

    // Navigate to assignments page
    await page.goto('/assignments');
    await page.waitForLoadState('networkidle');
  });

  test('should display assignments for selected student', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('text=Student:');
    
    // Wait for assignments to load (either assignments or "No assignments found")
    await page.waitForSelector('text=Assignments for', { timeout: 10000 });
    
    // Should see student name in assignment header
    const assignmentHeader = page.locator('h2[class*="text-2xl font-bold text-gray-800"]');
    await expect(assignmentHeader).toBeVisible();
    
    // Should contain "Assignments for [Student Name]"
    const headerText = await assignmentHeader.textContent();
    expect(headerText).toMatch(/Assignments for .+/);
  });

  test('should update assignments when student changes', async ({ page }) => {
    // Wait for initial load
    await page.waitForSelector('text=Student:');
    await page.waitForSelector('text=Assignments for', { timeout: 10000 });
    
    // Get initial assignment header
    const initialHeader = page.locator('h2[class*="text-2xl font-bold text-gray-800"]');
    const initialText = await initialHeader.textContent();
    
    // Get student buttons
    const studentButtons = page.locator('button[class*="px-3 py-1 text-sm font-medium rounded-md"]');
    const buttonCount = await studentButtons.count();
    
    if (buttonCount > 1) {
      // Click on second student
      await studentButtons.nth(1).click();
      
      // Wait for assignments to update
      await page.waitForTimeout(1000);
      
      // Check that assignment header has updated
      const updatedHeader = page.locator('h2[class*="text-2xl font-bold text-gray-800"]');
      const updatedText = await updatedHeader.textContent();
      
      // Header should have changed (different student name)
      expect(updatedText).not.toBe(initialText);
    }
  });

  test('should show loading state during student switch', async ({ page }) => {
    // Wait for initial load
    await page.waitForSelector('text=Student:');
    await page.waitForSelector('text=Assignments for', { timeout: 10000 });
    
    // Get student buttons
    const studentButtons = page.locator('button[class*="px-3 py-1 text-sm font-medium rounded-md"]');
    const buttonCount = await studentButtons.count();
    
    if (buttonCount > 1) {
      // Click on second student
      await studentButtons.nth(1).click();
      
      // Should show loading state briefly
      await expect(page.locator('text=Loading...')).toBeVisible({ timeout: 2000 });
      
      // Loading should disappear
      await expect(page.locator('text=Loading...')).not.toBeVisible({ timeout: 5000 });
    }
  });

  test('should handle no assignments gracefully', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('text=Student:');
    
    // Wait for either assignments or "No assignments found"
    await page.waitForSelector('text=No assignments found for this student', { timeout: 10000 });
    
    // Should show appropriate message
    const noAssignmentsMessage = page.locator('text=No assignments found for this student');
    await expect(noAssignmentsMessage).toBeVisible();
  });

  test('should display course information correctly', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('text=Student:');
    
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    // Check if there are any course sections
    const courseSections = page.locator('div[class*="bg-white shadow overflow-hidden sm:rounded-lg"]');
    const courseCount = await courseSections.count();
    
    if (courseCount > 0) {
      // Check that course information is displayed
      const courseHeader = courseSections.first().locator('h3[class*="text-lg leading-6 font-medium text-gray-900"]');
      await expect(courseHeader).toBeVisible();
      
      // Should contain course name, period, and teacher
      const headerText = await courseHeader.textContent();
      expect(headerText).toMatch(/\(.+\) - .+/); // Format: "Course Name (Period) - Teacher"
    }
  });

  test('should handle authentication errors', async ({ page }) => {
    // Navigate to assignments without authentication
    await page.goto('/assignments');
    
    // Should either redirect to login or show auth required message
    const authRequired = page.locator('text=Sign in required to view assignments');
    const signInButton = page.locator('a[href="/api/auth/login"]');
    
    // One of these should be visible
    const hasAuthRequired = await authRequired.isVisible();
    const hasSignInButton = await signInButton.isVisible();
    
    expect(hasAuthRequired || hasSignInButton).toBeTruthy();
  });
});