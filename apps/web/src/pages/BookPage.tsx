import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { BookWizard } from '../components/BookWizard';
import { BookingDisabledScreen } from '../components/BookingDisabledScreen';
import { PublicHomeLink } from '../components/PublicHomeLink';

async function fetchPublicSettings(): Promise<Record<string, string>> {
  const res = await fetch('/api/settings/public');
  if (!res.ok) return {};
  return res.json() as Promise<Record<string, string>>;
}

export function BookPage() {
  const { user, logout } = useAuth();
  const { data: settings = {} } = useQuery({
    queryKey: ['settings', 'public'],
    queryFn: fetchPublicSettings,
    staleTime: 5 * 60 * 1000,
  });

  if (settings.disable_booking === '1') {
    return (
      <div id="book-appointment-wizard" className="w-full">
        <BookingDisabledScreen message={settings.disable_booking_message} />
      </div>
    );
  }

  const portalOff = settings.customer_login_enabled !== '1';
  const guestBookingAllowed = settings.allow_guest_booking !== '0';

  if (!guestBookingAllowed && user?.kind !== 'customer') {
    return (
      <div className="flex justify-center px-4">
        <div className="mt-6 w-full max-w-sm">
          <div className="wizard-frame">
            <div className="frame-container">
              <h1 className="frame-title">Sign in to book</h1>
              <div className="frame-content space-y-4 text-center">
                {portalOff ? (
                  <p className="text-sm text-slate-600">
                    Booking without an account is turned off, but the customer portal is also
                    disabled. Please contact the business to schedule.
                  </p>
                ) : (
                  <p className="text-sm text-slate-600">
                    This site requires you to sign in before you can book an appointment.
                  </p>
                )}
                {!portalOff && (
                  <Link to="/customer/login" className="booking-button block" state={{ from: '/book' }}>
                    Sign in
                  </Link>
                )}
                <PublicHomeLink className="booking-link block text-sm">
                  Back to home
                </PublicHomeLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (user?.kind === 'customer' && portalOff) {
    return (
      <div className="flex justify-center px-4">
        <div className="mt-6 w-full max-w-sm">
          <div className="wizard-frame">
            <div className="frame-container">
              <h1 className="frame-title">Account booking unavailable</h1>
              <div className="frame-content space-y-4 text-center">
                <p className="text-sm text-slate-600">
                  The customer portal is disabled, so booking while signed in is not available.
                  Sign out to use public booking as a guest, or return home.
                </p>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="booking-button block w-full"
                >
                  Sign out
                </button>
                <PublicHomeLink className="booking-link block text-sm">
                  Back to home
                </PublicHomeLink>
              </div>
            </div>
          </div>
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
