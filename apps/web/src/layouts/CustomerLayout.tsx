import { useQuery } from '@tanstack/react-query';
import { Link, Outlet } from 'react-router-dom';
import { ProtectedRoute } from '../auth/ProtectedRoute';
import { useAuth } from '../auth/AuthContext';

async function fetchPublicSettings(): Promise<Record<string, string>> {
  const res = await fetch('/api/settings/public');
  if (!res.ok) return {};
  return res.json() as Promise<Record<string, string>>;
}

function CustomerPortalDisabledNotice() {
  const { logout } = useAuth();
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <h1 className="text-xl font-semibold text-slate-900">Customer portal unavailable</h1>
      <p className="text-sm text-slate-600">
        This site has turned off the customer portal. You can no longer access your account
        here until an administrator turns it back on.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={() => void logout()}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50"
        >
          Sign out
        </button>
        <Link
          to="/"
          className="rounded-lg bg-[var(--color-brand,#0f766e)] px-4 py-2 text-sm font-medium text-white hover:opacity-95"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}

function CustomerPortalGate({ children }: { children: React.ReactNode }) {
  const { data: settings = {}, isPending } = useQuery({
    queryKey: ['settings', 'public'],
    queryFn: fetchPublicSettings,
    staleTime: 60 * 1000,
  });

  if (isPending) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  if (settings.customer_login_enabled !== '1') {
    return <CustomerPortalDisabledNotice />;
  }

  return <>{children}</>;
}

/**
 * Auth guard for all /customer/* portal routes (except login/register, which live outside).
 * Navigation is provided by the parent PublicLayout.<br>
 * When `customer_login_enabled` is not on, signed-in customers see a notice instead of portal content.
 */
export function CustomerLayout() {
  return (
    <ProtectedRoute guard="customer">
      <CustomerPortalGate>
        <Outlet />
      </CustomerPortalGate>
    </ProtectedRoute>
  );
}
