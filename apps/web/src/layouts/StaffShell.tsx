import { Outlet } from 'react-router-dom';
import { StaffSidebar } from '../components/StaffSidebar';
import { ProtectedRoute } from '../auth/ProtectedRoute';

export function StaffShell() {
  return (
    <ProtectedRoute guard="staff">
      <div className="flex h-dvh overflow-hidden bg-zinc-950 text-zinc-100">
        <StaffSidebar />
        <main className="flex h-full flex-1 flex-col overflow-y-auto">
          <div className="flex flex-1 flex-col p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
