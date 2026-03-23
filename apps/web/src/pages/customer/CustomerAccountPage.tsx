import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { apiJson } from '../../lib/api';
import { TIMEZONE_GROUPS } from '../../lib/timezones';
import { Button, Card, FormField, Input } from '../../components/ui';

type CustomerProfile = {
  kind: string;
  customerId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  timezone: string | null;
};

type Tab = 'profile' | 'security' | 'billing';

type Appointment = {
  id: string;
  startDatetime: string | null;
  endDatetime: string | null;
  notes: string | null;
  serviceName: string | null;
  providerName: string | null;
};

export function CustomerAccountPage() {
  const { user, refresh } = useAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  const profile = useQuery({
    queryKey: ['customer', 'profile'],
    queryFn: () => apiJson<CustomerProfile>('/api/customer/profile'),
    enabled: user?.kind === 'customer',
  });

  const appointments = useQuery({
    queryKey: ['customer', 'appointments'],
    queryFn: () => apiJson<{ items: Appointment[] }>('/api/customer/appointments'),
    enabled: user?.kind === 'customer' && activeTab === 'billing',
  });

  const saveProfile = useMutation({
    mutationFn: (body: Record<string, string>) =>
      apiJson('/api/customer/profile', {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['customer', 'profile'] });
      void refresh();
    },
  });

  const [newEmail, setNewEmail] = useState('');
  const [emailSuccess, setEmailSuccess] = useState(false);
  const changeEmail = useMutation({
    mutationFn: (email: string) =>
      apiJson('/api/auth/customer/change-email', {
        method: 'POST',
        body: JSON.stringify({ new_email: email }),
      }),
    onSuccess: () => {
      setEmailSuccess(true);
      setNewEmail('');
      void qc.invalidateQueries({ queryKey: ['customer', 'profile'] });
      void refresh();
    },
  });

  if (user?.kind !== 'customer') return null;

  const p = profile.data;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'security', label: 'Security' },
    { id: 'billing', label: 'Billing' },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">My Account</h1>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === tab.id
                ? 'border-brand text-brand'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {activeTab === 'profile' && (
        <Card>
          <h2 className="mb-5 text-base font-semibold text-slate-800">
            Profile Details
          </h2>

          {profile.isPending && (
            <p className="text-sm text-slate-400">Loading…</p>
          )}
          {profile.isError && (
            <p className="text-sm text-red-600">
              {(profile.error as Error).message}
            </p>
          )}

          {p && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const body: Record<string, string> = {};
                for (const [key, value] of fd.entries()) {
                  body[key] = String(value);
                }
                saveProfile.mutate(body);
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="First Name" htmlFor="first_name">
                  <Input
                    id="first_name"
                    name="first_name"
                    defaultValue={p.firstName ?? ''}
                    autoComplete="given-name"
                  />
                </FormField>
                <FormField label="Last Name" htmlFor="last_name">
                  <Input
                    id="last_name"
                    name="last_name"
                    defaultValue={p.lastName ?? ''}
                    autoComplete="family-name"
                  />
                </FormField>
              </div>

              <FormField label="Phone" htmlFor="phone_number">
                <Input
                  id="phone_number"
                  name="phone_number"
                  type="tel"
                  defaultValue={p.phoneNumber ?? ''}
                  autoComplete="tel"
                />
              </FormField>

              <FormField label="Address" htmlFor="address">
                <Input
                  id="address"
                  name="address"
                  defaultValue={p.address ?? ''}
                  autoComplete="street-address"
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-3">
                <FormField label="City" htmlFor="city">
                  <Input
                    id="city"
                    name="city"
                    defaultValue={p.city ?? ''}
                    autoComplete="address-level2"
                  />
                </FormField>
                <FormField label="State" htmlFor="state">
                  <Input
                    id="state"
                    name="state"
                    defaultValue={p.state ?? ''}
                    autoComplete="address-level1"
                  />
                </FormField>
                <FormField label="Zip" htmlFor="zip_code">
                  <Input
                    id="zip_code"
                    name="zip_code"
                    defaultValue={p.zipCode ?? ''}
                    autoComplete="postal-code"
                  />
                </FormField>
              </div>

              <FormField label="Timezone" htmlFor="timezone">
                <select
                  id="timezone"
                  name="timezone"
                  defaultValue={p.timezone ?? ''}
                  className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  <option value="">— Select timezone —</option>
                  {TIMEZONE_GROUPS.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.options.map((tz) => (
                        <option key={tz} value={tz}>
                          {tz}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </FormField>

              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" className="w-full" disabled={saveProfile.isPending}>
                  {saveProfile.isPending ? 'Saving…' : 'Save Profile'}
                </Button>
              </div>

              {saveProfile.isSuccess && (
                <p className="text-sm text-brand text-center">
                  Profile saved successfully.
                </p>
              )}
              {saveProfile.isError && (
                <p className="text-sm text-red-600 text-center">
                  {(saveProfile.error as Error).message}
                </p>
              )}
            </form>
          )}
        </Card>
      )}

      {/* Security tab */}
      {activeTab === 'security' && (
        <Card>
          <h2 className="mb-5 text-base font-semibold text-slate-800">
            Update Email
          </h2>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!newEmail.trim() || newEmail === p?.email) return;
              setEmailSuccess(false);
              changeEmail.mutate(newEmail.trim());
            }}
          >
            <FormField label="Email" htmlFor="new_email">
              <Input
                id="new_email"
                type="email"
                value={newEmail}
                onChange={(e) => {
                  setNewEmail(e.target.value);
                  setEmailSuccess(false);
                }}
                placeholder={p?.email ?? ''}
                autoComplete="email"
                required
              />
            </FormField>

            <Button
              type="submit"
              variant="outline"
              className="w-full"
              disabled={
                !newEmail.trim() ||
                newEmail.trim() === p?.email ||
                changeEmail.isPending
              }
            >
              {changeEmail.isPending ? 'Updating…' : 'Update Email'}
            </Button>

            {emailSuccess && (
              <p className="text-sm text-brand text-center">
                Email updated successfully.
              </p>
            )}
            {changeEmail.isError && (
              <p className="text-sm text-red-600 text-center">
                {(changeEmail.error as Error).message}
              </p>
            )}
          </form>
        </Card>
      )}

      {/* Billing tab */}
      {activeTab === 'billing' && (
        <Card padding="none">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-800">
              Billing History
            </h2>
          </div>

          {appointments.isPending && (
            <p className="px-6 py-4 text-sm text-slate-400">Loading…</p>
          )}
          {appointments.isError && (
            <p className="px-6 py-4 text-sm text-red-600">
              {(appointments.error as Error).message}
            </p>
          )}

          {appointments.isSuccess && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-6 py-3">Date</th>
                    <th className="px-4 py-3">Service</th>
                    <th className="px-4 py-3">Provider</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointments.data.items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-8 text-center text-slate-400"
                      >
                        No billing history found.
                      </td>
                    </tr>
                  ) : (
                    appointments.data.items.map((appt) => (
                      <tr key={appt.id} className="hover:bg-slate-50">
                        <td className="px-6 py-3 text-slate-700 whitespace-nowrap">
                          {appt.startDatetime
                            ? new Date(appt.startDatetime).toLocaleString(
                                undefined,
                                {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                },
                              )
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {appt.serviceName ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {appt.providerName ?? '—'}
                        </td>
                        <td className="px-6 py-3">
                          <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                            Scheduled
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
