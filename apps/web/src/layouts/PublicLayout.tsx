import { Link, NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-zinc-800 text-zinc-50'
      : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200',
  ].join(' ');

export function PublicLayout() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link to="/" className="block text-lg font-semibold tracking-tight text-zinc-50">
              {t('app_name')}
            </Link>
            <p className="text-xs text-zinc-500">{t('nav_public')}</p>
          </div>
          <nav className="flex flex-wrap items-center gap-1" aria-label="Public navigation">
            <NavLink to="/book" className={linkClass}>
              {t('book')}
            </NavLink>
            <span className="mx-2 text-zinc-700">|</span>
            <NavLink to="/customer/login" className={linkClass}>
              {t('sign_in')}
            </NavLink>
            <NavLink to="/staff/login" className={linkClass}>
              {t('staff_sign_in')}
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
