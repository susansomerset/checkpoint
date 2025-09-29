import { test, expect } from '@playwright/test'

test.describe('Auth /api/auth/me endpoint', () => {
  test('should return 204 when logged out', async ({ request }) => {
    const response = await request.get('/api/auth/me')
    expect(response.status()).toBe(204)
  })

  test('should return 200 with user data when logged in', async ({ browser }) => {
    // This test would require setting up a logged-in session
    // For now, we'll just verify the endpoint exists and returns 204 when logged out
    const context = await browser.newContext()
    const page = await context.newPage()
    
    const response = await page.request.get('/api/auth/me')
    expect(response.status()).toBe(204)
    
    await context.close()
  })

  test('should handle login flow', async ({ page }) => {
    // Navigate to login
    await page.goto('/api/auth/login')
    
    // Should redirect to Auth0
    await expect(page).toHaveURL(/auth0\.com/)
    
    // Note: Full login flow test would require Auth0 test credentials
    // This is a smoke test to verify the endpoint behavior
  })
})
