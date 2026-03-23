import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test as setup, expect } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authDir = path.join(__dirname, '.auth');
mkdirSync(authDir, { recursive: true });
const authFile = path.join(authDir, 'staff.json');

/**
 * Persists staff cookie session for dependent projects (see playwright.config.ts).
 * Uses **admin** (not provider): provider role cannot view `/api/staff/services` in seed RBAC.
 * Seed: `admin` / `password` (apps/api/prisma/seed.ts).
 */
setup('staff login', async ({ page }) => {
  await page.goto('/staff/login');
  await page.locator('#username').fill('admin');
  await page.locator('#staff-password').fill('password');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/staff\/dashboard/);
  await page.context().storageState({ path: authFile });
});
