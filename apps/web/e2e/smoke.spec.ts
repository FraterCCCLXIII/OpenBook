import { test, expect } from '@playwright/test';

test.describe('public (anonymous)', () => {
  test('home loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('book wizard loads', async ({ page }) => {
    await page.goto('/book');
    await expect(page.getByRole('heading', { name: /book/i })).toBeVisible();
  });
});

test.describe('customer area', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/customer/login');
    await expect(page.getByRole('heading', { name: /customer sign in/i })).toBeVisible();
  });

  test('protected customer route redirects to login', async ({ page }) => {
    await page.goto('/customer/bookings');
    await expect(page).toHaveURL(/\/customer\/login$/);
  });
});

test.describe('staff area', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/staff/login');
    await expect(page.getByRole('heading', { name: /staff sign in/i })).toBeVisible();
  });

  test('protected staff route redirects to login', async ({ page }) => {
    await page.goto('/staff/dashboard');
    await expect(page).toHaveURL(/\/staff\/login$/);
  });
});

test.describe('i18n', () => {
  test('customer login uses translated heading key', async ({ page }) => {
    await page.goto('/customer/login');
    await expect(page.locator('h1')).toContainText(/sign in/i);
  });
});
