import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Shield } from 'lucide-react';
import { Button, Card } from '../../components/ui';

type ConsentRow = {
  id: number;
  type: string;
  ip: string;
  createdAt: string | null;
};

async function fetchConsents(): Promise<{ items: ConsentRow[] }> {
  const res = await fetch('/api/customer/consents', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load consents');
  return res.json() as Promise<{ items: ConsentRow[] }>;
}

const CONSENT_TYPES: { key: string; label: string; description: string }[] = [
  {
    key: 'terms',
    label: 'Terms of Service',
    description:
      'I have read and agree to the Terms of Service governing the use of this platform.',
  },
  {
    key: 'privacy_policy',
    label: 'Privacy Policy',
    description:
      'I consent to the collection and processing of my personal data as described in the Privacy Policy.',
  },
  {
    key: 'marketing',
    label: 'Marketing Communications',
    description:
      'I agree to receive marketing and promotional communications via email.',
  },
];

function consentLabel(type: string): string {
  return CONSENT_TYPES.find((c) => c.key === type)?.label ?? type.replace(/_/g, ' ');
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function CustomerConsentsPage() {
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ['customer', 'consents'],
    queryFn: fetchConsents,
  });

  const accept = useMutation({
    mutationFn: (type: string) =>
      fetch('/api/customer/consents', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      }).then((r) => {
        if (!r.ok) throw new Error('Failed to record consent');
        return r.json();
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['customer', 'consents'] }),
  });

  const acceptedTypes = new Set(q.data?.items.map((c) => c.type) ?? []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Privacy &amp; Consents
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your consent preferences. Each consent is time-stamped and
          associated with your account.
        </p>
      </div>

      {/* Consent cards */}
      <section aria-labelledby="consents-heading">
        <h2
          id="consents-heading"
          className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500"
        >
          Consent preferences
        </h2>
        <div className="space-y-3">
          {CONSENT_TYPES.map(({ key, label, description }) => {
            const alreadyAccepted = acceptedTypes.has(key);
            return (
              <Card key={key} className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Shield
                    className="mt-0.5 h-5 w-5 shrink-0 text-brand"
                    aria-hidden="true"
                  />
                  <div>
                    <div className="font-medium text-slate-900">{label}</div>
                    <p className="mt-0.5 text-xs text-slate-500">{description}</p>
                    {alreadyAccepted && (
                      <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-brand">
                        <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
                        Accepted
                      </p>
                    )}
                  </div>
                </div>
                {!alreadyAccepted && (
                  <Button
                    size="sm"
                    variant={alreadyAccepted ? 'ghost' : 'primary'}
                    disabled={accept.isPending || q.isPending}
                    onClick={() => accept.mutate(key)}
                    className="shrink-0"
                  >
                    Accept
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
        {accept.isError && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {(accept.error as Error).message}
          </p>
        )}
      </section>

      {/* Consent history */}
      <section aria-labelledby="history-heading">
        <h2
          id="history-heading"
          className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500"
        >
          Consent history
        </h2>

        {q.isPending && (
          <p className="text-sm text-slate-400">Loading…</p>
        )}
        {q.isError && (
          <p className="text-sm text-red-600" role="alert">
            {(q.error as Error).message}
          </p>
        )}

        {q.isSuccess && q.data.items.length === 0 && (
          <Card className="py-10 text-center">
            <p className="text-sm text-slate-400">No consents recorded yet.</p>
          </Card>
        )}

        {q.isSuccess && q.data.items.length > 0 && (
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" aria-label="Consent history">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="px-5 py-3">
                      Type
                    </th>
                    <th scope="col" className="px-5 py-3">
                      IP address
                    </th>
                    <th scope="col" className="px-5 py-3">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {q.data.items.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-700">
                        {consentLabel(c.type)}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-500">
                        {c.ip}
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {c.createdAt ? formatDate(c.createdAt) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>
    </div>
  );
}
