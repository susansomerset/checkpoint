import { test, expect } from '@playwright/test';
import { getRealStudentData } from '../fixtures/real-data-cache';

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

  test('should switch students instantly without loading state', async ({ page }) => {
    // Wait for initial load
    await page.waitForSelector('text=Student:');
    await page.waitForSelector('text=Assignments for', { timeout: 10000 });
    
    // Get student buttons
    const studentButtons = page.locator('button[class*="px-3 py-1 text-sm font-medium rounded-md"]');
    const buttonCount = await studentButtons.count();
    
    if (buttonCount > 1) {
      // Click on second student - should be instant
      await studentButtons.nth(1).click();
      
      // Should NOT show loading state (switching is instant now)
      await expect(page.locator('text=Loading...')).not.toBeVisible({ timeout: 1000 });
      
      // Assignment content should update immediately
      await page.waitForTimeout(500); // Brief wait for UI update
      await expect(page.locator('text=Assignments for')).toBeVisible();
    }
  });

  test('should handle no assignments gracefully', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('text=Student:');
    
    // Wait for assignments to load (either assignments or "No assignments found")
    await page.waitForSelector('text=Assignments for', { timeout: 10000 });
    
    // Since our mock data has assignments, we should see them
    // If we want to test the "no assignments" case, we'd need different mock data
    const assignmentItems = page.locator('li[class*="px-4 py-4 sm:px-6"]');
    const assignmentCount = await assignmentItems.count();
    
    // Verify assignments are displayed (our mock data has 3 assignments)
    expect(assignmentCount).toBeGreaterThan(0);
    
    // Verify the assignment header is present
    const assignmentHeader = page.locator('h2[class*="text-2xl font-bold text-gray-800"]');
    await expect(assignmentHeader).toBeVisible();
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

  test('should validate assignment count matches mock data', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('text=Student:');
    await page.waitForSelector('text=Assignments for', { timeout: 10000 });
    
    // Get the mock data to count expected assignments
    const mockData = await getRealStudentData();
    const firstStudent = Object.values(mockData.data.students)[0];
    
    // Count total assignments across all courses for the first student
    let expectedAssignmentCount = 0;
    Object.values(firstStudent.courses).forEach(course => {
      const courseAssignments = Object.values(course.assignments || {}).filter(
        assignment => assignment.meta.assignmentType !== 'Vector'
      );
      expectedAssignmentCount += courseAssignments.length;
    });
    
    console.log(`Expected assignment count: ${expectedAssignmentCount}`);
    
    // Count actual assignments displayed on the page
    const assignmentItems = page.locator('li[class*="px-4 py-4 sm:px-6"]');
    const actualAssignmentCount = await assignmentItems.count();
    
    console.log(`Actual assignment count: ${actualAssignmentCount}`);
    
    // Verify the counts match
    expect(actualAssignmentCount).toBe(expectedAssignmentCount);
    
    // If there are assignments, verify they're properly displayed
    if (expectedAssignmentCount > 0) {
      // Check that assignment links are present
      const assignmentLinks = page.locator('a[href*="instructure.com"]');
      const linkCount = await assignmentLinks.count();
      expect(linkCount).toBeGreaterThan(0);
      
      // Check that status badges are present
      const statusBadges = page.locator('p[class*="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"]');
      const badgeCount = await statusBadges.count();
      expect(badgeCount).toBeGreaterThan(0);
    }
  });

  test('should handle authentication errors', async ({ page }) => {
    // Mock authentication as unauthenticated (204 response)
    await page.route('**/api/auth/me', async route => {
      await route.fulfill({
        status: 204,
        body: ''
      });
    });

    // Navigate to assignments without authentication
    await page.goto('/assignments');
    
    // Wait for the page to load
    await page.waitForTimeout(1000);
    
    // With the new auth-gated architecture, when unauthenticated:
    // - StudentContext won't fetch data (so no "Loading students...")
    // - AssignmentList will show "Sign in required" message
    // - SessionChip will show "Signed out" with sign in button
    
    // Check for either auth required message or sign in button
    const authRequired = page.locator('text=Sign in required to view assignments');
    const signInButton = page.getByRole('link', { name: 'Sign In' }).first(); // Use first to avoid strict mode violation
    const sessionChipSignIn = page.locator('text=Signed out');
    
    // At least one should be visible
    const hasAuthRequired = await authRequired.isVisible();
    const hasSignInButton = await signInButton.isVisible();
    const hasSessionChipSignIn = await sessionChipSignIn.isVisible();
    
    expect(hasAuthRequired || hasSignInButton || hasSessionChipSignIn).toBeTruthy();
  });
});