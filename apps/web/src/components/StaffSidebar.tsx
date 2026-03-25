import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { LucideIcon } from 'lucide-react';
import {
  Briefcase,
  Calendar,
  ChevronDown,
  CreditCard,
  ExternalLink,
  LayoutDashboard,
  List,
  LogOut,
  PanelLeft,
  ScrollText,
  Settings,
  Tags,
  User,
  UserCog,
  UserPen,
  UserStar,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { canViewStaff } from '../auth/staffPermissions';
import { OpenBookLogoMark } from './OpenBookLogoMark';

const STORAGE_KEY = 'staff-sidebar-collapsed';

function itemClass(isActive: boolean, collapsed: boolean) {
  return [
    'flex items-center rounded-lg py-2 text-sm font-medium',
    collapsed ? 'justify-center px-2' : 'gap-2 px-3',
    isActive ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100',
  ].join(' ');
}

function SidebarNavLink({
  to,
  end,
  label,
  collapsed,
  icon: Icon,
}: {
  to: string;
  end?: boolean;
  label: string;
  collapsed: boolean;
  icon: LucideIcon;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      className={({ isActive }) => itemClass(isActive, collapsed)}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );
}

function SidebarUserMenu({ collapsed }: { collapsed: boolean }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!user || user.kind !== 'staff') return null;
  const staff = user;

  const displayName = [staff.firstName, staff.lastName].filter(Boolean).join(' ') || staff.email || 'Account';

  return (
    <div ref={ref} className="relative px-2 pb-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={collapsed ? displayName : undefined}
        aria-label={displayName}
        aria-expanded={open}
        className={[
          'flex w-full items-center rounded-lg py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800/70 hover:text-zinc-100',
          collapsed ? 'justify-center px-2' : 'gap-2 px-3',
        ].join(' ')}
      >
        <User className="h-4 w-4 shrink-0" aria-hidden />
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1 truncate text-left">{displayName}</span>
            <ChevronDown
              className={['h-3.5 w-3.5 shrink-0 transition-transform', open ? 'rotate-180' : ''].join(' ')}
              aria-hidden
            />
          </>
        )}
      </button>

      {open && (
        <div
          className={[
            'absolute z-50 mb-2 w-56 rounded-xl border border-zinc-700 bg-zinc-900 p-1.5 shadow-xl',
            collapsed
              ? 'bottom-0 left-[calc(100%+0.5rem)]'
              : 'bottom-full left-0 right-0',
          ].join(' ')}
          role="menu"
        >
          {canViewStaff(staff, 'system_settings') && (
            <button
              type="button"
              role="menuitem"
              onClick={() => { setOpen(false); navigate('/staff/settings'); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
            >
              <Settings className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden />
              {t('admin_settings')}
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => { setOpen(false); navigate('/staff/account'); }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <User className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden />
            {t('account')}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => { setOpen(false); navigate('/book'); }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden />
            {t('go_to_booking_page')}
          </button>

          <div className="my-1 border-t border-zinc-800" />

          <button
            type="button"
            role="menuitem"
            onClick={() => { setOpen(false); void logout(); }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-zinc-800 hover:text-red-300"
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {t('log_out')}
          </button>
        </div>
      )}
    </div>
  );
}

export function StaffSidebar() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  if (user?.kind !== 'staff') {
    return null;
  }

  const staff = user;
  const isProvider = staff.roleSlug === 'provider';

  return (
    <aside
      className={[
        'flex shrink-0 flex-col border-r border-zinc-800 bg-zinc-900/80 transition-[width] duration-200 ease-out',
        collapsed ? 'w-[4.25rem]' : 'w-56',
      ].join(' ')}
      aria-label={t('backend_section')}
      data-sidebar-collapsed={collapsed}
    >
      <div
        className={[
          'flex border-b border-zinc-800',
          collapsed
            ? 'flex-col items-center justify-center px-1 py-3'
            : 'flex-row items-center gap-1 px-2 py-3',
        ].join(' ')}
      >
        <NavLink
          to="/staff/dashboard"
          className={[
            'flex items-center rounded-lg py-1.5 text-zinc-100 hover:bg-zinc-800/50',
            collapsed
              ? 'group relative h-9 w-9 justify-center px-0'
              : 'min-w-0 flex-1 pl-2 pr-1',
          ].join(' ')}
          aria-label={collapsed ? t('expand_sidebar') : t('app_name')}
          title={collapsed ? t('expand_sidebar') : undefined}
          onClick={() => {
            if (collapsed) setCollapsed(false);
          }}
        >
          {collapsed ? (
            <span className="relative flex h-full w-full items-center justify-center text-zinc-100">
              <span className="absolute inset-0 flex items-center justify-center transition-opacity duration-150 group-hover:opacity-0">
                <OpenBookLogoMark className="block h-5 w-auto" />
              </span>
              <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                <PanelLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
              </span>
            </span>
          ) : (
            <span className="shrink-0 text-zinc-100">
              <OpenBookLogoMark className="block h-5 w-auto" />
            </span>
          )}
        </NavLink>
        {!collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            aria-expanded
            aria-controls="staff-sidebar-nav"
            title={t('collapse_sidebar')}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <PanelLeft className="h-5 w-5" aria-hidden />
          </button>
        )}
      </div>

      <nav
        id="staff-sidebar-nav"
        className="flex flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden p-2"
      >
        <SidebarNavLink
          to="/staff/dashboard"
          end
          collapsed={collapsed}
          label={t('dashboard')}
          icon={LayoutDashboard}
        />
        {isProvider && (
          <SidebarNavLink
            to="/staff/provider/bookings"
            end
            collapsed={collapsed}
            label={t('provider_bookings')}
            icon={List}
          />
        )}
        {canViewStaff(staff, 'appointments') && (
          <SidebarNavLink
            to="/staff/calendar"
            collapsed={collapsed}
            label={t('calendar')}
            icon={Calendar}
          />
        )}
        {canViewStaff(staff, 'customers') && (
          <SidebarNavLink
            to="/staff/customers"
            collapsed={collapsed}
            label={t('customers')}
            icon={User}
          />
        )}
        {canViewStaff(staff, 'system_settings') && (
          <SidebarNavLink
            to="/staff/billing"
            collapsed={collapsed}
            label={t('billing')}
            icon={CreditCard}
          />
        )}
        {canViewStaff(staff, 'system_settings') && (
          <SidebarNavLink
            to="/staff/logs"
            collapsed={collapsed}
            label={t('logs')}
            icon={ScrollText}
          />
        )}
        {canViewStaff(staff, 'services') && (
          <div className="pt-2">
            {!collapsed && (
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                {t('services')}
              </p>
            )}
            <SidebarNavLink
              to="/staff/services"
              collapsed={collapsed}
              label={t('services')}
              icon={Briefcase}
            />
            <SidebarNavLink
              to="/staff/service-categories"
              collapsed={collapsed}
              label={t('categories')}
              icon={Tags}
            />
          </div>
        )}
        {canViewStaff(staff, 'users') && (
          <div className="pt-2">
            {!collapsed && (
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                {t('users')}
              </p>
            )}
            <SidebarNavLink
              to="/staff/providers"
              collapsed={collapsed}
              label={t('providers')}
              icon={UserStar}
            />
            <SidebarNavLink
              to="/staff/secretaries"
              collapsed={collapsed}
              label={t('secretaries')}
              icon={UserPen}
            />
            <SidebarNavLink
              to="/staff/admins"
              collapsed={collapsed}
              label={t('admins')}
              icon={UserCog}
            />
          </div>
        )}
        <div className="mt-auto border-t border-zinc-800 pt-2">
          <SidebarUserMenu collapsed={collapsed} />
        </div>
      </nav>
    </aside>
  );
}
