import { Link } from 'react-router-dom';

export function StaffDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Staff dashboard</h1>
        <p className="mt-1 text-zinc-400">
          Calendar, appointments, customers, services, and settings will be rebuilt here against the Nest API.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { title: 'Calendar', desc: 'Appointments & unavailabilities' },
          { title: 'Customers', desc: 'CRM, notes, alerts' },
          { title: 'Services', desc: 'Categories & providers' },
          { title: 'Settings', desc: 'Business, booking, API, Stripe' },
          { title: 'Forms', desc: 'Assignments & submissions' },
          { title: 'Billing', desc: 'Payments & refunds' },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4"
          >
            <h2 className="font-medium text-zinc-200">{card.title}</h2>
            <p className="mt-1 text-sm text-zinc-500">{card.desc}</p>
            <p className="mt-3 text-xs text-zinc-600">Placeholder — no data yet</p>
          </div>
        ))}
      </div>
      <p className="text-sm text-zinc-500">
        <Link to="/staff/login" className="text-emerald-500 hover:underline">
          Staff sign in
        </Link>
      </p>
    </div>
  );
}
