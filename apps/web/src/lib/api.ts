import { csrfHeaders, ensureCsrfToken } from './csrf';

/** JSON fetch with session cookies (staff / customer). */
export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? 'GET').toUpperCase();
  if (method !== 'GET' && method !== 'HEAD') {
    await ensureCsrfToken();
  }
  const res = await fetch(path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...csrfHeaders(),
      ...init?.headers,
    },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** Multipart POST (do not set Content-Type; browser sets boundary). */
export async function apiForm<T>(path: string, formData: FormData): Promise<T> {
  await ensureCsrfToken();
  const res = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers: {
      ...csrfHeaders(),
    },
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}
