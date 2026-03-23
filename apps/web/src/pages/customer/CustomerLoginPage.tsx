import { Link } from 'react-router-dom';

export function CustomerLoginPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Customer sign in</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Mirrors the legacy customer login flow (password or OTP). Authentication is not wired yet.
        </p>
      </div>
      <form
        className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-6"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-500/50 focus:ring-2"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-500/50 focus:ring-2"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          disabled
        >
          Sign in (coming soon)
        </button>
      </form>
      <p className="text-center text-sm text-zinc-500">
        <Link to="/customer/account" className="text-emerald-500 hover:underline">
          My account
        </Link>
        {' · '}
        <Link to="/book" className="text-emerald-500 hover:underline">
          Book without an account
        </Link>
      </p>
    </div>
  );
}
