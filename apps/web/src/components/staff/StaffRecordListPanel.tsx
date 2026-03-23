import { Search } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';

export type StaffRecordListPanelProps = {
  id: string;
  title: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  addButton?: { label: string; onClick: () => void };
  headerExtra?: ReactNode;
  children: ReactNode;
  searchPlaceholder?: string;
  filterAriaLabel?: string;
};

export function StaffRecordListPanel({
  id,
  title,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  addButton,
  headerExtra,
  children,
  searchPlaceholder = 'Search…',
  filterAriaLabel = 'Filter',
}: StaffRecordListPanelProps) {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSearchSubmit?.(e);
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 px-4 pt-4">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-50">{title}</h2>
        {addButton && (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={addButton.onClick}
              className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
            >
              {addButton.label}
            </button>
          </div>
        )}
      </div>

      {headerExtra}

      <form className="mb-3 shrink-0 px-4 pt-3" onSubmit={handleSubmit}>
        <div className="flex overflow-hidden rounded-lg border border-zinc-700">
          <input
            id={`${id}-search`}
            type="search"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="min-w-0 flex-1 border-0 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
            aria-label={searchPlaceholder}
          />
          <button
            type="submit"
            className="border-l border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            title={filterAriaLabel}
            aria-label={filterAriaLabel}
          >
            <Search className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </form>

      <div
        id={id}
        className="min-h-0 flex-1 overflow-y-auto border-t border-zinc-800 bg-zinc-950/40"
      >
        {children}
      </div>
    </div>
  );
}

export function StaffRecordPlaceholder({ message }: { message: string }) {
  return (
    <div className="flex h-full min-h-[min(50vh,24rem)] items-center justify-center px-4 text-center text-sm text-zinc-500">
      {message}
    </div>
  );
}
