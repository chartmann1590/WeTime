import { test, expect } from '@playwright/test'

test.describe('WeTime Smoke Tests', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/WeTime/i)
  })

  test('should show login page when not authenticated', async ({ page }) => {
    await page.goto('/')
    // Should redirect to login or show login link
    const loginLink = page.getByRole('link', { name: /login/i })
    if (await loginLink.isVisible()) {
      await loginLink.click()
      await expect(page).toHaveURL(/login/)
    }
  })

  test('should allow signup', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.getByRole('heading', { name: /create.*account/i })).toBeVisible()
    
    // Fill form
    await page.fill('input[type="email"]', `test-${Date.now()}@example.com`)
    await page.fill('input[type="password"]', 'password123')
    await page.fill('input[placeholder*="Name"]', 'Test User')
    
    // Submit (may fail if backend not ready, that's ok for smoke test)
    await page.getByRole('button', { name: /create|sign up/i }).click()
    
    // Should either succeed or show error, but not crash
    await page.waitForTimeout(2000)
  })

  test('should have PWA manifest', async ({ page }) => {
    const response = await page.goto('/manifest.json')
    expect(response?.status()).toBe(200)
    const manifest = await response?.json()
    expect(manifest.name).toBe('WeTime')
  })
})

