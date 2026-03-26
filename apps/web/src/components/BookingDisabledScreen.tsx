import { PublicHomeLink } from './PublicHomeLink';

type Props = {
  message?: string;
  /** When false, omits the home link (e.g. nested in another layout). */
  showHomeLink?: boolean;
};

/** Shown when admin has disabled public booking (matches wizard frame styling). */
export function BookingDisabledScreen({ message, showHomeLink = true }: Props) {
  const text =
    message?.trim() ||
    'Online booking is temporarily unavailable. Please contact us for assistance.';
  return (
    <div className="flex justify-center px-4">
      <div className="mt-6 w-full max-w-sm">
        <div className="wizard-frame">
          <div className="frame-container">
            <h1 className="frame-title">Booking unavailable</h1>
            <div className="frame-content mt-6 space-y-6 text-center">
              <p className="text-sm leading-relaxed text-slate-600">{text}</p>
              {showHomeLink && (
                <PublicHomeLink className="booking-button inline-block">
                  Back to home
                </PublicHomeLink>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
