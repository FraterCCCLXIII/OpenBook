/**
 * Playwright global setup.
 *
 * Auth `storageState` files are written by the **setup-staff** and **setup-customer**
 * project tests (`staff.setup.ts`, `customer.setup.ts`) after the dev server is up.
 * This hook only ensures the output directory exists so those projects can write safely.
 *
 * Env vars for setup projects (see `staff.setup.ts` / `customer.setup.ts`):
 *   STAFF_EMAIL, STAFF_PASSWORD, CUSTOMER_EMAIL, CUSTOMER_PASSWORD, BASE_URL
 */
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function globalSetup() {
  mkdirSync(path.join(__dirname, '.auth'), { recursive: true });
}
