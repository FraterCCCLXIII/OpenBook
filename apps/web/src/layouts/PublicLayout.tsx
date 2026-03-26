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
import { CookieBanner } from '../components/CookieBanner';
import { useAuth } from '../auth/AuthContext';
import { hexToDarkenedRgb, normalizeBrandHex } from '../lib/brandColor';

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

  const { data: legalSettings = {} } = useQuery({
    queryKey: ['settings', 'legal', 'public'],
    queryFn: async () => {
      const res = await fetch('/api/settings/legal');
      if (!res.ok) return {} as Record<string, string>;
      return res.json() as Promise<Record<string, string>>;
    },
    staleTime: 5 * 60 * 1000,
  });

  const showTerms =
    legalSettings.display_terms_and_conditions === '1' &&
    !!legalSettings.terms_and_conditions_content?.trim();
  const showPrivacy =
    legalSettings.display_privacy_policy === '1' &&
    !!legalSettings.privacy_policy_content?.trim();
  const showCookieBanner =
    legalSettings.display_cookie_notice === '1' &&
    !!legalSettings.cookie_notice_content?.trim();
  const hasFooterLinks = showTerms || showPrivacy;

  const companyLink = settings.company_link;
  const companyLogo = settings.company_logo;
  const companyName = settings.company_name;
  const brandHex = normalizeBrandHex(settings.company_color);
  const theme = settings.theme ?? 'default';
  /** Only `dark` changes the shell; `default` and `light` both use the light palette. */
  const isDark = theme === 'dark';
  const showLanguage = settings.display_language_selector !== '0';
  const showLoginButton = settings.display_login_button !== '0';

  useEffect(() => {
    const lang = settings.default_language?.trim();
    if (lang && i18n.language !== lang) {
      void i18n.changeLanguage(lang);
    }
  }, [settings.default_language, i18n]);

  useEffect(() => {
    document.documentElement.dataset.publicTheme = isDark ? 'dark' : 'light';
    return () => {
      delete document.documentElement.dataset.publicTheme;
    };
  }, [isDark]);

  useEffect(() => {
    if (brandHex) {
      document.documentElement.style.setProperty('--color-brand', brandHex);
      document.documentElement.style.setProperty('--color-brand-dark', hexToDarkenedRgb(brandHex));
    } else {
      document.documentElement.style.removeProperty('--color-brand');
      document.documentElement.style.removeProperty('--color-brand-dark');
    }
  }, [brandHex]);

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
        ? isDark
          ? 'bg-slate-700 font-medium text-white'
          : 'bg-slate-100 font-medium text-slate-900'
        : isDark
          ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
    ].join(' ');

  const shellClass = isDark
    ? 'flex min-h-screen flex-col bg-slate-950 text-slate-100'
    : 'flex min-h-screen flex-col bg-slate-50 text-slate-900';

  const navSurface = isDark
    ? 'border-slate-800 bg-slate-950/95 backdrop-blur'
    : 'border-slate-200 bg-white/90 backdrop-blur';

  const outlineBtn = isDark
    ? 'border-slate-600 text-slate-300 hover:border-slate-500 hover:text-white'
    : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800';

  const navBrandBorder =
    brandHex && !isDark ? ({ borderBottomColor: `${brandHex}66` } as const) : undefined;
  const navBrandBorderDark =
    brandHex && isDark ? ({ borderBottomColor: `${brandHex}44` } as const) : undefined;

  const accountTrigger = isDark
    ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900';

  const langTrigger = isDark
    ? 'text-slate-300 hover:text-white'
    : 'text-slate-600 hover:text-slate-900';

  const popoverSurface = isDark
    ? 'border-slate-700 bg-slate-900 shadow-xl'
    : 'border-slate-200 bg-white shadow-lg';

  const footerSurface = isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white';

  const footerLink = isDark
    ? 'text-xs text-slate-400 transition hover:text-slate-200 hover:underline'
    : 'text-xs text-slate-500 transition hover:text-slate-800 hover:underline';

  const selectMenu = isDark
    ? 'w-full rounded-lg border border-slate-600 bg-slate-900 px-2 py-1 text-sm text-slate-200 outline-none focus:border-brand focus:ring-1 focus:ring-brand/20'
    : 'w-full rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-700 outline-none focus:border-brand focus:ring-1 focus:ring-brand/20';

  const selectMenuLg = isDark
    ? 'w-full rounded-lg border border-slate-600 bg-slate-900 px-2 py-1.5 text-sm text-slate-200 outline-none focus:border-brand focus:ring-1 focus:ring-brand/20'
    : 'w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-700 outline-none focus:border-brand focus:ring-1 focus:ring-brand/20';

  const menuSep = isDark ? 'border-slate-700' : 'border-slate-100';
  const menuHr = `my-1.5 border-0 border-t ${menuSep}`;

  const menuMuted = isDark ? 'text-slate-500' : 'text-slate-500';

  const logoutBtn = isDark
    ? 'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white'
    : 'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900';

  return (
    <div className={shellClass}>
      {/* Booking top nav — 3-column: [return to site] [logo] [account / language] */}
      <nav
        id="booking-top-nav"
        className={`sticky top-0 z-50 border-b ${navSurface}`}
        style={isDark ? navBrandBorderDark : navBrandBorder}
        aria-label="Booking"
      >
        <div className="flex w-full items-center px-4 py-3">
          {/* Left: Back (booking page + logged in) or Return to site */}
          <div className="flex w-1/3 items-center justify-start">
            {isCustomer && onBookPage ? (
              <Link
                to="/customer/dashboard"
                className={`inline-flex h-9 items-center rounded-xl border px-4 text-sm leading-none transition ${outlineBtn}`}
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Back
              </Link>
            ) : companyLink ? (
              <a
                href={companyLink}
                className={`inline-flex items-center rounded-xl border px-3 py-1 text-sm transition ${outlineBtn}`}
              >
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                Return to Site
              </a>
            ) : null}
          </div>

          {/* Center: Company logo */}
          <div className={`flex w-1/3 justify-center ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
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

          {/* Right: Login link, user dropdown, or language selector */}
          <div className="flex w-1/3 justify-end items-center gap-2">
            {!isCustomer && showLoginButton && (
              <Link
                to="/customer/login"
                className={`rounded-xl border px-3 py-1 text-sm transition ${outlineBtn}`}
              >
                Log in
              </Link>
            )}
            {isCustomer ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  id="customer-account-dropdown"
                  onClick={() => setUserMenuOpen((o) => !o)}
                  aria-expanded={userMenuOpen}
                  aria-controls="customer-account-dropdown-menu"
                  aria-haspopup="menu"
                  className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 transition ${accountTrigger}`}
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
                          <hr className={menuHr} />
                        </li>
                        <li className="px-3 py-1.5" role="none">
                          <small className={`mb-1 block text-xs ${menuMuted}`}>
                            {t('language')}
                          </small>
                          <select
                            className={selectMenu}
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
                      <hr className={menuHr} />
                    </li>
                    <li role="none">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => void handleLogout()}
                        className={logoutBtn}
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
                  className={`inline-flex items-center transition ${langTrigger}`}
                  aria-expanded={langOpen}
                  aria-haspopup="listbox"
                  aria-label={t('language')}
                >
                  <Languages className="h-4 w-4" aria-hidden="true" />
                </button>

                {langOpen && (
                  <div
                    className={`absolute right-0 top-full mt-2 w-48 rounded-xl border p-2 ${popoverSurface}`}
                    role="dialog"
                    aria-label="Language selection"
                  >
                    <p className={`mb-1 px-2 text-xs ${menuMuted}`}>{t('language')}</p>
                    <select
                      className={selectMenuLg}
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

      {hasFooterLinks && (
        <footer className={`border-t py-4 ${footerSurface}`}>
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-4 px-4">
            {showTerms && (
              <Link to="/terms" className={footerLink}>
                Terms &amp; Conditions
              </Link>
            )}
            {showPrivacy && (
              <Link to="/privacy" className={footerLink}>
                Privacy Policy
              </Link>
            )}
          </div>
        </footer>
      )}

      {showCookieBanner && (
        <CookieBanner content={legalSettings.cookie_notice_content} variant={isDark ? 'dark' : 'light'} />
      )}
    </div>
  );
}
