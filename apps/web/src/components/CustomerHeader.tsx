import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { LogOut } from 'lucide-react';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'text-sm font-medium transition-colors',
    isActive ? 'text-brand border-b-2 border-brand pb-0.5' : 'text-slate-600 hover:text-brand',
  ].join(' ');

export function CustomerHeader() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  if (user?.kind !== 'customer') {
    return null;
  }

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2">
        <nav className="flex flex-wrap items-center gap-4" aria-label="Customer account">
          <NavLink to="/customer/bookings" className={linkClass}>
            {t('my_bookings')}
          </NavLink>
          <NavLink to="/customer/forms" className={linkClass}>
            {t('customer_forms')}
          </NavLink>
          <NavLink to="/customer/account" className={linkClass}>
            {t('my_account')}
          </NavLink>
          <NavLink to="/customer/consents" className={linkClass}>
            Privacy
          </NavLink>
        </nav>
        <button
          type="button"
          onClick={() => void logout()}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-700"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          <Link to="/">{t('log_out')}</Link>
        </button>
      </div>
    </div>
  );
}
