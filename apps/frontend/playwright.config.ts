import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: '../../tests/frontend',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'https://localhost',
    trace: 'on-first-retry',
    ignoreHTTPSErrors: true, // For self-signed cert
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'docker compose up -d',
    url: 'https://localhost',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})

