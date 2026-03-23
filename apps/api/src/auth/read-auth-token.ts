import type { Request } from 'express';

/** Cookie `ob_auth` or `Authorization: Bearer`. */
export function readAuthToken(req: Request): string | null {
  const cookies = req.cookies as Record<string, string> | undefined;
  const fromCookie = cookies?.['ob_auth'];
  if (fromCookie) {
    return fromCookie;
  }
  const auth = req.headers.authorization;
  if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
    return auth.slice(7);
  }
  return null;
}
