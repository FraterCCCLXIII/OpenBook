import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiJson } from '../../lib/api';
import { PublicHomeLink } from '../../components/PublicHomeLink';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';

type Step = 'email' | 'otp' | 'password';

const stepTitles: Record<Step, string> = {
  email:    'Set your password',
  otp:      'Check your email',
  password: 'Choose a password',
};

const stepSubtitles: Record<Step, string> = {
  email:    'Enter your email to receive a one-time code.',
  otp:      'Enter the 6-digit code we sent you.',
  password: 'Choose a strong password for your account.',
};

async function fetchPublicSettings(): Promise<Record<string, string>> {
  const res = await fetch('/api/settings/public');
  if (!res.ok) return {};
  return res.json() as Promise<Record<string, string>>;
}

export function CustomerCreatePasswordPage() {
  const navigate = useNavigate();
  const settingsQ = useQuery({
    queryKey: ['settings', 'public'],
    queryFn: fetchPublicSettings,
    staleTime: 60 * 1000,
  });
  const portalDisabled = settingsQ.data?.customer_login_enabled !== '1';
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

  if (settingsQ.isPending) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  if (portalDisabled) {
    return (
      <div className="flex justify-center px-4 py-6">
        <div className="w-full max-w-sm">
          <div className="wizard-frame">
            <div className="frame-container">
              <h2 className="frame-title">Set your password</h2>
              <div className="frame-content space-y-4 text-center">
                <p className="text-sm text-slate-500">
                  The customer portal is disabled. You cannot set a password here.
                </p>
                <PublicHomeLink className="booking-button block">
                  Back to home
                </PublicHomeLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm py-6">
      <div className="mb-6 text-center">
        <h1 className="font-brand text-2xl font-semibold text-slate-900">{stepTitles[step]}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {step === 'otp' ? `Code sent to ${email}.` : stepSubtitles[step]}
        </p>
      </div>

      <Card padding="md">
        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {step === 'email' && (
          <form className="space-y-4" onSubmit={handleRequestOtp}>
            <FormField label="Email" htmlFor="email" required>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </FormField>
            <Button type="submit" disabled={pending} className="w-full justify-center">
              {pending ? 'Sending…' : 'Send code'}
            </Button>
          </form>
        )}

        {step === 'otp' && (
          <form className="space-y-4" onSubmit={handleVerifyOtp}>
            <FormField label="Verification code" htmlFor="code" required>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="text-center font-mono text-lg tracking-widest"
                required
              />
            </FormField>
            <Button type="submit" disabled={pending} className="w-full justify-center">
              {pending ? 'Verifying…' : 'Verify code'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-center"
              onClick={() => {
                setStep('email');
                setError(null);
              }}
            >
              Back
            </Button>
          </form>
        )}

        {step === 'password' && (
          <form className="space-y-4" onSubmit={handleSetPassword}>
            <FormField label="New password" htmlFor="password" hint="Minimum 6 characters" required>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </FormField>
            <FormField label="Confirm password" htmlFor="confirm" required>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </FormField>
            <Button type="submit" disabled={pending} className="w-full justify-center">
              {pending ? 'Saving…' : 'Set password'}
            </Button>
          </form>
        )}
      </Card>

      <p className="mt-4 text-center text-sm text-slate-500">
        <Link to="/customer/login" className="font-medium text-brand hover:text-brand-dark">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
