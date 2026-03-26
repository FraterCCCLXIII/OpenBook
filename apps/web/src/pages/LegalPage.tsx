import { useQuery } from '@tanstack/react-query';
import DOMPurify from 'dompurify';
import { Scale } from 'lucide-react';

type LegalType = 'terms' | 'privacy';

const META: Record<LegalType, { displayKey: string; contentKey: string; title: string }> = {
  terms: {
    displayKey: 'display_terms_and_conditions',
    contentKey: 'terms_and_conditions_content',
    title: 'Terms & Conditions',
  },
  privacy: {
    displayKey: 'display_privacy_policy',
    contentKey: 'privacy_policy_content',
    title: 'Privacy Policy',
  },
};

async function fetchLegalSettings(): Promise<Record<string, string>> {
  const res = await fetch('/api/settings/legal');
  if (!res.ok) throw new Error('Failed to load legal text');
  return res.json() as Promise<Record<string, string>>;
}

export function LegalPage({ type }: { type: LegalType }) {
  const { displayKey, contentKey, title } = META[type];

  const { data, isPending, isError } = useQuery({
    queryKey: ['settings', 'legal', 'public'],
    queryFn: fetchLegalSettings,
    staleTime: 5 * 60 * 1000,
  });

  if (isPending) {
    return <p className="py-12 text-center text-sm text-slate-400">Loading…</p>;
  }

  if (isError) {
    return (
      <p className="py-12 text-center text-sm text-red-600" role="alert">
        Failed to load content.
      </p>
    );
  }

  const isEnabled = data[displayKey] === '1';
  const content = data[contentKey]?.trim();

  if (!isEnabled || !content) {
    return (
      <div className="py-12 text-center">
        <Scale className="mx-auto mb-3 h-8 w-8 text-slate-300" aria-hidden />
        <p className="text-sm text-slate-400">This document is not currently available.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      <div
        className="prose prose-slate max-w-none text-sm leading-relaxed text-slate-700 [&_a]:text-brand [&_a]:underline"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
      />
    </div>
  );
}
