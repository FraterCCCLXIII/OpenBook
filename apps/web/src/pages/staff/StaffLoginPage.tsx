import { Link } from 'react-router-dom';

export function StaffLoginPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Staff sign in</h1>
        <p className="mt-1 text-sm text-zinc-500">
          For admin, provider, and secretary. LDAP fallback will be supported later like the PHP app.
        </p>
      </div>
      <form
        className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-6"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-zinc-300">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-500/50 focus:ring-2"
          />
        </div>
        <div>
          <label htmlFor="staff-password" className="block text-sm font-medium text-zinc-300">
            Password
          </label>
          <input
            id="staff-password"
            name="password"
            type="password"
            autoComplete="current-password"
            className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-500/50 focus:ring-2"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-zinc-100 py-2.5 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-50"
          disabled
        >
          Sign in (coming soon)
        </button>
      </form>
      <p className="text-center text-sm text-zinc-500">
        <Link to="/staff/dashboard" className="text-emerald-500 hover:underline">
          Dashboard (preview)
        </Link>
        {' · '}
        <Link to="/" className="text-emerald-500 hover:underline">
          Home
        </Link>
      </p>
    </div>
  );
}
