/**
 * Playwright global setup.
 * Logs in as staff and customer via headless Chromium, persisting storage state
 * to e2e/.auth/{staff,customer}.json for authenticated test projects.
 *
 * Env vars used:
 *   STAFF_EMAIL     (default: admin)
 *   STAFF_PASSWORD  (default: password)
 *   CUSTOMER_EMAIL  (default: customer@example.com)
 *   CUSTOMER_PASSWORD (default: password)
 *   BASE_URL        (default: http://127.0.0.1:5173)
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authDir = path.join(__dirname, '.auth');

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5173';
const STAFF_EMAIL = process.env.STAFF_EMAIL ?? 'admin';
const STAFF_PASSWORD = process.env.STAFF_PASSWORD ?? 'password';
const CUSTOMER_EMAIL = process.env.CUSTOMER_EMAIL ?? 'customer@example.com';
const CUSTOMER_PASSWORD = process.env.CUSTOMER_PASSWORD ?? 'password';

async function saveStaffState(browser: Awaited<ReturnType<typeof chromium.launch>>) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/staff/login`);
  await page.locator('#username').fill(STAFF_EMAIL);
  await page.locator('#staff-password').fill(STAFF_PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/staff\/dashboard/, { timeout: 30_000 });
  await context.storageState({ path: path.join(authDir, 'staff.json') });
  await context.close();
}

async function saveCustomerState(browser: Awaited<ReturnType<typeof chromium.launch>>) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/customer/login`);
  await page.locator('#email').fill(CUSTOMER_EMAIL);
  await page.locator('#password').fill(CUSTOMER_PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/customer\/bookings/, { timeout: 30_000 });
  await context.storageState({ path: path.join(authDir, 'customer.json') });
  await context.close();
}

export default async function globalSetup() {
  mkdirSync(authDir, { recursive: true });
  const browser = await chromium.launch();
  try {
    await saveStaffState(browser);
    await saveCustomerState(browser);
  } finally {
    await browser.close();
  }
}
