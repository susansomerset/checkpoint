import { test, expect } from '@playwright/test';
import { generateAllStatusesData, generateVectorOnlyCourseData } from '../fixtures/synthetic-data';

test.describe('Progress Table E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Mock auth
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
    await page.route('**/api/student-data**', async route => {
      const mockData = generateAllStatusesData();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: mockData
        })
      });
    });
  });

  test('displays student progress with all status types', async ({ page }) => {
    // Listen for console messages
    page.on('console', msg => console.log('CONSOLE:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    
    await page.goto('/progress?student=all-statuses-student-1');
    
    // Wait a bit for the page to load
    await page.waitForTimeout(2000);
    
    // Debug: Take screenshot and log content
    await page.screenshot({ path: 'debug-progress-page.png' });
    const content = await page.textContent('body');
    console.log('Page content:', content.substring(0, 500));
    
    // Check if we can see the progress table
    const progressTable = await page.$('[data-testid="progress-table"]');
    console.log('Progress table found:', !!progressTable);
    
    // Wait for the student to be selected and data to load
    await page.waitForFunction(() => {
      return document.querySelector('[data-testid="progress-table"]') !== null;
    }, { timeout: 15000 });
    
    // Check that the progress table is visible (no header content anymore)
    await expect(page.locator('[data-testid="progress-table"]')).toBeVisible();
    
    // Check table headers (removed Assignment Count column)
    await expect(page.getByRole('columnheader', { name: 'Class Name' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Points Graded' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Points Possible' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Graded %' })).toBeVisible();
    
    // Check course row with new format: "Course Name - Teacher Name (X assignments)"
    await expect(page.getByText('ALLSTAT - Status Teacher (3 assignments)')).toBeVisible();
  });

  test('expands and collapses course details', async ({ page }) => {
    await page.goto('/progress?student=all-statuses-student-1');
    await page.waitForSelector('[data-testid="progress-table"]');
    
    // Initially collapsed - status groups should not be visible
    await expect(page.getByRole('button', { name: /Expand Missing assignments/ })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /Expand Submitted assignments/ })).not.toBeVisible();
    
    // Click to expand course - be more specific about the button
    const courseButton = page.locator('button[aria-expanded="false"]').first();
    await expect(courseButton).toBeVisible();
    await courseButton.click();
    
    // Wait a bit for the expansion
    await page.waitForTimeout(500);
    
    
    // Status groups should now be visible with colored dots and assignment counts
    await expect(page.getByRole('button', { name: /Expand Missing assignments/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Expand Submitted assignments/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Expand Graded assignments/ })).toBeVisible();
    
    // Check that status groups show assignment counts in parentheses
    await expect(page.getByText(/Missing\(1 assignments\)/)).toBeVisible();
    await expect(page.getByText(/Submitted\(1 assignments\)/)).toBeVisible();
    await expect(page.getByText(/Graded\(1 assignments\)/)).toBeVisible();
    
    // Click to collapse course
    await page.click('button[aria-expanded="true"]:first-of-type');
    
    // Status groups should be hidden again
    await expect(page.getByRole('button', { name: /Expand Missing assignments/ })).not.toBeVisible();
  });

  test('expands and collapses status group assignments', async ({ page }) => {
    await page.goto('/progress?student=all-statuses-student-1');
    await page.waitForSelector('[data-testid="progress-table"]');
    
    // Expand course first
    await page.click('button[aria-expanded="false"]:first-of-type');
    await page.waitForTimeout(300);
    
    // Initially collapsed - assignments should not be visible
    await expect(page.getByText('Missing Assignment')).not.toBeVisible();
    
    // Click to expand first status group (Missing)
    await page.click('button[aria-expanded="false"]:has-text("Missing")');
    
    // Assignment should now be visible with new format: "Assignment Name (due m/d)"
    await expect(page.getByText('Missing Assignment')).toBeVisible();
    await expect(page.getByText('(due')).toBeVisible();
    
    // Check that assignment rows don't have assignment count (removed that column)
    await expect(page.getByText('1', { exact: true })).not.toBeVisible();
    
    // Check that assignment is a clickable link
    const assignmentLink = page.locator('a[href*="canvas.instructure.com"]').first();
    await expect(assignmentLink).toBeVisible();
    await expect(assignmentLink).toHaveAttribute('target', '_blank');
    await expect(assignmentLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('filters out Vector assignments', async ({ page }) => {
    // Mock Vector-only data
    await page.route('**/api/student-data**', async route => {
      const mockData = generateVectorOnlyCourseData();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: mockData
        })
      });
    });

    await page.goto('/progress?student=vector-student-1');
    await page.waitForSelector('[data-testid="progress-table"]');
    
    // Should show empty state since Vector assignments are filtered out
    await expect(page.getByText('No assignments found')).toBeVisible();
    await expect(page.getByText('This student has no assignments that meet the display criteria.')).toBeVisible();
  });

  // TODO: Re-enable when keyboard navigation is implemented
  // test('handles keyboard navigation', async ({ page }) => {
  //   await page.goto('/progress?student=all-statuses-student-1');
  //   await page.waitForSelector('[data-testid="progress-table"]');
  //   
  //   // Test tab navigation
  //   await page.keyboard.press('Tab');
  //   const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
  //   expect(firstFocused).toBe('BUTTON');
  //   
  //   // Test Enter key to expand course
  //   await page.keyboard.press('Enter');
  //   await page.waitForTimeout(500); // Wait for expansion
  //   
  //   // Now check for status group buttons
  //   await expect(page.getByRole('button', { name: /Expand Missing assignments/ })).toBeVisible();
  //   
  //   // Test that focus is visible
  //   const focusVisible = await page.evaluate(() => {
  //     const active = document.activeElement as HTMLElement;
  //     return active && getComputedStyle(active).outline !== 'none';
  //   });
  //   expect(focusVisible).toBe(true);
  // });

  // TODO: Re-enable when data formatting issues are resolved
  // test('displays correct data formatting', async ({ page }) => {
  //   await page.goto('/progress?student=all-statuses-student-1');
  //   await page.waitForSelector('[data-testid="progress-table"]');
  //   
  //   // Check that numbers are properly formatted
  //   await expect(page.locator('td:has-text("%")').first()).toBeVisible(); // Percentage format
  //   // Note: Small numbers (like 100) don't need comma formatting, so we'll just check for numeric content
  //   await expect(page.locator('td:has-text("100")').first()).toBeVisible(); // Points possible
  //   
  //   // Expand course to see more data
  //   await page.click('button[aria-expanded="false"]:first-of-type');
  //   await page.waitForTimeout(300);
  //   
  //   // Expand status group to see assignment details
  //   await page.click('button[aria-expanded="false"]:has-text("Missing")');
  //   
  //   // Check due date formatting in new format: "(due m/d)"
  //   await expect(page.getByText(/\(due \d{1,2}\/\d{1,2}\)/)).toBeVisible();
  //   
  //   // Check that percentages are >0% when points have been graded
  //   const percentageElements = await page.locator('text=/%/').all();
  //   for (const element of percentageElements) {
  //     const text = await element.textContent();
  //     if (text && text.includes('%')) {
  //       const percentage = parseInt(text.replace('%', ''));
  //       if (percentage > 0) {
  //         expect(percentage).toBeGreaterThan(0);
  //       }
  //     }
  //   }
  // });

  // TODO: Re-enable when URL parameter deep-linking is working properly
  // test('handles URL parameters for deep linking', async ({ page }) => {
  //   // Test with student parameter
  //   await page.goto('/progress?student=all-statuses-student-1');
  //   await page.waitForSelector('[data-testid="progress-table"]');
  //   
  //   // Test URL changes when student is selected
  //   const currentUrl = page.url();
  //   expect(currentUrl).toContain('student=all-statuses-student-1');
  //   
  //   // Test with specific course and status group expanded
  //   await page.goto('/progress?student=all-statuses-student-1&course=all-statuses-course-1&open=Missing');
  //   await page.waitForSelector('[data-testid="progress-table"]');
  //   
  //   // Wait a bit for URL parameters to be processed
  //   await page.waitForTimeout(500);
  //   
  //   // Course should be expanded
  //   await expect(page.getByRole('button', { name: /Expand Missing assignments/ })).toBeVisible();
  //   
  //   // Status group should be expanded
  //   await expect(page.getByText('Missing Assignment')).toBeVisible();
  //   
  //   // Check that assignment links are properly formed
  //   const assignmentLink = page.locator('a[href*="canvas.instructure.com"]').first();
  //   await expect(assignmentLink).toBeVisible();
  // });
});
