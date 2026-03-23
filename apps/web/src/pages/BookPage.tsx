import { BookWizard } from '../components/BookWizard';

export function BookPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-50">Book an appointment</h1>
        <p className="mt-2 text-zinc-400">
          Wizard calls <code className="text-zinc-500">POST /api/booking/available-hours</code> (mock slots until
          availability is ported).
        </p>
      </div>
      <BookWizard />
    </div>
  );
}
