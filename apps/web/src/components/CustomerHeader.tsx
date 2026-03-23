import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';

export function CustomerHeader() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  if (user?.kind !== 'customer') {
    return null;
  }

  return (
    <header className="border-b border-zinc-800 bg-zinc-900/50">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <div className="flex flex-wrap gap-3 text-sm">
          <Link to="/customer/bookings" className="text-emerald-400 hover:underline">
            {t('my_bookings')}
          </Link>
          <Link to="/customer/forms" className="text-emerald-400 hover:underline">
            {t('customer_forms')}
          </Link>
          <Link to="/customer/account" className="text-emerald-400 hover:underline">
            {t('my_account')}
          </Link>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="text-sm text-zinc-400 hover:text-zinc-200"
        >
          {t('log_out')}
        </button>
      </div>
    </header>
  );
}
