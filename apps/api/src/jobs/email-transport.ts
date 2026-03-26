import type { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

const MAIL_SETTING_NAMES = [
  'smtp_host',
  'smtp_port',
  'smtp_encryption',
  'smtp_username',
  'smtp_password',
  'notifications_from_email',
  'notifications_from_name',
] as const;

type MailSettingName = (typeof MAIL_SETTING_NAMES)[number];

let transportCache: { sig: string; transport: Transporter } | null = null;

function buildTransportFromRow(
  s: Record<MailSettingName, string>,
): Transporter {
  const host =
    s.smtp_host?.trim() || process.env.SMTP_HOST?.trim() || 'localhost';
  const portStr = s.smtp_port?.trim();
  const port = portStr
    ? parseInt(portStr, 10)
    : Number(process.env.SMTP_PORT ?? 1025);
  const enc = (s.smtp_encryption || 'none').toLowerCase();
  const user =
    s.smtp_username?.trim() || process.env.SMTP_USER?.trim() || undefined;
  const pass =
    s.smtp_password?.trim() || process.env.SMTP_PASS?.trim() || undefined;

  const secure = enc === 'ssl' || port === 465;
  const sig = JSON.stringify({
    host,
    port,
    enc,
    user: user ?? '',
    hasPass: Boolean(pass),
  });

  if (transportCache?.sig === sig) {
    return transportCache.transport;
  }

  const transport = nodemailer.createTransport({
    host,
    port: Number.isFinite(port) && port > 0 ? port : 1025,
    secure,
    auth: user && pass ? { user, pass } : undefined,
    ...(enc === 'tls' && !secure ? { requireTLS: true as const } : {}),
  });

  transportCache = { sig, transport };
  return transport;
}

/** RFC 5322 From header using notifications_from_* or env / fallback. */
export function resolveMailFrom(
  s: Pick<
    Record<MailSettingName, string>,
    'notifications_from_email' | 'notifications_from_name'
  >,
  fallbackName: string,
): string {
  const emailRaw =
    s.notifications_from_email?.trim() ||
    process.env.SMTP_FROM?.trim() ||
    'noreply@openbook.local';
  const name = (s.notifications_from_name?.trim() ||
    fallbackName.trim() ||
    'OpenBook') as string;
  const safeName = name.replace(/[\r\n"]/g, '').slice(0, 200);
  return `"${safeName}" <${emailRaw}>`;
}

/**
 * Load SMTP + from-address from DB (Email / SMTP), fall back to env, then Mailpit defaults.
 */
export async function getMailTransportAndFrom(
  prisma: PrismaClient,
  fallbackCompanyName: string,
): Promise<{ transport: Transporter; from: string }> {
  const rows = await prisma.setting.findMany({
    where: { name: { in: [...MAIL_SETTING_NAMES] } },
  });
  const s = {} as Record<MailSettingName, string>;
  for (const n of MAIL_SETTING_NAMES) s[n] = '';
  for (const r of rows) {
    if (r.name && MAIL_SETTING_NAMES.includes(r.name as MailSettingName)) {
      s[r.name as MailSettingName] = r.value ?? '';
    }
  }

  const transport = buildTransportFromRow(s);
  const from = resolveMailFrom(s, fallbackCompanyName);
  return { transport, from };
}
