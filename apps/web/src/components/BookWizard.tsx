import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

type Step = 1 | 2 | 3 | 4 | 5;

type PublicService = {
  id: string;
  name: string | null;
  duration: number | null;
  price: string | null;
  currency: string | null;
};

type PublicProvider = {
  id: string;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
};

async function fetchServices(): Promise<PublicService[]> {
  const res = await fetch('/api/booking/services');
  if (!res.ok) {
    throw new Error('Failed to load services');
  }
  return res.json() as Promise<PublicService[]>;
}

async function fetchProviders(serviceId: string): Promise<PublicProvider[]> {
  const res = await fetch(`/api/booking/services/${encodeURIComponent(serviceId)}/providers`);
  if (!res.ok) {
    throw new Error('Failed to load providers');
  }
  return res.json() as Promise<PublicProvider[]>;
}

export function BookWizard() {
  const [step, setStep] = useState<Step>(1);
  const [serviceId, setServiceId] = useState('');
  const [providerId, setProviderId] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [hours, setHours] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [confirmation, setConfirmation] = useState<{
    id: string;
    startDatetime: string | null;
  } | null>(null);

  const servicesQuery = useQuery({
    queryKey: ['booking', 'services'],
    queryFn: fetchServices,
  });

  const providersQuery = useQuery({
    queryKey: ['booking', 'providers', serviceId],
    queryFn: () => fetchProviders(serviceId),
    enabled: Boolean(serviceId),
  });

  useEffect(() => {
    setProviderId('');
  }, [serviceId]);

  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedDate, serviceId, providerId]);

  const loadHours = async () => {
    if (!serviceId || !providerId) {
      setError('Select a service and provider first.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/booking/available-hours', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: serviceId,
          provider_id: providerId,
          selected_date: selectedDate,
        }),
      });
      if (!res.ok) {
        throw new Error('Request failed');
      }
      const data: unknown = await res.json();
      setHours(Array.isArray(data) ? (data as string[]) : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setHours([]);
    } finally {
      setLoading(false);
    }
  };

  const submitBooking = async () => {
    if (!serviceId || !providerId || !selectedDate || !selectedSlot) {
      setError('Missing booking selections.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/booking/appointments', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: serviceId,
          provider_id: providerId,
          selected_date: selectedDate,
          start_time: selectedSlot,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          data && typeof data === 'object' && 'message' in data
            ? String((data as { message: unknown }).message)
            : 'Booking failed';
        throw new Error(msg);
      }
      const row = data as { id: string; startDatetime: string | null };
      setConfirmation({ id: row.id, startDatetime: row.startDatetime });
      setStep(5);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  const services = servicesQuery.data ?? [];
  const providers = providersQuery.data ?? [];

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <ol className="flex gap-2 text-sm text-zinc-500">
        {[1, 2, 3, 4].map((s) => (
          <li
            key={s}
            className={`rounded px-2 py-1 ${step === s ? 'bg-zinc-800 text-zinc-100' : ''}`}
          >
            Step {s}
          </li>
        ))}
      </ol>

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-zinc-200">Service &amp; provider</h2>
          {servicesQuery.isError && (
            <p className="text-sm text-red-400">Could not load services. Is the API running?</p>
          )}
          {servicesQuery.isPending && <p className="text-sm text-zinc-500">Loading services…</p>}
          <label className="block space-y-1">
            <span className="text-xs uppercase tracking-wide text-zinc-500">Service</span>
            <select
              aria-label="Booking service"
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
            >
              <option value="">Select a service</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name ?? `Service ${s.id}`}
                  {s.duration != null ? ` · ${s.duration} min` : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-xs uppercase tracking-wide text-zinc-500">Provider</span>
            <select
              aria-label="Booking provider"
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
              value={providerId}
              disabled={!serviceId || providersQuery.isPending}
              onChange={(e) => setProviderId(e.target.value)}
            >
              <option value="">{serviceId ? 'Select a provider' : 'Choose a service first'}</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.displayName}
                </option>
              ))}
            </select>
          </label>
          {providersQuery.isError && serviceId && (
            <p className="text-sm text-red-400">Could not load providers for this service.</p>
          )}
          <button
            type="button"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            disabled={!serviceId || !providerId}
            onClick={() => setStep(2)}
          >
            Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-2">
          <h2 className="text-lg font-medium text-zinc-200">Date</h2>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
          />
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-lg border border-zinc-600 px-4 py-2 text-sm"
              onClick={() => setStep(1)}
            >
              Back
            </button>
            <button
              type="button"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
              onClick={() => {
                setStep(3);
                void loadHours();
              }}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-2">
          <h2 className="text-lg font-medium text-zinc-200">Time</h2>
          {loading && <p className="text-sm text-zinc-500">Loading slots…</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}
          <ul className="grid grid-cols-3 gap-2">
            {hours.map((h) => (
              <li key={h}>
                <button
                  type="button"
                  className="w-full rounded border border-zinc-700 py-2 text-sm hover:border-emerald-500"
                  onClick={() => {
                    setSelectedSlot(h);
                    setStep(4);
                  }}
                >
                  {h}
                </button>
              </li>
            ))}
          </ul>
          {hours.length === 0 && !loading && !error && (
            <p className="text-sm text-zinc-500">No slots for this date. Try another day.</p>
          )}
          <button
            type="button"
            className="text-sm text-zinc-400 underline"
            onClick={() => setStep(2)}
          >
            Back
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-zinc-200">Your details</h2>
          <p className="text-sm text-zinc-500">
            Time: <span className="text-zinc-300">{selectedSlot}</span> on {selectedDate}
          </p>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs text-zinc-500">First name</span>
              <input
                aria-label="First name"
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-zinc-500">Last name</span>
              <input
                aria-label="Last name"
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-xs text-zinc-500">Email</span>
            <input
              type="email"
              aria-label="Email"
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-zinc-500">Phone (optional)</span>
            <input
              type="tel"
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-zinc-500">Notes (optional)</span>
            <textarea
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-lg border border-zinc-600 px-4 py-2 text-sm"
              onClick={() => setStep(3)}
            >
              Back
            </button>
            <button
              type="button"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              disabled={submitting || !firstName.trim() || !lastName.trim() || !email.trim()}
              onClick={() => void submitBooking()}
            >
              {submitting ? 'Booking…' : 'Confirm booking'}
            </button>
          </div>
        </div>
      )}

      {step === 5 && confirmation && (
        <div className="space-y-3 rounded-lg border border-emerald-900/50 bg-emerald-950/30 p-4">
          <h2 className="text-lg font-medium text-emerald-200">You&apos;re booked</h2>
          <p className="text-sm text-zinc-400">
            Reference <span className="font-mono text-zinc-200">{confirmation.id}</span>
            {confirmation.startDatetime && (
              <>
                {' '}
                · {new Date(confirmation.startDatetime).toLocaleString()}
              </>
            )}
          </p>
          <button
            type="button"
            className="rounded-lg border border-zinc-600 px-4 py-2 text-sm"
            onClick={() => {
              setStep(1);
              setConfirmation(null);
              setSelectedSlot(null);
              setFirstName('');
              setLastName('');
              setEmail('');
              setPhone('');
              setNotes('');
            }}
          >
            Book another
          </button>
        </div>
      )}
    </div>
  );
}
