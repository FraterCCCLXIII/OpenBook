import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { FormField } from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';

async function fetchPublicSettings(): Promise<Record<string, string>> {
  const res = await fetch('/api/settings/public');
  if (!res.ok) return {};
  return res.json() as Promise<Record<string, string>>;
}

export function CustomerRegisterPage() {
  const { t } = useTranslation();
  const { customerRegister } = useAuth();
  const navigate = useNavigate();

  const settingsQ = useQuery({
    queryKey: ['settings', 'public'],
    queryFn: fetchPublicSettings,
    staleTime: 60 * 1000,
  });
  const portalDisabled = settingsQ.data?.customer_login_enabled !== '1';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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
              <h2 className="frame-title">Create an account</h2>
              <div className="frame-content space-y-4 text-center">
                <p className="text-sm text-slate-500">
                  The customer portal is disabled. New accounts cannot be created.
                </p>
                <Link to="/" className="booking-button block">
                  Back to home
                </Link>
                <Link to="/customer/login" className="booking-link block text-sm">
                  Sign in page
                </Link>
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
        <h1 className="font-brand text-2xl font-semibold text-slate-900">Create an account</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your bookings in one place.</p>
      </div>

      <Card padding="md">
        <form
          className="space-y-4"
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
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="First name" htmlFor="firstName" required>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </FormField>
            <FormField label="Last name" htmlFor="lastName" required>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </FormField>
          </div>

          <FormField label="Email" htmlFor="email" required>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormField>

          <FormField
            label="Password"
            htmlFor="password"
            hint="Minimum 6 characters"
            required
          >
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

          <Button type="submit" disabled={pending} className="w-full justify-center">
            {pending ? 'Creating account…' : 'Create account'}
          </Button>
        </form>
      </Card>

      <p className="mt-4 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/customer/login" className="font-medium text-brand hover:text-brand-dark">
          {t('sign_in')}
        </Link>
      </p>
    </div>
  );
}
