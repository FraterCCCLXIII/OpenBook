import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiJson } from '../../lib/api';

type FormListItem = { id: number; name: string; description: string | null };

export function CustomerFormsPage() {
  const { t } = useTranslation();
  const q = useQuery({
    queryKey: ['customer', 'forms'],
    queryFn: () => apiJson<{ items: FormListItem[] }>('/api/customer/forms'),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-zinc-50">{t('customer_forms')}</h1>
      {q.isPending && <p className="text-sm text-zinc-500">Loading…</p>}
      {q.isError && <p className="text-sm text-red-400">{(q.error as Error).message}</p>}
      {q.isSuccess && q.data.items.length === 0 && (
        <p className="text-sm text-zinc-500">No forms assigned to your account.</p>
      )}
      {q.isSuccess && q.data.items.length > 0 && (
        <ul className="space-y-2">
          {q.data.items.map((f) => (
            <li key={f.id} className="rounded-lg border border-zinc-800 p-4">
              <Link
                to={`/customer/forms/${f.id}`}
                className="font-medium text-emerald-400 hover:underline"
              >
                {f.name}
              </Link>
              {f.description && (
                <p className="mt-1 text-sm text-zinc-500">{f.description}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
