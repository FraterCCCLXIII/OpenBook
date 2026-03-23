import { Outlet } from 'react-router-dom';
import { ProtectedRoute } from '../auth/ProtectedRoute';

/**
 * Auth guard for all /customer/* portal routes.
 * Navigation is provided by the parent PublicLayout.
 */
export function CustomerLayout() {
  return (
    <ProtectedRoute guard="customer">
      <Outlet />
    </ProtectedRoute>
  );
}
