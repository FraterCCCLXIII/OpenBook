import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/AuthContext';

export function CustomerRegisterPage() {
  const { t } = useTranslation();
  const { customerRegister } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-semibold text-zinc-50">Register</h1>
      <p className="text-sm text-zinc-400">Create a customer account to manage bookings.</p>
      <form
        className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setPending(true);
          try {
            await customerRegister(email, password, firstName, lastName);
            navigate('/customer/account', { replace: true });
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed');
          } finally {
            setPending(false);
          }
        }}
      >
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-xs text-zinc-500">First name</span>
            <input
              required
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-zinc-500">Last name</span>
            <input
              required
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </label>
        </div>
        <label className="block space-y-1">
          <span className="text-xs text-zinc-500">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-zinc-500">Password (min 6 characters)</span>
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="text-center text-sm text-zinc-500">
        <Link to="/customer/login" className="text-emerald-400 hover:underline">
          {t('sign_in')}
        </Link>
      </p>
    </div>
  );
}
