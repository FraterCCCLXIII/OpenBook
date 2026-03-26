import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarPlus, CheckCircle, Circle, List } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { apiJson } from '../../lib/api';

type FormListItem = { id: number; name: string; description: string | null };

export function CustomerDashboardPage() {
  const { user } = useAuth();
  const customerUser = user?.kind === 'customer' ? user : null;

  const firstName =
    customerUser?.firstName ??
    customerUser?.email?.split('@')[0] ??
    'there';

  const profileComplete = !!(customerUser?.firstName && customerUser?.lastName);

  const formsQ = useQuery({
    queryKey: ['customer', 'forms'],
    queryFn: () => apiJson<{ items: FormListItem[] }>('/api/customer/forms'),
  });

  const settingsQ = useQuery({
    queryKey: ['settings', 'public'],
    queryFn: async () => {
      const r = await fetch('/api/settings/public');
      if (!r.ok) return {} as Record<string, string>;
      return r.json() as Promise<Record<string, string>>;
    },
    staleTime: 5 * 60 * 1000,
  });
  const bookingDisabled = settingsQ.data?.disable_booking === '1';

  const hasForms = (formsQ.data?.items.length ?? 0) > 0;
  const showGettingStarted = !profileComplete || hasForms;

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-sm">
        <div className="frame-container">
          <h2 className="frame-title">Welcome {firstName}!</h2>

          <div className="mt-6 flex flex-col gap-4">
            {/* Book Session */}
            {bookingDisabled ? (
              <div
                className="booking-card flex flex-col items-start border-dashed border-slate-300 bg-slate-50/80 p-6 opacity-90"
                aria-label="Online booking is unavailable"
              >
                <div className="mb-2 text-slate-400">
                  <CalendarPlus className="h-7 w-7" aria-hidden="true" />
                </div>
                <div className="text-left">
                  <div className="mb-0.5 text-xl font-bold text-slate-600">
                    Book Session
                  </div>
                  <div className="booking-card-subtitle text-sm text-slate-500">
                    Online booking is turned off. Contact us to schedule.
                  </div>
                </div>
              </div>
            ) : (
              <Link
                to="/book"
                className="booking-card flex flex-col items-start p-6"
                aria-label="Book a new session"
              >
                <div className="mb-2 text-slate-400">
                  <CalendarPlus className="h-7 w-7" aria-hidden="true" />
                </div>
                <div className="text-left">
                  <div className="mb-0.5 text-xl font-bold">Book Session</div>
                  <div className="booking-card-subtitle text-sm">
                    Schedule a new appointment
                  </div>
                </div>
              </Link>
            )}

            {/* My Bookings */}
            <Link
              to="/customer/bookings"
              className="booking-card flex flex-col items-start p-6"
              aria-label="View and manage your bookings"
            >
              <div className="mb-2 text-slate-400">
                <List className="h-7 w-7" aria-hidden="true" />
              </div>
              <div className="text-left">
                <div className="mb-0.5 text-xl font-bold">My Bookings</div>
                <div className="booking-card-subtitle text-sm">
                  View and manage your sessions
                </div>
              </div>
            </Link>

            {/* Getting Started checklist */}
            {showGettingStarted && (
              <div
                className="booking-card flex flex-col items-start p-6"
                aria-label="Getting started checklist"
              >
                <div className="w-full text-left">
                  <div className="mb-3 text-xl font-bold">Getting Started</div>
                  <ul className="flex flex-col gap-2" aria-label="Onboarding checklist">
                    {/* Profile completion item */}
                    <li className="flex items-center gap-2">
                      {profileComplete ? (
                        <>
                          <CheckCircle
                            className="h-4 w-4 shrink-0 text-brand"
                            aria-label="Completed"
                            aria-hidden="true"
                          />
                          <span className="text-sm text-slate-400 line-through">
                            Complete Profile
                          </span>
                        </>
                      ) : (
                        <>
                          <Circle
                            className="h-4 w-4 shrink-0 text-slate-300"
                            aria-label="Incomplete"
                            aria-hidden="true"
                          />
                          <Link
                            to="/customer/account"
                            className="text-sm text-slate-700 hover:underline"
                          >
                            Complete Profile
                          </Link>
                        </>
                      )}
                    </li>

                    {/* Form items */}
                    {formsQ.isSuccess &&
                      formsQ.data.items.map((form) => (
                        <li key={form.id} className="flex items-center gap-2">
                          <Circle
                            className="h-4 w-4 shrink-0 text-slate-300"
                            aria-label="Incomplete"
                            aria-hidden="true"
                          />
                          <Link
                            to={`/customer/forms/${form.id}`}
                            className="text-sm text-slate-700 hover:underline"
                          >
                            {form.name}
                          </Link>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        <div id="frame-footer" className="mt-6 text-center">
          <div className="flex justify-center gap-4 text-sm text-slate-500" />
        </div>
      </div>
    </div>
  );
}
