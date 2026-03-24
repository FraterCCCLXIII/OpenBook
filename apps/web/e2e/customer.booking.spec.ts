import { test, expect } from '@playwright/test';

/**
 * Authenticated customer books via the "Book a New Appointment" flow on My Bookings.
 * Depends on `setup-customer` project storage state.
 */
test.describe('customer booking (authenticated)', () => {
  test('submits new appointment from bookings page', async ({ page }) => {
    await page.goto('/customer/bookings');
    await expect(page.getByRole('heading', { name: /my bookings/i })).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole('button', { name: /book.*appointment/i }).click();
    await expect(page.getByRole('heading', { name: /book a new appointment/i })).toBeVisible({
      timeout: 5_000,
    });

    await page.getByLabel(/service/i).selectOption({ index: 1 });
    await page.getByLabel(/provider/i).selectOption({ index: 1 });

    // Avoid colliding with the seeded appointment (+7d 10:00) in prisma/seed.ts.
    const future = new Date();
    future.setDate(future.getDate() + 14);
    future.setHours(10, 0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    const local = `${future.getFullYear()}-${pad(future.getMonth() + 1)}-${pad(future.getDate())}T${pad(future.getHours())}:${pad(future.getMinutes())}`;
    await page.getByLabel(/date.*time/i).fill(local);

    await page.getByRole('button', { name: /confirm booking/i }).click();

    await expect(page.getByRole('heading', { name: /my bookings/i })).toBeVisible({
      timeout: 20_000,
    });
  });
});
