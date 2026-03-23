import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { LucideIcon } from 'lucide-react';
import {
  Briefcase,
  Calendar,
  CalendarDays,
  FileText,
  LayoutDashboard,
  List,
  LogOut,
  PanelLeft,
  ScrollText,
  Tags,
  User,
  Users,
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

export function StaffSidebar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
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
          <SidebarNavLink to="/staff/forms" collapsed={collapsed} label="Forms" icon={FileText} />
        )}
        {canViewStaff(staff, 'system_settings') && (
          <SidebarNavLink
            to="/staff/billing"
            collapsed={collapsed}
            label={t('billing')}
            icon={FileText}
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
              icon={Users}
            />
            <SidebarNavLink
              to="/staff/secretaries"
              collapsed={collapsed}
              label={t('secretaries')}
              icon={Users}
            />
            <SidebarNavLink
              to="/staff/admins"
              collapsed={collapsed}
              label={t('admins')}
              icon={Users}
            />
          </div>
        )}
        <div className="mt-auto border-t border-zinc-800 pt-2">
          {canViewStaff(staff, 'system_settings') && (
            <SidebarNavLink
              to="/staff/webhooks"
              collapsed={collapsed}
              label="Webhooks"
              icon={ScrollText}
            />
          )}
          {canViewStaff(staff, 'system_settings') && (
            <SidebarNavLink
              to="/staff/settings"
              collapsed={collapsed}
              label={t('admin_settings')}
              icon={CalendarDays}
            />
          )}
          <SidebarNavLink
            to="/staff/account"
            collapsed={collapsed}
            label={t('account')}
            icon={User}
          />
          <SidebarNavLink
            to="/book"
            collapsed={collapsed}
            label={t('go_to_booking_page')}
            icon={Calendar}
          />
          <button
            type="button"
            title={collapsed ? t('log_out') : undefined}
            aria-label={t('log_out')}
            className={[
              'flex w-full items-center rounded-lg py-2 text-left text-sm text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100',
              collapsed ? 'justify-center px-2' : 'gap-2 px-3',
            ].join(' ')}
            onClick={() => void logout()}
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden />
            {!collapsed && t('log_out')}
          </button>
        </div>
      </nav>
    </aside>
  );
}
