import type { ReactNode } from 'react';

type StaffMasterDetailLayoutProps = {
  panel: ReactNode;
  detail: ReactNode;
};

/**
 * Left column: sticky record list (inbox) to the right of the staff nav.
 * Right column: detail / outlet content.
 */
export function StaffMasterDetailLayout({ panel, detail }: StaffMasterDetailLayoutProps) {
  return (
    <div className="-m-6 flex min-h-screen flex-1 flex-col md:flex-row">
      <aside className="sticky top-0 z-10 flex max-h-[min(42vh,380px)] flex-col border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm md:max-h-none md:h-screen md:w-[20rem] md:shrink-0 md:overflow-hidden md:border-b-0 md:border-r md:border-zinc-800">
        <div className="flex min-h-0 flex-1 flex-col">{panel}</div>
      </aside>
      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto p-6">{detail}</section>
    </div>
  );
}
