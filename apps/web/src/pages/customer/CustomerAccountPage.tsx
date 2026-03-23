import { Link } from 'react-router-dom';

export function CustomerAccountPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold text-zinc-50">My account</h1>
      <p className="text-zinc-400">
        Logged-in customers will manage profile, email, password, and see <strong>My bookings</strong> here (parity
        with <code className="text-zinc-500">customer/account</code> in PHP).
      </p>
      <div className="rounded-lg border border-amber-900/50 bg-amber-950/30 px-4 py-3 text-sm text-amber-200/90">
        You are not signed in — session tokens are not implemented yet.{' '}
        <Link to="/customer/login" className="font-medium text-amber-400 underline underline-offset-2">
          Go to customer sign in
        </Link>
      </div>
      <div className="rounded-lg border border-dashed border-zinc-700 bg-zinc-900/50 p-8 text-center text-sm text-zinc-500">
        Booking list, profile form, and Stripe customer portal will connect to the Nest API once customer auth is
        ported.
      </div>
    </div>
  );
}
