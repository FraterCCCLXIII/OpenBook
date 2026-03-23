import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { apiJson } from '../../lib/api';
import { Button, Card, FormField, Input } from '../../components/ui';

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

const sharedInputClass =
  'block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:bg-slate-50';

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
    return <p className="text-sm text-slate-400">Loading form…</p>;
  }
  if (formQ.isError) {
    return (
      <p className="text-sm text-red-600" role="alert">
        {(formQ.error as Error).message}
      </p>
    );
  }

  const form = formQ.data;

  const alreadySubmitted =
    !submitted && submissionQ.isSuccess && submissionQ.data.submission;

  if (alreadySubmitted) {
    const sub = submissionQ.data.submission!;
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <button
          type="button"
          onClick={() => navigate('/customer/forms')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-dark"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to forms
        </button>
        <Card>
          <div className="flex items-start gap-4">
            <CheckCircle className="mt-0.5 h-6 w-6 shrink-0 text-brand" aria-hidden="true" />
            <div>
              <h1 className="text-lg font-semibold text-slate-900">{form.name}</h1>
              <p className="mt-1 text-sm text-slate-600">
                You submitted this form on{' '}
                <span className="font-medium">
                  {new Date(sub.submittedAt).toLocaleDateString(undefined, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                .
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <Card>
          <div className="flex items-start gap-4">
            <CheckCircle className="mt-0.5 h-6 w-6 shrink-0 text-brand" aria-hidden="true" />
            <div>
              <h1 className="text-lg font-semibold text-slate-900">{form.name}</h1>
              <p className="mt-1 text-sm text-slate-600">
                Your response has been submitted. Thank you!
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => navigate('/customer/forms')}
              >
                Back to forms
              </Button>
            </div>
          </div>
        </Card>
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
    <div className="mx-auto max-w-xl space-y-6">
      <button
        type="button"
        onClick={() => navigate('/customer/forms')}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-dark"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to forms
      </button>

      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{form.name}</h1>
        {form.description && (
          <p className="mt-1 text-sm text-slate-500">{form.description}</p>
        )}
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {form.fields
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((field) => (
              <FormField
                key={field.id}
                label={field.label}
                htmlFor={`field-${field.id}`}
                required={field.isRequired}
              >
                {(field.fieldType === 'input' || field.fieldType === 'date') && (
                  <Input
                    id={`field-${field.id}`}
                    type={field.fieldType === 'date' ? 'date' : 'text'}
                    required={field.isRequired}
                    value={(answers[field.id] as string) ?? ''}
                    onChange={(e) => setValue(field.id, e.target.value)}
                  />
                )}

                {field.fieldType === 'text' && (
                  <textarea
                    id={`field-${field.id}`}
                    required={field.isRequired}
                    rows={3}
                    value={(answers[field.id] as string) ?? ''}
                    onChange={(e) => setValue(field.id, e.target.value)}
                    className={sharedInputClass}
                  />
                )}

                {field.fieldType === 'dropdown' && (
                  <select
                    id={`field-${field.id}`}
                    required={field.isRequired}
                    value={(answers[field.id] as string) ?? ''}
                    onChange={(e) => setValue(field.id, e.target.value)}
                    className={sharedInputClass}
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
                  <div className="space-y-2" role="radiogroup">
                    {field.options.map((opt) => (
                      <label
                        key={opt}
                        className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700"
                      >
                        <input
                          type="radio"
                          name={`field-${field.id}`}
                          value={opt}
                          required={field.isRequired}
                          checked={(answers[field.id] as string) === opt}
                          onChange={() => setValue(field.id, opt)}
                          className="h-4 w-4 accent-brand"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                )}

                {field.fieldType === 'checkboxes' && (
                  <div className="space-y-2">
                    {field.options.map((opt) => {
                      const checked = (
                        (answers[field.id] as string[]) ?? []
                      ).includes(opt);
                      return (
                        <label
                          key={opt}
                          className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700"
                        >
                          <input
                            type="checkbox"
                            value={opt}
                            checked={checked}
                            onChange={(e) => {
                              const prev =
                                (answers[field.id] as string[]) ?? [];
                              setValue(
                                field.id,
                                e.target.checked
                                  ? [...prev, opt]
                                  : prev.filter((v) => v !== opt),
                              );
                            }}
                            className="h-4 w-4 accent-brand"
                          />
                          {opt}
                        </label>
                      );
                    })}
                  </div>
                )}
              </FormField>
            ))}

          {submitMutation.isError && (
            <p className="text-sm text-red-600" role="alert">
              {(submitMutation.error as Error).message}
            </p>
          )}

          <Button type="submit" disabled={submitMutation.isPending}>
            {submitMutation.isPending ? 'Submitting…' : 'Submit form'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
