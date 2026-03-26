import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ChevronRight, FileText } from 'lucide-react';
import { apiJson } from '../../lib/api';
import { Card } from '../../components/ui';

type FormListItem = {
  id: number;
  name: string;
  description: string | null;
  submission: { submittedAt: string } | null;
};

export function CustomerFormsPage() {
  const { t } = useTranslation();

  const q = useQuery({
    queryKey: ['customer', 'forms'],
    queryFn: () => apiJson<{ items: FormListItem[] }>('/api/customer/forms'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{t('customer_forms')}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Forms and questionnaires assigned to your account.
        </p>
      </div>

      {q.isPending && (
        <p className="text-sm text-slate-400">Loading…</p>
      )}
      {q.isError && (
        <p className="text-sm text-red-600" role="alert">
          {(q.error as Error).message}
        </p>
      )}

      {q.isSuccess && q.data.items.length === 0 && (
        <Card className="py-14 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300" aria-hidden="true" />
          <p className="text-sm font-medium text-slate-500">
            No forms assigned to your account.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Forms will appear here when your provider assigns them.
          </p>
        </Card>
      )}

      {q.isSuccess && q.data.items.length > 0 && (
        <ul className="space-y-2" aria-label="Assigned forms">
          {q.data.items.map((f) => (
            <li key={f.id}>
              <Link
                to={`/customer/forms/${f.id}`}
                className="flex items-center justify-between rounded-card border border-slate-200 bg-surface-card px-5 py-4 shadow-card transition-all hover:border-brand hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <FileText
                    className="mt-0.5 h-4 w-4 shrink-0 text-brand"
                    aria-hidden="true"
                  />
                  <div>
                    <div className="font-medium text-slate-900">{f.name}</div>
                    {f.description && (
                      <p className="mt-0.5 text-xs text-slate-500">{f.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {f.submission ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                      Complete
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                      Incomplete
                    </span>
                  )}
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-slate-300"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
