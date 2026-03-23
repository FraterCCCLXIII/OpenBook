import { test, expect } from '@playwright/test';
import { nextWeekdayIso } from './helpers/next-weekday';

test.describe('public booking (anonymous)', () => {
  test('completes guest booking wizard', async ({ page }) => {
    await page.goto('/book');
    await expect(
      page.getByRole('heading', { name: /book an appointment/i }),
    ).toBeVisible();

    await page.getByLabel('Booking service').selectOption({ index: 1 });
    await page.getByLabel('Booking provider').selectOption({ index: 1 });
    await page.getByRole('button', { name: /^continue$/i }).click();

    const bookingDate = nextWeekdayIso(3);
    await page.locator('input[type="date"]').fill(bookingDate);
    await page.getByRole('button', { name: /^continue$/i }).click();

    await expect(page.getByText(/loading slots/i)).toBeHidden({ timeout: 15_000 });
    const slotBtn = page.locator('ul.grid button').first();
    await expect(slotBtn).toBeVisible({ timeout: 15_000 });
    await slotBtn.click();

    await page.getByLabel('First name').fill('Playwright');
    await page.getByLabel('Last name').fill('Guest');
    await page.getByLabel('Email').fill('e2e-guest@example.com');
    await page.getByRole('button', { name: /confirm booking/i }).click();

    await expect(page.getByRole('heading', { name: /you.*re booked/i })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(/reference/i)).toBeVisible();
  });
});
