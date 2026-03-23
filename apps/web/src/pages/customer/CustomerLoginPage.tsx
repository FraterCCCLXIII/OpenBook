import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { apiJson } from '../../lib/api';
import { OtpInput } from '../../components/ui/OtpInput';

// ─── Types ────────────────────────────────────────────────────────────────────

type LoginMode = 'otp' | 'password' | 'none';
type OtpStep = 'email' | 'code';
type PasswordStep = 'form';

async function fetchPublicSettings(): Promise<Record<string, string>> {
  const res = await fetch('/api/settings/public');
  if (!res.ok) return {};
  return res.json() as Promise<Record<string, string>>;
}

// ─── OTP flow ─────────────────────────────────────────────────────────────────

function OtpFlow({ onSuccess }: { onSuccess: (isNew: boolean) => void }) {
  const { refresh } = useAuth();
  const [step, setStep] = useState<OtpStep>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await apiJson('/api/auth/customer/request-otp', {
        method: 'POST',
        body: JSON.stringify({ email, intent: 'login' }),
      });
      setStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code');
    } finally {
      setPending(false);
    }
  }

  async function resendCode() {
    setError(null);
    setPending(true);
    try {
      await apiJson('/api/auth/customer/request-otp', {
        method: 'POST',
        body: JSON.stringify({ email, intent: 'login' }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code');
    } finally {
      setPending(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const result = await apiJson<{ ok: boolean; isNew?: boolean }>(
        '/api/auth/customer/verify-otp',
        { method: 'POST', body: JSON.stringify({ email, code }) },
      );
      await refresh();
      onSuccess(result.isNew === true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired code');
    } finally {
      setPending(false);
    }
  }

  if (step === 'email') {
    return (
      <>
        <h2 className="frame-title">Start your booking</h2>
        <div className="frame-content">
          <form onSubmit={(e) => void requestCode(e)}>
            <p className="text-center text-sm text-slate-500">New and returning customers</p>
            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="otp-email" className="form-label">
                  Email
                </label>
                <input
                  id="otp-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="booking-input"
                />
              </div>
            </div>
            {error && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            <button type="submit" disabled={pending} className="booking-button mt-4">
              {pending ? 'Sending…' : 'Send Code'}
            </button>
          </form>
        </div>
      </>
    );
  }

  return (
    <>
      <h2 className="frame-title">Verify your address</h2>
      <div className="frame-content">
        <div className="mt-2 text-sm text-slate-500 text-center">
          An email with a one-time passcode was sent to <strong>{email}</strong>.{' '}
          <button
            type="button"
            disabled={pending}
            onClick={() => void resendCode()}
            className="booking-link border-0 bg-transparent p-0 align-baseline"
          >
            Resend code
          </button>
        </div>
        <form onSubmit={(e) => void verifyCode(e)} className="mt-4">
          <div className="space-y-4">
            <div>
              <label htmlFor="customer-otp-digit-0" className="form-label">
                Verification Code
              </label>
              <OtpInput value={code} onChange={setCode} disabled={pending} />
              <p className="mt-1 text-sm text-slate-500">
                <small>Enter the 6-digit code from your email.</small>
              </p>
            </div>
          </div>
          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={pending || code.replace(/\D/g, '').length < 6}
            className="booking-button mt-4"
          >
            {pending ? 'Verifying…' : 'Verify Code'}
          </button>
        </form>
        <div className="mt-4 text-sm text-slate-500 text-center">
          <button
            type="button"
            className="booking-link"
            onClick={() => {
              setStep('email');
              setCode('');
              setError(null);
            }}
          >
            Back
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Password flow ────────────────────────────────────────────────────────────

function PasswordFlow({ onSuccess }: { onSuccess: (isNew: boolean) => void }) {
  const { customerLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await customerLogin(email, password);
      onSuccess(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <h2 className="frame-title">Start your booking</h2>
      <div className="frame-content">
        <form onSubmit={(e) => void handleSubmit(e)}>
          <p className="text-center text-sm text-slate-500">Sign in to your account</p>
          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="pw-email" className="form-label">
                Email
              </label>
              <input
                id="pw-email"
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="booking-input"
              />
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <label htmlFor="pw-password" className="form-label">
                  Password
                </label>
                <Link
                  to="/customer/create-password"
                  className="text-xs booking-link"
                  tabIndex={-1}
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="pw-password"
                type="password"
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="booking-input"
              />
            </div>
          </div>
          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <button type="submit" disabled={pending} className="booking-button mt-4">
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function CustomerLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const { data: settings = {} } = useQuery({
    queryKey: ['settings', 'public'],
    queryFn: fetchPublicSettings,
    staleTime: 5 * 60 * 1000,
  });

  const loginMode: LoginMode =
    (settings.customer_login_mode as LoginMode | undefined) ?? 'otp';

  function onSuccess(isNew: boolean) {
    // New accounts go straight to the booking wizard; returning customers see their dashboard
    const destination = from ?? (isNew ? '/book' : '/customer/dashboard');
    navigate(destination, { replace: true });
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-sm mt-6">
        <div className="wizard-frame">
          <div className="frame-container">
            {loginMode === 'otp' && <OtpFlow onSuccess={onSuccess} />}
            {loginMode === 'password' && <PasswordFlow onSuccess={onSuccess} />}
            {loginMode === 'none' && (
              <>
                <h2 className="frame-title">Start your booking</h2>
                <div className="frame-content space-y-4 text-center">
                  <p className="text-sm text-slate-500">No sign-in required.</p>
                  <Link to="/book" className="booking-button block">
                    Book an appointment
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Frame footer — links */}
        <div id="frame-footer" className="mt-6 text-center">
          <div className="flex justify-center gap-4 text-sm text-slate-500">
            <Link to="/book" className="booking-link">
              Book without signing in
            </Link>
            {loginMode === 'password' && (
              <Link to="/customer/register" className="booking-link">
                Create account
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
