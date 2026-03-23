import { Outlet } from 'react-router-dom';
import { StaffSidebar } from '../components/StaffSidebar';
import { ProtectedRoute } from '../auth/ProtectedRoute';

export function StaffShell() {
  return (
    <ProtectedRoute guard="staff">
      <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
        <StaffSidebar />
        <main className="min-h-screen flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </ProtectedRoute>
  );
}
