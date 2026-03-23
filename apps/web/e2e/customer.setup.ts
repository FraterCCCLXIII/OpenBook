import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test as setup, expect } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authDir = path.join(__dirname, '.auth');
mkdirSync(authDir, { recursive: true });
const authFile = path.join(authDir, 'customer.json');

/**
 * Persists customer cookie session for dependent projects (see playwright.config.ts).
 * Matches seed: customer@example.com / password (apps/api/prisma/seed.ts).
 */
setup('customer login', async ({ page }) => {
  await page.goto('/customer/login');
  await page.locator('#email').fill('customer@example.com');
  await page.locator('#password').fill('password');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/customer\/bookings/);
  await page.context().storageState({ path: authFile });
});
