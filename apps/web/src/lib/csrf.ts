/**
 * Optional CSRF (when API has `OPENBOOK_CSRF_ENABLED` and Vite `VITE_OPENBOOK_CSRF=true`).
 * Server issues token via `GET /api/auth/csrf-token` (cookie + JSON).
 */
let cachedToken: string | null = null;

export function getCsrfToken(): string | null {
  return cachedToken;
}

export async function ensureCsrfToken(): Promise<void> {
  if (import.meta.env.VITE_OPENBOOK_CSRF !== 'true') {
    return;
  }
  if (cachedToken) return;
  const res = await fetch('/api/auth/csrf-token', { credentials: 'include' });
  if (!res.ok) return;
  const data = (await res.json()) as { csrfToken?: string };
  cachedToken = data.csrfToken ?? null;
}

export function csrfHeaders(): Record<string, string> {
  if (!cachedToken) return {};
  return { 'X-CSRF-Token': cachedToken };
}
