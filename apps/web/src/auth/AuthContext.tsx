/* eslint-disable react-refresh/only-export-components -- AuthProvider + useAuth hook */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AuthUser, StaffUser } from '../types/auth';
import { csrfHeaders, ensureCsrfToken } from '../lib/csrf';

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  error: Error | null;
};

type AuthContextValue = AuthState & {
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  staffLogin: (username: string, password: string) => Promise<void>;
  customerLogin: (email: string, password: string) => Promise<void>;
  customerRegister: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function nestErrorMessage(body: unknown, fallback: string): string {
  if (typeof body === 'object' && body !== null && 'message' in body) {
    const m = (body as { message: unknown }).message;
    if (typeof m === 'string') {
      return m;
    }
    if (Array.isArray(m) && m.length > 0) {
      return String(m[0]);
    }
  }
  return fallback;
}

async function fetchMe(): Promise<AuthUser | null> {
  const res = await fetch('/api/auth/me', { credentials: 'include' });
  if (!res.ok) {
    throw new Error('Failed to load session');
  }
  const data: unknown = await res.json();
  if (
    typeof data === 'object' &&
    data !== null &&
    'user' in data &&
    (data as { user: AuthUser | null }).user
  ) {
    return (data as { user: AuthUser }).user;
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const u = await fetchMe();
      setUser(u);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (import.meta.env.VITE_OPENBOOK_CSRF === 'true') {
      void ensureCsrfToken();
    }
  }, []);

  const logout = useCallback(async () => {
    await ensureCsrfToken();
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: { ...csrfHeaders() },
    });
    setUser(null);
  }, []);

  const staffLogin = useCallback(async (username: string, password: string) => {
    await ensureCsrfToken();
    const res = await fetch('/api/auth/staff/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(nestErrorMessage(err, 'Staff login failed'));
    }
    const data = (await res.json()) as { user: StaffUser };
    setUser(data.user);
  }, []);

  const customerLogin = useCallback(async (email: string, password: string) => {
    await ensureCsrfToken();
    const res = await fetch('/api/auth/customer/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(nestErrorMessage(err, 'Customer login failed'));
    }
    const data = (await res.json()) as { user: AuthUser };
    setUser(data.user);
  }, []);

  const customerRegister = useCallback(
    async (email: string, password: string, firstName: string, lastName: string) => {
      await ensureCsrfToken();
      const res = await fetch('/api/auth/customer/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...csrfHeaders() },
        body: JSON.stringify({
          email,
          password,
          first_name: firstName,
          last_name: lastName,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(nestErrorMessage(err, 'Registration failed'));
      }
      const data = (await res.json()) as { user: AuthUser };
      setUser(data.user);
    },
    [],
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      refresh,
      logout,
      staffLogin,
      customerLogin,
      customerRegister,
    }),
    [user, loading, error, refresh, logout, staffLogin, customerLogin, customerRegister],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
