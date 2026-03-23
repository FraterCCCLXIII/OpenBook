import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Briefcase,
  Calendar,
  CalendarDays,
  FileText,
  LayoutDashboard,
  List,
  ScrollText,
  Tags,
  User,
  Users,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { canViewStaff } from '../auth/staffPermissions';

const itemClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
    isActive ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100',
  ].join(' ');

export function StaffSidebar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  if (user?.kind !== 'staff') {
    return null;
  }

  const staff = user;
  const isProvider = staff.roleSlug === 'provider';

  return (
    <aside
      className="flex w-56 shrink-0 flex-col border-r border-zinc-800 bg-zinc-900/80"
      aria-label={t('backend_section')}
    >
      <div className="border-b border-zinc-800 px-3 py-4">
        <NavLink to="/staff/dashboard" className="font-semibold text-zinc-100">
          {t('app_name')}
        </NavLink>
        <p className="truncate text-xs text-zinc-500">{staff.displayName}</p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        <NavLink to="/staff/dashboard" className={itemClass} end>
          <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden />
          {t('dashboard')}
        </NavLink>
        {isProvider && (
          <NavLink to="/staff/provider/bookings" className={itemClass} end>
            <List className="h-4 w-4 shrink-0" aria-hidden />
            {t('provider_bookings')}
          </NavLink>
        )}
        {canViewStaff(staff, 'appointments') && (
          <NavLink to="/staff/calendar" className={itemClass}>
            <Calendar className="h-4 w-4 shrink-0" aria-hidden />
            {t('calendar')}
          </NavLink>
        )}
        {canViewStaff(staff, 'customers') && (
          <NavLink to="/staff/customers" className={itemClass}>
            <User className="h-4 w-4 shrink-0" aria-hidden />
            {t('customers')}
          </NavLink>
        )}
        {canViewStaff(staff, 'system_settings') && (
          <NavLink to="/staff/billing" className={itemClass}>
            <FileText className="h-4 w-4 shrink-0" aria-hidden />
            {t('billing')}
          </NavLink>
        )}
        {canViewStaff(staff, 'system_settings') && (
          <NavLink to="/staff/logs" className={itemClass}>
            <ScrollText className="h-4 w-4 shrink-0" aria-hidden />
            {t('logs')}
          </NavLink>
        )}
        {canViewStaff(staff, 'services') && (
          <div className="pt-2">
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
              {t('services')}
            </p>
            <NavLink to="/staff/services" className={itemClass}>
              <Briefcase className="h-4 w-4 shrink-0" aria-hidden />
              {t('services')}
            </NavLink>
            <NavLink to="/staff/service-categories" className={itemClass}>
              <Tags className="h-4 w-4 shrink-0" aria-hidden />
              {t('categories')}
            </NavLink>
          </div>
        )}
        {canViewStaff(staff, 'users') && (
          <div className="pt-2">
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
              {t('users')}
            </p>
            <NavLink to="/staff/providers" className={itemClass}>
              <Users className="h-4 w-4 shrink-0" aria-hidden />
              {t('providers')}
            </NavLink>
            <NavLink to="/staff/secretaries" className={itemClass}>
              <Users className="h-4 w-4 shrink-0" aria-hidden />
              {t('secretaries')}
            </NavLink>
            <NavLink to="/staff/admins" className={itemClass}>
              <Users className="h-4 w-4 shrink-0" aria-hidden />
              {t('admins')}
            </NavLink>
          </div>
        )}
        <div className="mt-auto border-t border-zinc-800 pt-2">
          {canViewStaff(staff, 'system_settings') && (
            <NavLink to="/staff/settings" className={itemClass}>
              <CalendarDays className="h-4 w-4 shrink-0" aria-hidden />
              {t('admin_settings')}
            </NavLink>
          )}
          <NavLink to="/staff/account" className={itemClass}>
            <User className="h-4 w-4 shrink-0" aria-hidden />
            {t('account')}
          </NavLink>
          <NavLink to="/book" className={itemClass}>
            <Calendar className="h-4 w-4 shrink-0" aria-hidden />
            {t('go_to_booking_page')}
          </NavLink>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100"
            onClick={() => void logout()}
          >
            {t('log_out')}
          </button>
        </div>
      </nav>
    </aside>
  );
}
