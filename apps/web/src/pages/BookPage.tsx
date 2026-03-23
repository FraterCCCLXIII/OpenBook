export function BookPage() {
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold text-zinc-50">Book an appointment</h1>
      <p className="text-zinc-400">
        Public booking wizard (service → provider → date → time → details → payment) will live here. The legacy flow
        uses PHP endpoints such as{' '}
        <code className="rounded bg-zinc-800 px-1 py-0.5 text-xs text-zinc-300">booking/get_available_hours</code>
        {' — '}
        those will become REST routes on the Nest API.
      </p>
      <div className="rounded-lg border border-dashed border-zinc-700 bg-zinc-900/50 p-8 text-center text-sm text-zinc-500">
        Booking UI placeholder — next: implement availability + registration against the new API.
      </div>
    </div>
  );
}
