import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

export function CustomerLoginPage() {
  const { customerLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/customer/bookings';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-12 text-zinc-100">
      <div className="mx-auto max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-50">Customer sign in</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Password auth via <code className="text-zinc-600">POST /api/auth/customer/login</code> (bcrypt against{' '}
            <code className="text-zinc-600">ea_customer_auth</code>).
          </p>
        </div>
        <form
          className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-6"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setPending(true);
            try {
              await customerLogin(email, password);
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
            <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-500/50 focus:ring-2"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="text-center text-sm text-zinc-500">
          <Link to="/customer/register" className="text-emerald-500 hover:underline">
            Register
          </Link>
          {' · '}
          <Link to="/customer/account" className="text-emerald-500 hover:underline">
            My account
          </Link>
          {' · '}
          <Link to="/book" className="text-emerald-500 hover:underline">
            Book without an account
          </Link>
        </p>
      </div>
    </div>
  );
}
