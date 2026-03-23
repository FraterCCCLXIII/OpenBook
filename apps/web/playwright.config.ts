import { defineConfig, devices } from '@playwright/test';

const webPort = process.env.CI ? 5174 : 5173;
const baseURL = `http://127.0.0.1:${webPort}`;

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/globalSetup',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  projects: [
    {
      name: 'setup-staff',
      testMatch: /staff\.setup\.ts/,
    },
    {
      name: 'setup-customer',
      testMatch: /customer\.setup\.ts/,
    },
    {
      name: 'smoke',
      testMatch: /smoke\.spec\.ts/,
    },
    {
      name: 'booking',
      testMatch: /booking\.flow\.spec\.ts/,
    },
    {
      name: 'staff-authed',
      testMatch: /staff\.authenticated\.spec\.ts/,
      dependencies: ['setup-staff'],
      use: {
        baseURL,
        trace: 'on-first-retry',
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/staff.json',
      },
    },
    {
      name: 'customer-authed',
      testMatch: /customer\.authenticated\.spec\.ts/,
      dependencies: ['setup-customer'],
      use: {
        baseURL,
        trace: 'on-first-retry',
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/customer.json',
      },
    },
  ],
  use: {
    baseURL,
    trace: 'on-first-retry',
    ...devices['Desktop Chrome'],
  },
  webServer: process.env.CI
    ? {
        command: `pnpm exec vite preview --host 127.0.0.1 --port ${webPort}`,
        url: baseURL,
        reuseExistingServer: false,
        timeout: 120_000,
      }
    : {
        command: 'pnpm dev',
        url: 'http://127.0.0.1:5173',
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
