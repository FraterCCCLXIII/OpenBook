import { useQuery } from '@tanstack/react-query';
import { BookWizard } from '../components/BookWizard';

async function fetchPublicSettings(): Promise<Record<string, string>> {
  const res = await fetch('/api/settings/public');
  if (!res.ok) return {};
  return res.json() as Promise<Record<string, string>>;
}

export function BookPage() {
  const { data: settings = {} } = useQuery({
    queryKey: ['settings', 'public'],
    queryFn: fetchPublicSettings,
    staleTime: 5 * 60 * 1000,
  });

  if (settings.disable_booking === '1') {
    return (
      <div className="flex justify-center px-4">
        <div id="book-appointment-wizard" className="w-full max-w-lg py-12 text-center">
          <p className="text-slate-600">
            {settings.disable_booking_message?.trim() ||
              'Online booking is temporarily unavailable. Please contact us.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <div id="book-appointment-wizard" className="w-full max-w-sm">
        <BookWizard />
      </div>
    </div>
  );
}
