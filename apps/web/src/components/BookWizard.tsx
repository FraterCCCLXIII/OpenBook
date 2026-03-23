import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckSquare, ChevronRight } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

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
};

type Confirmation = {
  id: string;
  startDatetime: string | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const STEP_LABELS = [
  'Select Service',
  'Select Provider',
  'Appointment Date & Time',
  'Customer Information',
  'Appointment Confirmation',
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function dayOfWeek(year: number, month: number, day: number): string {
  return DAYS_SHORT[new Date(year, month, day).getDay()];
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Convert "HH:MM" (24h) → "h:MM AM/PM" */
function to12h(time: string): string {
  const [hStr, mStr] = time.split(':');
  const h = parseInt(hStr, 10);
  const suffix = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr} ${suffix}`;
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({
  label,
  htmlFor,
  required = false,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="form-label">
        {label}
        {required && (
          <span className="ml-0.5 text-red-500" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

// ─── BookWizard ───────────────────────────────────────────────────────────────

export function BookWizard() {
  const { user } = useAuth();
  const customerUser = user?.kind === 'customer' ? user : null;

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  // ── Step state ──────────────────────────────────────────────────────────────
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // ── Step 1 ──────────────────────────────────────────────────────────────────
  const [serviceId, setServiceId] = useState('');

  // ── Step 2 ──────────────────────────────────────────────────────────────────
  const [providerId, setProviderId] = useState('');

  // ── Step 3 ──────────────────────────────────────────────────────────────────
  const [selYear, setSelYear] = useState(todayDate.getFullYear());
  const [selMonth, setSelMonth] = useState(todayDate.getMonth());
  const [selDay, setSelDay] = useState(todayDate.getDate());
  const [selSlot, setSelSlot] = useState('');
  const [hours, setHours] = useState<string[]>([]);
  const [hoursLoading, setHoursLoading] = useState(false);
  const [hoursError, setHoursError] = useState<string | null>(null);

  const datesRef = useRef<HTMLDivElement>(null);

  // ── Step 4 ──────────────────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState(customerUser?.firstName ?? '');
  const [lastName, setLastName] = useState(customerUser?.lastName ?? '');
  const [email, setEmail] = useState(customerUser?.email ?? '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [notes, setNotes] = useState('');

  // ── Step 5 ──────────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<Confirmation | null>(null);

  // ── Queries ─────────────────────────────────────────────────────────────────
  const servicesQuery = useQuery({
    queryKey: ['booking', 'services'],
    queryFn: async (): Promise<PublicService[]> => {
      const r = await fetch('/api/booking/services');
      if (!r.ok) throw new Error('Failed to load services');
      return r.json() as Promise<PublicService[]>;
    },
  });

  const providersQuery = useQuery({
    queryKey: ['booking', 'providers', serviceId],
    queryFn: async (): Promise<PublicProvider[]> => {
      const r = await fetch(
        `/api/booking/services/${encodeURIComponent(serviceId)}/providers`,
      );
      if (!r.ok) throw new Error('Failed to load providers');
      return r.json() as Promise<PublicProvider[]>;
    },
    enabled: Boolean(serviceId),
  });

  // ── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    setProviderId('');
  }, [serviceId]);

  // Auto-scroll today/selected date into view when the dates strip renders
  useEffect(() => {
    const el = datesRef.current?.querySelector<HTMLElement>(
      '.date.selected, .date.today',
    );
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [selMonth]);

  // Load available hours whenever step 3 date selection changes
  useEffect(() => {
    if (step !== 3 || !serviceId || !providerId) return;
    const dateStr = `${selYear}-${pad2(selMonth + 1)}-${pad2(selDay)}`;
    setSelSlot('');
    setHoursLoading(true);
    setHoursError(null);
    fetch('/api/booking/available-hours', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: serviceId,
        provider_id: providerId,
        selected_date: dateStr,
      }),
    })
      .then((r) => {
        if (!r.ok) throw new Error('Request failed');
        return r.json() as Promise<string[]>;
      })
      .then((h) => setHours(Array.isArray(h) ? h : []))
      .catch((e: Error) => setHoursError(e.message))
      .finally(() => setHoursLoading(false));
  }, [step, selYear, selMonth, selDay, serviceId, providerId]);

  // ── Date helpers ─────────────────────────────────────────────────────────────

  const isPastMonth = (m: number): boolean =>
    selYear < todayDate.getFullYear() ||
    (selYear === todayDate.getFullYear() && m < todayDate.getMonth());

  const isPastDay = (d: number): boolean => {
    const dt = new Date(selYear, selMonth, d);
    return dt < todayDate;
  };

  const isToday = (d: number): boolean =>
    selYear === todayDate.getFullYear() &&
    selMonth === todayDate.getMonth() &&
    d === todayDate.getDate();

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const dateStr = `${selYear}-${pad2(selMonth + 1)}-${pad2(selDay)}`;
      const res = await fetch('/api/booking/appointments', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: serviceId,
          provider_id: providerId,
          selected_date: dateStr,
          start_time: selSlot,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          city: city.trim() || undefined,
          zip_code: zip.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => null)) as unknown;
      if (!res.ok) {
        const msg =
          data && typeof data === 'object' && 'message' in data
            ? String((data as { message: unknown }).message)
            : 'Booking failed';
        throw new Error(msg);
      }
      const row = data as Confirmation;
      setConfirmed({ id: row.id, startDatetime: row.startDatetime });
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Derived ──────────────────────────────────────────────────────────────────

  const services = servicesQuery.data ?? [];
  const providers = providersQuery.data ?? [];
  const selectedService = services.find((s) => s.id === serviceId);
  const selectedProvider = providers.find((p) => p.id === providerId);

  const goToStep = (s: 1 | 2 | 3 | 4 | 5) => {
    if (s < step && confirmed === null) setStep(s);
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Step indicator ───────────────────────────────────────────────── */}
      <div id="header" className="mb-6 mt-4">
        <div id="steps" className="flex items-center justify-center gap-3">
          {([1, 2, 3, 4, 5] as const).map((s) => (
            <div
              key={s}
              className={[
                'book-step',
                step === s ? 'active-step' : '',
                step > s ? 'completed-step' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => goToStep(s)}
              title={STEP_LABELS[s - 1]}
              aria-label={STEP_LABELS[s - 1]}
              aria-current={step === s ? 'step' : undefined}
            >
              <strong>{s}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* ── Step 1: Select Service ────────────────────────────────────────── */}
      {step === 1 && (
        <div id="wizard-frame-1" className="wizard-frame booking-section">
          <div className="frame-container">
            <h2 className="frame-title booking-frame-title">Select Service</h2>
            <div className="frame-content mt-6">
              <div className="booking-frame-content">
                {servicesQuery.isPending && (
                  <p className="text-sm text-slate-400">Loading services…</p>
                )}
                {servicesQuery.isError && (
                  <p className="text-sm text-red-600">
                    Could not load services. Is the API running?
                  </p>
                )}
                {servicesQuery.isSuccess && (
                  <div className="mb-6">
                    <div
                      id="service-card-list-label"
                      className="mb-2 text-sm font-medium text-slate-700"
                    >
                      <strong>Select a Service</strong>
                    </div>
                    <div
                      id="service-card-list"
                      className="grid gap-2"
                      role="radiogroup"
                      aria-labelledby="service-card-list-label"
                    >
                      {services.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          className={`booking-card p-4 text-left service-card${serviceId === s.id ? ' selected' : ''}`}
                          data-service-id={s.id}
                          role="radio"
                          aria-checked={serviceId === s.id}
                          onClick={() => setServiceId(s.id)}
                        >
                          <div className="font-medium text-slate-900">
                            {s.name ?? `Service ${s.id}`}
                          </div>
                          {s.duration != null && (
                            <div className="booking-card-subtitle service-card-duration text-sm mt-0.5">
                              {s.duration} Minutes
                            </div>
                          )}
                          {s.price && Number(s.price) > 0 && s.currency && (
                            <div className="booking-card-subtitle text-sm">
                              {s.currency}
                              {s.price}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="command-buttons mt-6">
            <div className="booking-frame-content">
              <button
                type="button"
                id="button-next-1"
                className={`button-next booking-button${!serviceId ? ' disabled' : ''}`}
                data-step_index="1"
                disabled={!serviceId}
                aria-disabled={!serviceId}
                onClick={() => setStep(2)}
              >
                Next{' '}
                <ChevronRight
                  className="ml-2 inline h-4 w-4"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Select Provider ───────────────────────────────────────── */}
      {step === 2 && (
        <div id="wizard-frame-2" className="wizard-frame booking-section">
          <div className="frame-container">
            <h2 className="frame-title booking-frame-title">Select Provider</h2>
            <div className="frame-content mt-6">
              <div className="booking-frame-content">
                <div id="provider-card-container" className="mb-6">
                  {providersQuery.isPending && (
                    <p className="text-sm text-slate-400">Loading providers…</p>
                  )}
                  {providersQuery.isError && (
                    <p className="text-sm text-red-600">
                      Could not load providers for this service.
                    </p>
                  )}
                  {providersQuery.isSuccess && providers.length === 0 && (
                    <p className="text-sm text-slate-500">
                      No providers available for this service.
                    </p>
                  )}
                  {providersQuery.isSuccess && providers.length > 0 && (
                    <>
                      <div
                        id="provider-card-list-label"
                        className="mb-2 text-sm font-medium text-slate-700"
                      >
                        <strong>Select Provider</strong>
                      </div>
                      <div
                        id="provider-card-list"
                        className="grid gap-2"
                        role="radiogroup"
                        aria-labelledby="provider-card-list-label"
                      >
                        {providers.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            className={`booking-card p-4 text-left provider-card${providerId === p.id ? ' selected' : ''}`}
                            role="radio"
                            aria-checked={providerId === p.id}
                            onClick={() => setProviderId(p.id)}
                          >
                            <div className="font-medium text-slate-900">
                              {p.displayName}
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="command-buttons mt-6">
            <div className="booking-frame-content">
              <button
                type="button"
                id="button-next-2"
                className={`button-next booking-button${!providerId ? ' disabled' : ''}`}
                data-step_index="2"
                disabled={!providerId}
                aria-disabled={!providerId}
                onClick={() => setStep(3)}
              >
                Next{' '}
                <ChevronRight
                  className="ml-2 inline h-4 w-4"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3: Date & Time ───────────────────────────────────────────── */}
      {step === 3 && (
        <div id="wizard-frame-3" className="wizard-frame booking-section">
          <div className="frame-container">
            <h2 className="frame-title booking-frame-title">
              Appointment Date &amp; Time
            </h2>
            <div className="frame-content mt-6">
              <div className="booking-frame-content">
                <div className="date-picker-container mb-6">
                  <div className="date-picker">
                    {/* Month strip */}
                    <div className="months-container">
                      {MONTHS_SHORT.map((m, i) => {
                        const past = isPastMonth(i);
                        return (
                          <div
                            key={i}
                            data-index={i}
                            className={[
                              'month',
                              selMonth === i ? 'selected' : '',
                              past ? 'disabled' : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            onClick={() => {
                              if (!past) {
                                setSelMonth(i);
                                setSelSlot('');
                              }
                            }}
                          >
                            {m}
                          </div>
                        );
                      })}
                    </div>

                    {/* Dates strip */}
                    <div
                      className="dates-container mt-3"
                      id="dates-container"
                      ref={datesRef}
                    >
                      {Array.from(
                        { length: daysInMonth(selYear, selMonth) },
                        (_, i) => i + 1,
                      ).map((d) => {
                        const past = isPastDay(d);
                        const tod = isToday(d);
                        return (
                          <div
                            key={d}
                            data-day={d}
                            className={[
                              'date',
                              selDay === d ? 'selected' : '',
                              past ? 'disabled' : '',
                              tod && selDay !== d ? 'today' : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            onClick={() => {
                              if (!past) {
                                setSelDay(d);
                                setSelSlot('');
                              }
                            }}
                          >
                            <span className="day-name">
                              {dayOfWeek(selYear, selMonth, d)}
                            </span>
                            <span className="day-number">{d}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Date + time summary */}
                <div className="date-time-summary mb-4 mt-4 flex items-center justify-between gap-3">
                  <p
                    id="selected-date"
                    className="text-sm font-medium text-slate-900"
                  >
                    {selSlot
                      ? `${MONTHS_LONG[selMonth]} ${selDay} at ${to12h(selSlot)}`
                      : 'Select Time'}
                  </p>
                </div>

                {/* Available hours */}
                <div id="available-hours-container" className="mt-4">
                  {hoursLoading && (
                    <p className="text-sm text-slate-400">
                      Loading available times…
                    </p>
                  )}
                  {hoursError && (
                    <p className="text-sm text-red-600">{hoursError}</p>
                  )}
                  {!hoursLoading && !hoursError && hours.length === 0 && (
                    <p className="text-sm text-slate-500">
                      There are no available appointment hours for the selected
                      date. Please choose another date.
                    </p>
                  )}
                  {hours.length > 0 && (
                    <div
                      id="available-hours"
                      className="grid grid-cols-3 gap-2"
                    >
                      {hours.map((h) => (
                        <button
                          key={h}
                          type="button"
                          className={`hour-slot${selSlot === h ? ' selected' : ''}`}
                          onClick={() => setSelSlot(h)}
                        >
                          {to12h(h)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="command-buttons mt-6">
            <div className="booking-frame-content">
              <button
                type="button"
                id="button-next-3"
                className={`button-next booking-button${!selSlot ? ' disabled' : ''}`}
                data-step_index="3"
                disabled={!selSlot}
                aria-disabled={!selSlot}
                onClick={() => setStep(4)}
              >
                Next{' '}
                <ChevronRight
                  className="ml-2 inline h-4 w-4"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 4: Customer Information ──────────────────────────────────── */}
      {step === 4 && (
        <div id="wizard-frame-4" className="wizard-frame booking-section">
          <div className="frame-container">
            <h2 className="frame-title booking-frame-title">
              Customer Information
            </h2>
            <div className="frame-content mt-6">
              <div className="booking-frame-content space-y-4">
                <Field label="First Name" htmlFor="book-first-name" required>
                  <input
                    id="book-first-name"
                    type="text"
                    className="booking-input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    maxLength={100}
                    required
                    autoComplete="given-name"
                  />
                </Field>
                <Field label="Last Name" htmlFor="book-last-name" required>
                  <input
                    id="book-last-name"
                    type="text"
                    className="booking-input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    maxLength={120}
                    required
                    autoComplete="family-name"
                  />
                </Field>
                <Field label="Email" htmlFor="book-email" required>
                  <input
                    id="book-email"
                    type="email"
                    className="booking-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={120}
                    required
                    readOnly={!!customerUser}
                    aria-readonly={customerUser ? true : undefined}
                    autoComplete="email"
                  />
                </Field>
                <Field label="Phone Number" htmlFor="book-phone">
                  <input
                    id="book-phone"
                    type="tel"
                    className="booking-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={60}
                    autoComplete="tel"
                  />
                </Field>
                <Field label="Address" htmlFor="book-address">
                  <input
                    id="book-address"
                    type="text"
                    className="booking-input"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    maxLength={120}
                    autoComplete="street-address"
                  />
                </Field>
                <Field label="City" htmlFor="book-city">
                  <input
                    id="book-city"
                    type="text"
                    className="booking-input"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    maxLength={120}
                    autoComplete="address-level2"
                  />
                </Field>
                <Field label="Zip Code" htmlFor="book-zip">
                  <input
                    id="book-zip"
                    type="text"
                    className="booking-input"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    maxLength={20}
                    autoComplete="postal-code"
                  />
                </Field>
                <Field label="Notes" htmlFor="book-notes">
                  <textarea
                    id="book-notes"
                    className="booking-input"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    maxLength={500}
                    rows={2}
                  />
                </Field>
              </div>
            </div>
          </div>
          <div className="command-buttons mt-6">
            <div className="booking-frame-content">
              <button
                type="button"
                id="button-next-4"
                className={`button-next booking-button${!firstName.trim() || !lastName.trim() || !email.trim() ? ' disabled' : ''}`}
                data-step_index="4"
                disabled={
                  !firstName.trim() || !lastName.trim() || !email.trim()
                }
                aria-disabled={
                  !firstName.trim() || !lastName.trim() || !email.trim()
                }
                onClick={() => setStep(5)}
              >
                Next{' '}
                <ChevronRight
                  className="ml-2 inline h-4 w-4"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 5: Confirmation / Success ────────────────────────────────── */}
      {step === 5 && (
        <div id="wizard-frame-5" className="wizard-frame booking-section">
          <div className="frame-container">
            <h2 className="frame-title booking-frame-title">
              {confirmed
                ? 'Your appointment is confirmed!'
                : 'Appointment Confirmation'}
            </h2>

            <div className="frame-content mt-6">
              <div className="booking-frame-content space-y-4">
                {/* Appointment details */}
                <div
                  id="appointment-details"
                  className="rounded-xl border border-slate-200 bg-white p-4 text-left"
                >
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Appointment Details
                  </p>
                  <dl className="space-y-1.5 text-sm">
                    {selectedService && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Service</dt>
                        <dd className="font-medium text-slate-900 text-right">
                          {selectedService.name}
                        </dd>
                      </div>
                    )}
                    {selectedProvider && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Provider</dt>
                        <dd className="font-medium text-slate-900 text-right">
                          {selectedProvider.displayName}
                        </dd>
                      </div>
                    )}
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Date &amp; Time</dt>
                      <dd className="font-medium text-slate-900 text-right">
                        {confirmed?.startDatetime
                          ? new Date(confirmed.startDatetime).toLocaleString(
                              undefined,
                              {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              },
                            )
                          : `${MONTHS_LONG[selMonth]} ${selDay}, ${selYear} at ${to12h(selSlot)}`}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Customer details */}
                <div
                  id="customer-details"
                  className="rounded-xl border border-slate-200 bg-white p-4 text-left"
                >
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Customer Details
                  </p>
                  <dl className="space-y-1.5 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Name</dt>
                      <dd className="font-medium text-slate-900">
                        {firstName} {lastName}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Email</dt>
                      <dd className="font-medium text-slate-900 text-right">
                        {email}
                      </dd>
                    </div>
                    {phone && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Phone</dt>
                        <dd className="font-medium text-slate-900">{phone}</dd>
                      </div>
                    )}
                    {city && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">City</dt>
                        <dd className="font-medium text-slate-900">{city}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                {confirmed && (
                  <p className="text-center text-sm text-slate-500">
                    A confirmation email has been sent to{' '}
                    <strong>{email}</strong>.
                  </p>
                )}

                {submitError && (
                  <p className="text-sm text-red-600" role="alert">
                    {submitError}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="command-buttons mt-6">
            <div className="booking-frame-content">
              {confirmed ? (
                <Link
                  to="/customer/bookings"
                  className="booking-button block text-center"
                >
                  View My Bookings
                </Link>
              ) : (
                <form id="book-appointment-form" className="w-full">
                  <button
                    id="book-appointment-submit"
                    type="button"
                    className={`booking-button${submitting ? ' disabled' : ''}`}
                    disabled={submitting}
                    onClick={() => void handleSubmit()}
                  >
                    <CheckSquare
                      className="mr-2 inline h-4 w-4"
                      aria-hidden="true"
                    />
                    {submitting ? 'Booking…' : 'Confirm'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div id="frame-footer" className="mt-6 text-center">
        <div className="flex justify-center gap-4 text-sm text-slate-500" />
      </div>
    </>
  );
}
