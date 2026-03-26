import { useState } from 'react';
import { X } from 'lucide-react';
import DOMPurify from 'dompurify';

const DISMISSED_KEY = 'ob_cookie_notice_dismissed';

export function CookieBanner({ content }: { content: string }) {
  const [dismissed, setDismissed] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem(DISMISSED_KEY) === '1',
  );

  if (dismissed) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur"
    >
      <div className="mx-auto flex max-w-6xl items-start gap-4">
        <div
          className="flex-1 text-sm leading-relaxed text-slate-700 [&_a]:text-brand [&_a]:underline"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
        />
        <button
          type="button"
          onClick={() => {
            localStorage.setItem(DISMISSED_KEY, '1');
            setDismissed(true);
          }}
          className="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label="Dismiss cookie notice"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
