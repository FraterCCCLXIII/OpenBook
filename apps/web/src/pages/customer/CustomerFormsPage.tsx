import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiJson } from '../../lib/api';

export function CustomerFormsPage() {
  const { t } = useTranslation();
  const q = useQuery({
    queryKey: ['customer', 'forms'],
    queryFn: () => apiJson<{ items: { id: string; name: string }[] }>('/api/customer/forms'),
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-50">{t('customer_forms')}</h1>
      <p className="mt-2 text-zinc-400">
        Assigned forms (parity with <code className="text-zinc-500">customer/forms</code>). Empty until PHP
        forms schema is ported.
      </p>
      {q.isPending && <p className="mt-4 text-sm text-zinc-500">Loading…</p>}
      {q.isError && <p className="mt-4 text-sm text-red-400">{(q.error as Error).message}</p>}
      {q.isSuccess && q.data.items.length === 0 && (
        <p className="mt-6 text-sm text-zinc-500">No forms assigned.</p>
      )}
      {q.isSuccess && q.data.items.length > 0 && (
        <ul className="mt-6 space-y-2">
          {q.data.items.map((f) => (
            <li key={f.id}>
              <Link to={`/customer/forms/${f.id}`} className="text-emerald-400 hover:underline">
                {f.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
