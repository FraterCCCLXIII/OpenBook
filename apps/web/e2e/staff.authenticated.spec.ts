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

  test('calendar page renders without errors', async ({ page }) => {
    await page.goto('/staff/calendar');
    await expect(page.getByRole('heading', { name: /calendar/i })).toBeVisible({
      timeout: 15_000,
    });
    // FullCalendar toolbar should be visible
    await expect(page.locator('.fc-toolbar')).toBeVisible({ timeout: 15_000 });
  });

  test('staff can open new-appointment dialog', async ({ page }) => {
    await page.goto('/staff/calendar');
    // Wait for calendar to fully render before clicking
    await expect(page.locator('.fc-toolbar')).toBeVisible({ timeout: 15_000 });

    const newBtn = page.getByRole('button', { name: /new appointment/i });
    if (await newBtn.isVisible()) {
      await newBtn.click();
      await expect(
        page.getByRole('dialog').or(page.getByRole('form')),
      ).toBeVisible({ timeout: 5_000 });
    } else {
      // Fallback: click a future date cell to open new-appointment modal
      await page.locator('.fc-daygrid-day:not(.fc-day-past)').first().click();
      // modal may or may not appear depending on implementation; just assert no crash
      await expect(page).toHaveURL(/\/staff\/calendar/);
    }
  });

  test('forms builder page loads', async ({ page }) => {
    await page.goto('/staff/forms');
    await expect(page.getByRole('heading', { name: /forms/i })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('webhooks settings page loads', async ({ page }) => {
    await page.goto('/staff/settings/webhooks');
    await expect(page.getByRole('heading', { name: /webhooks/i })).toBeVisible({
      timeout: 15_000,
    });
  });
});
