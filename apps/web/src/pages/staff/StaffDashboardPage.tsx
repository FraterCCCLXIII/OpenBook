import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function StaffDashboardPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">{t('dashboard')}</h1>
        <p className="mt-1 text-zinc-400">
          Overview — parity with PHP <code className="text-zinc-500">dashboard</code> / backend home.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { to: '/staff/calendar', titleKey: 'calendar' as const },
          { to: '/staff/customers', titleKey: 'customers' as const },
          { to: '/staff/services', titleKey: 'services' as const },
          { to: '/staff/billing', titleKey: 'billing' as const },
          { to: '/staff/logs', titleKey: 'logs' as const },
          { to: '/staff/settings', titleKey: 'admin_settings' as const },
        ].map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 transition-colors hover:border-zinc-600"
          >
            <h2 className="font-medium text-zinc-200">{t(card.titleKey)}</h2>
            <p className="mt-1 text-xs text-zinc-500">Open module</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
