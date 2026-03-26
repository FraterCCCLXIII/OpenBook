import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

async function fetchPublicSettings(): Promise<Record<string, string>> {
  const res = await fetch('/api/settings/public');
  if (!res.ok) return {};
  return res.json() as Promise<Record<string, string>>;
}

function getPublicHomeHref(settings: Record<string, string>): string {
  const external = settings.company_link?.trim();
  if (external) return external;
  return '/';
}

function isAbsoluteHttpUrl(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

type Props = {
  className?: string;
  children: React.ReactNode;
};

/** Uses General → Website URL (`company_link`) when set; otherwise in-app `/`. */
export function PublicHomeLink({ className, children }: Props) {
  const { data: settings = {} } = useQuery({
    queryKey: ['settings', 'public'],
    queryFn: fetchPublicSettings,
    staleTime: 5 * 60 * 1000,
  });
  const href = getPublicHomeHref(settings);

  if (isAbsoluteHttpUrl(href)) {
    return (
      <a href={href} className={className} rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link to={href} className={className}>
      {children}
    </Link>
  );
}
