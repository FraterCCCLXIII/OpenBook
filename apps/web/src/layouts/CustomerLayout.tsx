import { Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CustomerHeader } from '../components/CustomerHeader';
import { ProtectedRoute } from '../auth/ProtectedRoute';

export function CustomerLayout() {
  const { t } = useTranslation();

  return (
    <ProtectedRoute guard="customer">
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <div className="border-b border-zinc-800 px-4 py-3">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <Link to="/customer/bookings" className="text-lg font-semibold">
              {t('app_name')}
            </Link>
            <span className="text-xs text-zinc-500">{t('nav_customer')}</span>
          </div>
        </div>
        <CustomerHeader />
        <main className="mx-auto max-w-6xl px-4 py-8">
          <Outlet />
        </main>
      </div>
    </ProtectedRoute>
  );
}
