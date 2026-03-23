import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

export function StaffLoginPage() {
  const { staffLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/staff/dashboard';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-12 text-zinc-100">
      <div className="mx-auto max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-50">Staff sign in</h1>
          <p className="mt-1 text-sm text-zinc-500">
            For admin, provider, and secretary. LDAP can be added later like the PHP app.
          </p>
        </div>
        <form
          className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-6"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setPending(true);
            try {
              await staffLogin(username, password);
              navigate(from, { replace: true });
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Sign in failed');
            } finally {
              setPending(false);
            }
          }}
        >
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-zinc-300">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-500/50 focus:ring-2"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-zinc-100 py-2.5 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-50"
          >
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="text-center text-sm text-zinc-500">
          <Link to="/" className="text-emerald-500 hover:underline">
            Home
          </Link>
        </p>
      </div>
    </div>
  );
}
