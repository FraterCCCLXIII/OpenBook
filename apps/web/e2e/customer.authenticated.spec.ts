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

  test('customer can open Book Appointment modal', async ({ page }) => {
    await page.goto('/customer/bookings');
    await expect(page.getByRole('heading', { name: /my bookings/i })).toBeVisible({ timeout: 15_000 });

    const bookBtn = page.getByRole('button', { name: /book.*appointment/i });
    await expect(bookBtn).toBeVisible({ timeout: 10_000 });
    await bookBtn.click();

    // Modal or form should appear
    await expect(
      page.getByRole('dialog').or(page.locator('form').filter({ hasText: /service/i })),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('consents page loads', async ({ page }) => {
    await page.goto('/customer/consents');
    await expect(
      page.getByRole('heading', { name: /privacy|consent/i }),
    ).toBeVisible({ timeout: 15_000 });
  });
});
