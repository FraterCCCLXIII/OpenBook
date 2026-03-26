import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  ClipboardList,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { apiJson } from '../../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type Submission = {
  id: number;
  submittedAt: string;
  answers: Record<string, unknown>;
};

type FormItem = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  submission: Submission | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ─── FormRow ──────────────────────────────────────────────────────────────────

function FormRow({
  form,
  userId,
  queryKey,
}: {
  form: FormItem;
  userId: string;
  roleSlug: string;
  queryKey: unknown[];
}) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  const completed = form.submission !== null;

  const resetMutation = useMutation({
    mutationFn: () =>
      apiJson(`/api/staff/forms/${form.id}/submission/${userId}`, { method: 'DELETE' }),
    onSuccess: () => void qc.invalidateQueries({ queryKey }),
  });

  function handleView() {
    navigate(
      `/staff/form-view/${form.id}/${userId}?back=${encodeURIComponent(location.pathname)}`,
    );
  }

  return (
    <div className="rounded-lg border border-zinc-800 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Form icon */}
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${completed ? 'bg-emerald-500/10' : 'bg-zinc-800'}`}>
          <FileText className={`h-4 w-4 ${completed ? 'text-emerald-400' : 'text-zinc-500'}`} />
        </div>

        {/* Name + meta */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-100">{form.name}</p>
          {completed ? (
            <p className="text-xs text-zinc-500">
              Completed {formatDate(form.submission!.submittedAt)}
            </p>
          ) : (
            <p className="text-xs text-zinc-500">Not yet completed</p>
          )}
        </div>

        {/* Status badge */}
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            completed
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-zinc-800 text-zinc-500'
          }`}
        >
          {completed ? 'Complete' : 'Incomplete'}
        </span>

        {/* View — navigates to full page */}
        <button
          type="button"
          onClick={handleView}
          className="shrink-0 flex items-center gap-1 rounded border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
        >
          View
        </button>

        {/* Reset (completed only) */}
        {completed && (
          <button
            type="button"
            onClick={() => resetMutation.mutate()}
            disabled={resetMutation.isPending}
            title="Reset submission"
            className="shrink-0 rounded border border-zinc-700 p-1.5 text-zinc-500 hover:border-red-800 hover:text-red-400 disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {resetMutation.isError && (
        <p className="border-t border-zinc-800 px-4 py-2 text-xs text-red-400">
          {(resetMutation.error as Error).message}
        </p>
      )}
    </div>
  );
}

// ─── StaffRoleFormsTab ────────────────────────────────────────────────────────

export function StaffRoleFormsTab({
  roleSlug,
  userId,
}: {
  roleSlug: string;
  userId?: string;
}) {
  const queryKey = ['staff', 'forms', 'role', roleSlug, userId ?? null];

  const q = useQuery({
    queryKey,
    queryFn: () =>
      apiJson<{ items: FormItem[] }>(
        `/api/staff/forms/for-role/${roleSlug}${userId ? `?userId=${userId}` : ''}`,
      ),
  });

  const reminderMutation = useMutation({
    mutationFn: () =>
      apiJson<{ ok: boolean; sent: boolean; reason?: string }>(
        `/api/staff/forms/remind/${userId}`,
        { method: 'POST', body: JSON.stringify({ roleSlug }) },
      ),
  });

  if (q.isPending) return <p className="text-sm text-zinc-500">Loading…</p>;
  if (q.isError) return <p className="text-sm text-red-400">{(q.error as Error).message}</p>;

  const items = q.data.items as FormItem[];

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <ClipboardList className="h-8 w-8 text-zinc-700" />
        <p className="text-sm text-zinc-500">
          No forms are assigned to the{' '}
          <span className="font-medium text-zinc-400">{roleSlug}</span> role.
        </p>
        <p className="text-xs text-zinc-600">
          Go to Settings → Forms to create forms and assign them to user types.
        </p>
      </div>
    );
  }

  const incompleteCount = items.filter((f) => f.submission === null).length;

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          {items.length - incompleteCount}/{items.length} completed
        </p>

        {userId && incompleteCount > 0 && (
          <div className="flex items-center gap-2">
            {reminderMutation.isSuccess && (
              <span className="text-xs text-emerald-500">
                {reminderMutation.data.sent
                  ? `Reminder sent for ${reminderMutation.data.count ?? incompleteCount} form${incompleteCount === 1 ? '' : 's'}`
                  : reminderMutation.data.reason}
              </span>
            )}
            {reminderMutation.isError && (
              <span className="text-xs text-red-400">
                {(reminderMutation.error as Error).message}
              </span>
            )}
            <button
              type="button"
              onClick={() => reminderMutation.mutate()}
              disabled={reminderMutation.isPending}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 disabled:opacity-50"
            >
              <Bell className="h-3.5 w-3.5" />
              {reminderMutation.isPending ? 'Sending…' : 'Send Reminder'}
            </button>
          </div>
        )}
      </div>

      {/* Form rows */}
      {items.map((form) => (
        userId ? (
          <FormRow
            key={form.id}
            form={form}
            userId={userId}
            roleSlug={roleSlug}
            queryKey={queryKey}
          />
        ) : (
          <div
            key={form.id}
            className="flex items-center gap-3 rounded-lg border border-zinc-800 px-4 py-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800">
              <FileText className="h-4 w-4 text-zinc-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-100">{form.name}</p>
              {form.description && (
                <p className="mt-0.5 text-xs text-zinc-500">{form.description}</p>
              )}
            </div>
          </div>
        )
      ))}
    </div>
  );
}
