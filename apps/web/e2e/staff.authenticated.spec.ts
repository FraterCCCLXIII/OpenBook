import { test, expect } from '@playwright/test';

test.describe('staff (authenticated)', () => {
  test('dashboard loads when session present', async ({ page }) => {
    await page.goto('/staff/dashboard');
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('services list returns data when API reachable', async ({ page }) => {
    await page.goto('/staff/services');
    await expect(page.getByRole('heading', { name: /services/i })).toBeVisible();
    await expect(page.getByText(/consultation/i)).toBeVisible({ timeout: 15_000 });
  });
});
