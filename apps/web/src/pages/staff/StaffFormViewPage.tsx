import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, FileText, XCircle } from 'lucide-react';
import { apiJson } from '../../lib/api';

type FieldMeta = {
  id: number;
  label: string;
  fieldType: string;
  options: string[];
  isRequired: boolean;
  sortOrder: number;
};

type FormView = {
  id: number;
  name: string;
  description: string | null;
  fields: FieldMeta[];
  submission: {
    id: number;
    submittedAt: string;
    answers: Record<string, unknown>;
  } | null;
};

const readonlyInputCls =
  'block w-full rounded-lg border border-zinc-700 bg-zinc-900/60 px-3.5 py-2.5 text-sm text-zinc-300';

function renderAnswer(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ');
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

export function StaffFormViewPage() {
  const { formId, userId } = useParams<{ formId: string; userId: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const back = params.get('back') ?? '/staff/dashboard';

  const q = useQuery({
    queryKey: ['staff', 'forms', formId, 'view', userId],
    queryFn: () =>
      apiJson<FormView>(`/api/staff/forms/${formId}/view/${userId}`),
    enabled: !!formId && !!userId,
  });

  if (q.isPending) return <p className="text-sm text-zinc-500">Loading…</p>;
  if (q.isError)
    return <p className="text-sm text-red-400">{(q.error as Error).message}</p>;

  const form = q.data;
  const completed = form.submission !== null;
  const sortedFields = form.fields.slice().sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate(back)}
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Header */}
      <div className="flex items-start gap-4 rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${completed ? 'bg-emerald-500/10' : 'bg-zinc-800'}`}>
          <FileText className={`h-5 w-5 ${completed ? 'text-emerald-400' : 'text-zinc-500'}`} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold text-zinc-50">{form.name}</h1>
          {form.description && (
            <p className="mt-0.5 text-sm text-zinc-500">{form.description}</p>
          )}
        </div>
        {completed ? (
          <div className="flex shrink-0 items-center gap-1.5 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>
              Submitted{' '}
              {new Date(form.submission!.submittedAt).toLocaleDateString(undefined, {
                month: 'short', day: 'numeric', year: 'numeric',
              })}
            </span>
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-1.5 text-sm text-zinc-500">
            <XCircle className="h-4 w-4" />
            Not yet submitted
          </div>
        )}
      </div>

      {/* Fields */}
      <div className="space-y-4">
        {sortedFields.map((field) => {
          if (field.fieldType === 'textblock') {
            return (
              <div
                key={field.id}
                className="richtext rounded-xl border border-zinc-800 bg-zinc-900/30 px-5 py-4 text-zinc-300"
                dangerouslySetInnerHTML={{ __html: field.label }}
              />
            );
          }

          const raw = completed ? form.submission!.answers[field.id] : undefined;
          const checkedValues: string[] = Array.isArray(raw) ? raw : [];

          return (
            <div key={field.id} className="rounded-xl border border-zinc-800 bg-zinc-900/30 px-5 py-4 space-y-2">
              <div>
                <span className="text-sm font-medium text-zinc-200">
                  {field.label}
                  {field.isRequired && <span className="ml-1 text-red-400/70">*</span>}
                </span>
              </div>

              {(field.fieldType === 'checkboxes') ? (
                <div className="space-y-1.5">
                  {field.options.map((opt) => (
                    <label key={opt} className="flex items-center gap-2.5 text-sm text-zinc-400">
                      <input
                        type="checkbox"
                        readOnly
                        checked={checkedValues.includes(opt)}
                        className="h-4 w-4 accent-emerald-500"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              ) : field.fieldType === 'radio' ? (
                <div className="space-y-1.5">
                  {field.options.map((opt) => (
                    <label key={opt} className="flex items-center gap-2.5 text-sm text-zinc-400">
                      <input
                        type="radio"
                        readOnly
                        checked={completed ? String(raw) === opt : false}
                        className="h-4 w-4 accent-emerald-500"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              ) : completed ? (
                <div className={readonlyInputCls}>
                  {renderAnswer(raw)}
                </div>
              ) : (
                <div className="rounded-lg border border-zinc-700/50 bg-zinc-900/40 px-3.5 py-2.5 text-sm text-zinc-600 italic">
                  {field.fieldType === 'text' ? 'Long text answer…' : `${field.fieldType} answer…`}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
