import type { NextFunction, Request, Response } from 'express';
import { csrfMiddleware } from './csrf.middleware';

describe('csrfMiddleware', () => {
  const prev = process.env.OPENBOOK_CSRF_ENABLED;
  const prevToken = process.env.OPENBOOK_API_TOKEN;

  afterEach(() => {
    process.env.OPENBOOK_CSRF_ENABLED = prev;
    process.env.OPENBOOK_API_TOKEN = prevToken;
  });

  function mockReq(
    partial: Partial<Request> & {
      method?: string;
      path?: string;
      cookies?: Record<string, string>;
      headers?: Record<string, string | undefined>;
    },
  ): Request {
    return partial as Request;
  }

  it('calls next when CSRF is disabled', () => {
    delete process.env.OPENBOOK_CSRF_ENABLED;
    const next = jest.fn() as NextFunction;
    const res = {} as Response;
    csrfMiddleware(
      mockReq({ method: 'POST', path: '/api/x', cookies: {} }),
      res,
      next,
    );
    expect(next).toHaveBeenCalled();
  });

  it('calls next for safe methods when CSRF is enabled', () => {
    process.env.OPENBOOK_CSRF_ENABLED = 'true';
    const next = jest.fn() as NextFunction;
    csrfMiddleware(
      mockReq({ method: 'GET', path: '/api/x', cookies: {} }),
      {} as Response,
      next,
    );
    expect(next).toHaveBeenCalled();
  });

  it('returns 403 when CSRF is enabled and tokens mismatch', () => {
    process.env.OPENBOOK_CSRF_ENABLED = '1';
    const next = jest.fn() as NextFunction;
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const res = { status } as unknown as Response;

    csrfMiddleware(
      mockReq({
        method: 'POST',
        path: '/api/staff/x',
        cookies: { openbook_csrf: 'aaaaaaaa' },
        headers: { 'x-csrf-token': 'bbbbbbbb' },
      }),
      res,
      next,
    );

    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next when cookie and header match', () => {
    process.env.OPENBOOK_CSRF_ENABLED = 'true';
    const next = jest.fn() as NextFunction;
    const token = 'openbook-test-token-123456';
    csrfMiddleware(
      mockReq({
        method: 'POST',
        path: '/api/x',
        cookies: { openbook_csrf: token },
        headers: { 'x-csrf-token': token },
      }),
      {} as Response,
      next,
    );
    expect(next).toHaveBeenCalled();
  });
});
