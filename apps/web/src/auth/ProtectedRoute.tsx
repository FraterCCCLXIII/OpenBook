import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import type { AuthUser } from '../types/auth';

type Guard = 'staff' | 'customer';

function matches(user: AuthUser | null, guard: Guard): boolean {
  if (!user) {
    return false;
  }
  if (guard === 'staff') {
    return user.kind === 'staff';
  }
  return user.kind === 'customer';
}

export function ProtectedRoute({
  guard,
  children,
}: {
  guard: Guard;
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Render immediately if the user already matches — avoids blocking the UI
  // during a background auth/me refresh (e.g. right after login navigation).
  if (matches(user, guard)) {
    return <>{children}</>;
  }

  // Initial session check still in-flight and no user yet — show placeholder.
  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-zinc-500">
        Loading session…
      </div>
    );
  }

  // Definitively unauthenticated — redirect to login.
  const to = guard === 'staff' ? '/staff/login' : '/customer/login';
  return <Navigate to={to} state={{ from: location.pathname }} replace />;
}
