import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiJson } from '../../lib/api';

type FormField = {
  id: number;
  label: string;
  fieldType: string;
  options: string[];
  isRequired: boolean;
  sortOrder: number;
};

type FormDetail = {
  id: number;
  name: string;
  description: string | null;
  fields: FormField[];
};

type Submission = {
  id: number;
  submittedAt: string;
  answers: Record<string, unknown>;
};

export function CustomerFormDetailPage() {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitted, setSubmitted] = useState(false);

  const formQ = useQuery({
    queryKey: ['customer', 'forms', formId],
    queryFn: () => apiJson<FormDetail>(`/api/customer/forms/${formId}`),
    enabled: !!formId,
  });

  const submissionQ = useQuery({
    queryKey: ['customer', 'forms', formId, 'submission'],
    queryFn: () =>
      apiJson<{ submission: Submission | null }>(
        `/api/customer/forms/${formId}/submission`,
      ),
    enabled: !!formId,
  });

  const submitMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiJson(`/api/customer/forms/${formId}/submit`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => setSubmitted(true),
  });

  if (formQ.isPending) {
    return <p className="text-sm text-zinc-500">Loading form…</p>;
  }
  if (formQ.isError) {
    return <p className="text-sm text-red-400">{(formQ.error as Error).message}</p>;
  }

  const form = formQ.data;

  if (
    !submitted &&
    submissionQ.isSuccess &&
    submissionQ.data.submission
  ) {
    const sub = submissionQ.data.submission;
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-zinc-50">{form.name}</h1>
        <p className="text-sm text-emerald-400">
          You already submitted this form on{' '}
          {new Date(sub.submittedAt).toLocaleDateString()}.
        </p>
        <button
          type="button"
          onClick={() => navigate('/customer/forms')}
          className="text-sm text-zinc-500 hover:text-zinc-300"
        >
          ← Back to forms
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-zinc-50">{form.name}</h1>
        <p className="text-sm text-emerald-400">
          Your response has been submitted. Thank you!
        </p>
        <button
          type="button"
          onClick={() => navigate('/customer/forms')}
          className="text-sm text-zinc-500 hover:text-zinc-300"
        >
          ← Back to forms
        </button>
      </div>
    );
  }

  function setValue(fieldId: number, value: string | string[]) {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submitMutation.mutate(answers);
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">{form.name}</h1>
        {form.description && (
          <p className="mt-1 text-sm text-zinc-400">{form.description}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {form.fields.map((field) => (
          <div key={field.id} className="space-y-1">
            <label className="block text-sm font-medium text-zinc-300">
              {field.label}
              {field.isRequired && <span className="ml-1 text-red-400">*</span>}
            </label>

            {(field.fieldType === 'input' || field.fieldType === 'date') && (
              <input
                type={field.fieldType === 'date' ? 'date' : 'text'}
                required={field.isRequired}
                value={(answers[field.id] as string) ?? ''}
                onChange={(e) => setValue(field.id, e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-500/50 focus:ring-2"
              />
            )}

            {field.fieldType === 'text' && (
              <textarea
                required={field.isRequired}
                rows={3}
                value={(answers[field.id] as string) ?? ''}
                onChange={(e) => setValue(field.id, e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-500/50 focus:ring-2"
              />
            )}

            {field.fieldType === 'dropdown' && (
              <select
                required={field.isRequired}
                value={(answers[field.id] as string) ?? ''}
                onChange={(e) => setValue(field.id, e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-500/50 focus:ring-2"
              >
                <option value="">Select…</option>
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}

            {field.fieldType === 'radio' && (
              <div className="space-y-1">
                {field.options.map((opt) => (
                  <label key={opt} className="flex items-center gap-2 text-sm text-zinc-300">
                    <input
                      type="radio"
                      name={`field-${field.id}`}
                      value={opt}
                      required={field.isRequired}
                      checked={(answers[field.id] as string) === opt}
                      onChange={() => setValue(field.id, opt)}
                      className="accent-emerald-500"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}

            {field.fieldType === 'checkboxes' && (
              <div className="space-y-1">
                {field.options.map((opt) => {
                  const checked = ((answers[field.id] as string[]) ?? []).includes(opt);
                  return (
                    <label key={opt} className="flex items-center gap-2 text-sm text-zinc-300">
                      <input
                        type="checkbox"
                        value={opt}
                        checked={checked}
                        onChange={(e) => {
                          const prev = (answers[field.id] as string[]) ?? [];
                          setValue(
                            field.id,
                            e.target.checked
                              ? [...prev, opt]
                              : prev.filter((v) => v !== opt),
                          );
                        }}
                        className="accent-emerald-500"
                      />
                      {opt}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {submitMutation.isError && (
          <p className="text-sm text-red-400">
            {(submitMutation.error as Error).message}
          </p>
        )}

        <button
          type="submit"
          disabled={submitMutation.isPending}
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {submitMutation.isPending ? 'Submitting…' : 'Submit'}
        </button>
      </form>
    </div>
  );
}
