import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiJson } from '../../lib/api';

type Step = 'email' | 'otp' | 'password';

export function CustomerCreatePasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await apiJson('/api/auth/customer/request-otp', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code');
    } finally {
      setPending(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await apiJson('/api/auth/customer/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      });
      setStep('password');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired code');
    } finally {
      setPending(false);
    }
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setError(null);
    setPending(true);
    try {
      await apiJson('/api/auth/customer/create-password', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      navigate('/customer/bookings', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set password');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-12 text-zinc-100">
      <div className="mx-auto max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-50">Set your password</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {step === 'email' && 'Enter your email to receive a one-time code.'}
            {step === 'otp' && `Enter the 6-digit code sent to ${email}.`}
            {step === 'password' && 'Choose a password for your account.'}
          </p>
        </div>

        {step === 'email' && (
          <form
            className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-6"
            onSubmit={handleRequestOtp}
          >
            {error && <p className="text-sm text-red-400">{error}</p>}
            <label className="block space-y-1">
              <span className="text-sm font-medium text-zinc-300">Email</span>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-500/50 focus:ring-2"
                placeholder="you@example.com"
              />
            </label>
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {pending ? 'Sending…' : 'Send code'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form
            className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-6"
            onSubmit={handleVerifyOtp}
          >
            {error && <p className="text-sm text-red-400">{error}</p>}
            <label className="block space-y-1">
              <span className="text-sm font-medium text-zinc-300">Verification code</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-center font-mono text-lg tracking-widest text-zinc-100 outline-none ring-emerald-500/50 focus:ring-2"
                placeholder="000000"
              />
            </label>
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {pending ? 'Verifying…' : 'Verify code'}
            </button>
            <button
              type="button"
              className="w-full text-sm text-zinc-500 hover:text-zinc-300"
              onClick={() => {
                setStep('email');
                setError(null);
              }}
            >
              Back
            </button>
          </form>
        )}

        {step === 'password' && (
          <form
            className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-6"
            onSubmit={handleSetPassword}
          >
            {error && <p className="text-sm text-red-400">{error}</p>}
            <label className="block space-y-1">
              <span className="text-sm font-medium text-zinc-300">New password</span>
              <input
                type="password"
                autoComplete="new-password"
                minLength={6}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-500/50 focus:ring-2"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium text-zinc-300">Confirm password</span>
              <input
                type="password"
                autoComplete="new-password"
                minLength={6}
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-500/50 focus:ring-2"
              />
            </label>
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {pending ? 'Saving…' : 'Set password'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-zinc-500">
          <Link to="/customer/login" className="text-emerald-500 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
