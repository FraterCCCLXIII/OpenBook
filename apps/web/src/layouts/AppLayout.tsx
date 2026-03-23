import { NavLink, Outlet } from 'react-router-dom';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-zinc-800 text-zinc-50'
      : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200',
  ].join(' ');

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <NavLink to="/" className="block text-lg font-semibold tracking-tight text-zinc-50">
              OpenBook
            </NavLink>
            <p className="text-xs text-zinc-500">Appointments — UI shell (API wiring next)</p>
          </div>
          <nav
            className="flex flex-wrap items-center gap-1"
            aria-label="Main navigation"
          >
            <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
              Public
            </span>
            <NavLink to="/book" className={linkClass}>
              Book
            </NavLink>
            <span className="mx-2 text-zinc-700">|</span>
            <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
              Customer
            </span>
            <NavLink to="/customer/login" className={linkClass}>
              Sign in
            </NavLink>
            <NavLink to="/customer/account" className={linkClass}>
              My account
            </NavLink>
            <span className="mx-2 text-zinc-700">|</span>
            <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
              Staff
            </span>
            <NavLink to="/staff/login" className={linkClass}>
              Staff sign in
            </NavLink>
            <NavLink to="/staff/dashboard" className={linkClass}>
              Dashboard
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-zinc-800 px-4 py-6 text-center text-xs text-zinc-600">
        Legacy PHP app remains in <code className="text-zinc-500">easyappointments-logs/</code> until APIs are
        ported.
      </footer>
    </div>
  );
}
