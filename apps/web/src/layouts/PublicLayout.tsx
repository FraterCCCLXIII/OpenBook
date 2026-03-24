import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  CircleUser,
  FileText,
  Languages,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
} from 'lucide-react';
import { OpenBookLogoMark } from '../components/OpenBookLogoMark';
import { useAuth } from '../auth/AuthContext';

async function fetchPublicSettings(): Promise<Record<string, string>> {
  const res = await fetch('/api/settings/public');
  if (!res.ok) return {};
  return res.json() as Promise<Record<string, string>>;
}

export function PublicLayout() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const onBookPage = location.pathname === '/book';

  const [langOpen, setLangOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { data: settings = {} } = useQuery({
    queryKey: ['settings', 'public'],
    queryFn: fetchPublicSettings,
    staleTime: 5 * 60 * 1000,
  });

  const companyLink = settings.company_link;
  const companyLogo = settings.company_logo;
  const companyName = settings.company_name;
  const showLanguage = settings.display_language_selector !== 'false';

  const isCustomer = user?.kind === 'customer';

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  async function handleLogout() {
    setUserMenuOpen(false);
    await logout();
    navigate('/', { replace: true });
  }

  const menuLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'block rounded-md px-3 py-2 text-sm transition-colors',
      isActive
        ? 'bg-slate-100 font-medium text-slate-900'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
    ].join(' ');

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      {/* Booking top nav — 3-column: [return to site] [logo] [account / language] */}
      <nav
        id="booking-top-nav"
        className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur"
        aria-label="Booking"
      >
        <div className="flex w-full items-center px-4 py-3">
          {/* Left: Back (booking page + logged in) or Return to site */}
          <div className="flex w-1/3 items-center justify-start">
            {isCustomer && onBookPage ? (
              <Link
                to="/customer/dashboard"
                className="inline-flex h-9 items-center rounded-xl border border-slate-200 px-4 text-sm leading-none text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Back
              </Link>
            ) : companyLink ? (
              <a
                href={companyLink}
                className="inline-flex items-center rounded-xl border border-slate-200 px-3 py-1 text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
              >
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                Return to Site
              </a>
            ) : null}
          </div>

          {/* Center: Company logo */}
          <div className="flex w-1/3 justify-center text-slate-900">
            <Link to="/" aria-label={companyName ?? t('app_name')}>
              {companyLogo ? (
                <img
                  src={companyLogo}
                  alt={companyName ?? t('app_name')}
                  className="block h-8 w-auto"
                />
              ) : (
                <OpenBookLogoMark className="block h-8 w-auto" />
              )}
            </Link>
          </div>

          {/* Right: User dropdown (if customer logged in) or language selector */}
          <div className="flex w-1/3 justify-end">
            {isCustomer ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  id="customer-account-dropdown"
                  onClick={() => setUserMenuOpen((o) => !o)}
                  aria-expanded={userMenuOpen}
                  aria-controls="customer-account-dropdown-menu"
                  aria-haspopup="menu"
                  className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  <CircleUser className="h-[18px] w-[18px]" aria-hidden="true" />
                  <ChevronDown className="h-2 w-2" aria-hidden="true" />
                </button>

                {userMenuOpen && (
                  <ul
                    id="customer-account-dropdown-menu"
                    className="booking-dropdown"
                    role="menu"
                    aria-labelledby="customer-account-dropdown"
                  >
                    <li role="none">
                      <NavLink
                        to="/customer/dashboard"
                        className={menuLinkClass}
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <span className="flex items-center gap-2">
                          <LayoutDashboard className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                          Dashboard
                        </span>
                      </NavLink>
                    </li>
                    <li role="none">
                      <NavLink
                        to="/customer/bookings"
                        className={menuLinkClass}
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <span className="flex items-center gap-2">
                          <CalendarDays className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                          My Bookings
                        </span>
                      </NavLink>
                    </li>
                    <li role="none">
                      <NavLink
                        to="/customer/forms"
                        className={menuLinkClass}
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <span className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                          Forms
                        </span>
                      </NavLink>
                    </li>
                    <li role="none">
                      <NavLink
                        to="/customer/account"
                        className={menuLinkClass}
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <span className="flex items-center gap-2">
                          <Settings className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                          Account Settings
                        </span>
                      </NavLink>
                    </li>
                    <li role="none">
                      <NavLink
                        to="/customer/consents"
                        className={menuLinkClass}
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <span className="flex items-center gap-2">
                          <Shield className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                          Privacy
                        </span>
                      </NavLink>
                    </li>

                    {showLanguage && (
                      <>
                        <li role="separator">
                          <hr className="my-1.5 border-slate-100" />
                        </li>
                        <li className="px-3 py-1.5" role="none">
                          <small className="mb-1 block text-xs text-slate-500">
                            {t('language')}
                          </small>
                          <select
                            className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-700 outline-none focus:border-brand focus:ring-1 focus:ring-brand/20"
                            value={i18n.language}
                            onChange={(e) => void i18n.changeLanguage(e.target.value)}
                          >
                            <option value="en">English</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                            <option value="de">German</option>
                          </select>
                        </li>
                      </>
                    )}

                    <li role="separator">
                      <hr className="my-1.5 border-slate-100" />
                    </li>
                    <li role="none">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => void handleLogout()}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                      >
                        <LogOut className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                        {t('log_out')}
                      </button>
                    </li>
                  </ul>
                )}
              </div>
            ) : showLanguage ? (
              <div className="relative" ref={langRef}>
                <button
                  type="button"
                  onClick={() => setLangOpen((o) => !o)}
                  className="inline-flex items-center text-slate-600 transition hover:text-slate-900"
                  aria-expanded={langOpen}
                  aria-haspopup="listbox"
                  aria-label={t('language')}
                >
                  <Languages className="h-4 w-4" aria-hidden="true" />
                </button>

                {langOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
                    role="dialog"
                    aria-label="Language selection"
                  >
                    <p className="mb-1 px-2 text-xs text-slate-500">{t('language')}</p>
                    <select
                      className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-brand focus:ring-1 focus:ring-brand/20"
                      value={i18n.language}
                      onChange={(e) => {
                        void i18n.changeLanguage(e.target.value);
                        setLangOpen(false);
                      }}
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
