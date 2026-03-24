import type { NextFunction, Request, Response } from 'express';

const COOKIE = 'openbook_csrf';
const HEADER = 'x-csrf-token';

function isCsrfEnabled(): boolean {
  const v = process.env.OPENBOOK_CSRF_ENABLED?.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

function shouldSkip(req: Request): boolean {
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return true;
  }

  const path = req.path ?? req.url?.split('?')[0] ?? '';

  if (path.includes('/stripe/webhook')) {
    return true;
  }
  if (path.endsWith('/auth/csrf-token')) {
    return true;
  }

  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice(7).trim();
    const expected = process.env.OPENBOOK_API_TOKEN?.trim();
    if (expected && token === expected) {
      return true;
    }
  }

  return false;
}

/**
 * Optional double-submit CSRF check when `OPENBOOK_CSRF_ENABLED=true`.
 * Expects cookie `openbook_csrf` and matching header `X-CSRF-Token` (from GET `/api/auth/csrf-token`).
 */
export function csrfMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!isCsrfEnabled()) {
    next();
    return;
  }
  if (shouldSkip(req)) {
    next();
    return;
  }

  const cookieVal =
    typeof req.cookies === 'object' && req.cookies
      ? (req.cookies[COOKIE] as string | undefined)
      : undefined;
  const headerVal =
    (req.headers[HEADER] as string | undefined) ||
    (req.headers['X-CSRF-Token'] as string | undefined);

  if (
    !cookieVal ||
    !headerVal ||
    typeof cookieVal !== 'string' ||
    typeof headerVal !== 'string' ||
    cookieVal.length < 8 ||
    cookieVal !== headerVal
  ) {
    res.status(403).json({
      statusCode: 403,
      message: 'Invalid or missing CSRF token',
      error: 'Forbidden',
    });
    return;
  }

  next();
}
