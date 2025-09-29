import { test, expect } from '@playwright/test';
import { generateAllStatusesData } from '../fixtures/synthetic-data';

test.describe('Progress Table Visual Regression', () => {
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

  test('progress table renders correctly with all statuses', async ({ page }) => {
    await page.goto('/progress?student=all-statuses-student-1');
    
    // Wait for the table to load
    await page.waitForSelector('[data-testid="progress-table"]', { timeout: 10000 });
    
    // Wait for content to stabilize
    await page.waitForTimeout(1000);
    
    // Take screenshot of the entire progress table
    await expect(page.locator('[data-testid="progress-table"]')).toHaveScreenshot('progress-table-all-statuses.png', {
      maxDiffPixels: 100,
      threshold: 0.2
    });
  });

  test('progress table with expanded course shows status groups', async ({ page }) => {
    await page.goto('/progress?student=all-statuses-student-1');
    
    // Wait for the table to load
    await page.waitForSelector('[data-testid="progress-table"]', { timeout: 10000 });
    
    // Click to expand the course
    await page.click('button[aria-expanded="false"]:first-of-type');
    
    // Wait for expansion animation
    await page.waitForTimeout(500);
    
    // Take screenshot of expanded state
    await expect(page.locator('[data-testid="progress-table"]')).toHaveScreenshot('progress-table-expanded-course.png', {
      maxDiffPixels: 100,
      threshold: 0.2
    });
  });

  test('progress table with expanded status group shows assignments', async ({ page }) => {
    await page.goto('/progress?student=all-statuses-student-1');
    
    // Wait for the table to load
    await page.waitForSelector('[data-testid="progress-table"]', { timeout: 10000 });
    
    // Click to expand the course
    await page.click('button[aria-expanded="false"]:first-of-type');
    await page.waitForTimeout(300);
    
    // Click to expand the first status group (Missing)
    await page.click('button[aria-expanded="false"]:has-text("Missing")');
    
    // Wait for expansion animation
    await page.waitForTimeout(500);
    
    // Take screenshot of fully expanded state
    await expect(page.locator('[data-testid="progress-table"]')).toHaveScreenshot('progress-table-expanded-status-group.png', {
      maxDiffPixels: 100,
      threshold: 0.2
    });
  });

  test('progress table empty state renders correctly', async ({ page }) => {
    // Mock empty data
    await page.route('**/api/student-data', async route => {
      const emptyData = {
        version: 1,
        students: {
          'empty-student': {
            studentId: 'empty-student',
            meta: {
              legalName: 'Empty Student',
              preferredName: 'Empty Student'
            },
            courses: {}
          }
        }
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: emptyData
        })
      });
    });

    await page.goto('/progress?student=empty-student');
    
    // Wait for the table to load
    await page.waitForSelector('[data-testid="progress-table"]', { timeout: 10000 });
    
    // Take screenshot of empty state
    await expect(page.locator('[data-testid="progress-table"]')).toHaveScreenshot('progress-table-empty-state.png', {
      maxDiffPixels: 100,
      threshold: 0.2
    });
  });
});
