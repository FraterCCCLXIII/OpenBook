import { useEffect, useState } from 'react';

/** Keys match Easy!Appointments `working_plan` JSON (`assets/js/utils/working_plan.js`). */
export const WORKING_PLAN_DAY_KEYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

export type WorkingPlanDayKey = (typeof WORKING_PLAN_DAY_KEYS)[number];

type DayRow = {
  key: WorkingPlanDayKey;
  label: string;
  enabled: boolean;
  start: string;
  end: string;
};

const DEFAULT_START = '09:00';
const DEFAULT_END = '17:00';

function parsePlan(json: string | null | undefined): Record<string, unknown> {
  if (!json?.trim()) return {};
  try {
    const v = JSON.parse(json) as unknown;
    return v && typeof v === 'object' && !Array.isArray(v)
      ? (v as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function rowsFromPlan(json: string | null | undefined): DayRow[] {
  const plan = parsePlan(json);
  return WORKING_PLAN_DAY_KEYS.map((key) => {
    const raw = plan[key];
    const day =
      raw && typeof raw === 'object' && !Array.isArray(raw)
        ? (raw as { start?: string; end?: string })
        : null;
    const enabled = Boolean(day?.start && day?.end);
    return {
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      enabled,
      start: (typeof day?.start === 'string' ? day.start : DEFAULT_START).slice(0, 5),
      end: (typeof day?.end === 'string' ? day.end : DEFAULT_END).slice(0, 5),
    };
  });
}

function planFromRows(rows: DayRow[]): string {
  const out: Record<string, { start: string; end: string; breaks: unknown[] } | null> =
    {};
  for (const r of rows) {
    if (r.enabled && r.start && r.end) {
      out[r.key] = { start: r.start, end: r.end, breaks: [] };
    } else {
      out[r.key] = null;
    }
  }
  return JSON.stringify(out, null, 2);
}

type Props = {
  workingPlanJson: string | null | undefined;
  onWorkingPlanChange: (json: string) => void;
};

/**
 * Structured editor for `ea_user_settings.working_plan` (weekly hours, EA-compatible shape).
 * Breaks are preserved as `[]`; use raw JSON below for complex break rules.
 */
export function StaffWorkingPlanEditor({
  workingPlanJson,
  onWorkingPlanChange,
}: Props) {
  const [rows, setRows] = useState<DayRow[]>(() =>
    rowsFromPlan(workingPlanJson ?? null),
  );

  useEffect(() => {
    setRows(rowsFromPlan(workingPlanJson ?? null));
  }, [workingPlanJson]);

  function updateRow(key: WorkingPlanDayKey, patch: Partial<DayRow>) {
    setRows((prev) => {
      const next = prev.map((r) => (r.key === key ? { ...r, ...patch } : r));
      onWorkingPlanChange(planFromRows(next));
      return next;
    });
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full min-w-[360px] text-left text-sm text-zinc-300">
        <thead className="border-b border-zinc-800 bg-zinc-900/60 text-xs uppercase text-zinc-500">
          <tr>
            <th className="px-3 py-2">Day</th>
            <th className="px-3 py-2">Work</th>
            <th className="px-3 py-2">Start</th>
            <th className="px-3 py-2">End</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-b border-zinc-800/80">
              <td className="px-3 py-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={r.enabled}
                    onChange={(e) =>
                      updateRow(r.key, { enabled: e.target.checked })
                    }
                    className="rounded border-zinc-600"
                  />
                  <span>{r.label}</span>
                </label>
              </td>
              <td className="px-3 py-2 text-zinc-500">
                {r.enabled ? 'On' : 'Off'}
              </td>
              <td className="px-3 py-2">
                <input
                  type="time"
                  value={r.start}
                  disabled={!r.enabled}
                  onChange={(e) => updateRow(r.key, { start: e.target.value })}
                  className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-100 disabled:opacity-40"
                />
              </td>
              <td className="px-3 py-2">
                <input
                  type="time"
                  value={r.end}
                  disabled={!r.enabled}
                  onChange={(e) => updateRow(r.key, { end: e.target.value })}
                  className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-100 disabled:opacity-40"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
