import { test, expect } from '@playwright/test';

test.describe('customer (authenticated)', () => {
  test('bookings page lists seeded appointment', async ({ page }) => {
    await page.goto('/customer/bookings');
    await expect(page.getByRole('heading', { name: /my bookings/i })).toBeVisible();
    await expect(page.getByText(/consultation/i)).toBeVisible({ timeout: 15_000 });
  });

  test('account page loads', async ({ page }) => {
    await page.goto('/customer/account');
    await expect(page.getByRole('heading', { name: /my account/i })).toBeVisible({
      timeout: 15_000,
    });
  });
});
