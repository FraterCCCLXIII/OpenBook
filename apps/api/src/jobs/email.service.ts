/**
 * Thin email sender used by the BullMQ worker (runs outside NestJS DI).
 * Reads SMTP config from env; default port 1025 (set SMTP_PORT for docker-compose Mailpit, e.g. 1027).
 * Templates are file-based HTML with {{VARIABLE}} placeholders.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

let _transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (_transporter) return _transporter;
  const host = process.env.SMTP_HOST ?? 'localhost';
  const port = Number(process.env.SMTP_PORT ?? 1025);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  _transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });
  return _transporter;
}

// ─── Template cache ──────────────────────────────────────────────────────────

const TEMPLATES_DIR = join(__dirname, 'templates');

let _customerTpl: string | null = null;
let _providerTpl: string | null = null;

function loadTemplate(name: string): string {
  return readFileSync(join(TEMPLATES_DIR, name), 'utf8');
}

function getCustomerTemplate(): string {
  if (!_customerTpl) _customerTpl = loadTemplate('booking-customer.html');
  return _customerTpl;
}

function getProviderTemplate(): string {
  if (!_providerTpl) _providerTpl = loadTemplate('booking-provider.html');
  return _providerTpl;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BookingEmailData {
  companyName: string;
  customerEmail: string;
  customerName: string;
  providerEmail: string | null;
  providerName: string;
  serviceName: string;
  startDatetime: string;
  appointmentId: string;
  /** When false, skips customer confirmation email (settings-driven). */
  sendCustomerEmail?: boolean;
  /** When false, skips provider notification email (settings-driven). */
  sendProviderEmail?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function renderTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(
    /\{\{([A-Z_]+)\}\}/g,
    (_, key: string) => vars[key] ?? '',
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

// ─── OTP email ───────────────────────────────────────────────────────────────

export async function sendOtpCode(
  email: string,
  code: string,
  expiryMinutes = 5,
): Promise<void> {
  const t = getTransporter();
  await t.sendMail({
    from: '"OpenBook" <noreply@openbook.local>',
    to: email,
    subject: 'Your verification code',
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <h2 style="font-size:22px;font-weight:700;color:#0f172a;margin:0 0 8px">
          Your verification code
        </h2>
        <p style="color:#64748b;margin:0 0 24px">
          Use the code below to continue. It expires in ${expiryMinutes} minutes.
        </p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;text-align:center">
          <span style="font-size:36px;font-weight:700;letter-spacing:0.2em;color:#439a82;font-family:monospace">
            ${code}
          </span>
        </div>
        <p style="color:#94a3b8;font-size:12px;margin:16px 0 0">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>`,
    text: `Your verification code is: ${code}\n\nIt expires in ${expiryMinutes} minutes.`,
  });
}

// ─── Booking confirmation email ───────────────────────────────────────────────

export async function sendBookingConfirmation(
  data: BookingEmailData,
): Promise<void> {
  const from = `"${data.companyName}" <noreply@openbook.local>`;
  const t = getTransporter();

  const vars: Record<string, string> = {
    COMPANY_NAME: data.companyName,
    CUSTOMER_NAME: data.customerName,
    PROVIDER_NAME: data.providerName,
    SERVICE_NAME: data.serviceName,
    START_DATETIME: formatDate(data.startDatetime),
    APPOINTMENT_ID: data.appointmentId,
  };

  const sendCust = data.sendCustomerEmail !== false;
  const sendProv = data.sendProviderEmail !== false;

  if (sendCust) {
    await t.sendMail({
      from,
      to: data.customerEmail,
      subject: `Booking Confirmed — ${data.serviceName} on ${formatDate(data.startDatetime)}`,
      html: renderTemplate(getCustomerTemplate(), vars),
    });
  }

  if (sendProv && data.providerEmail) {
    await t.sendMail({
      from,
      to: data.providerEmail,
      subject: `New Booking — ${data.customerName} for ${data.serviceName}`,
      html: renderTemplate(getProviderTemplate(), vars),
    });
  }
}

// ─── Form reminder email ──────────────────────────────────────────────────────

export async function sendFormReminderEmail(
  recipientEmail: string,
  recipientName: string,
  forms: { name: string; description: string | null }[],
): Promise<void> {
  const t = getTransporter();
  const from = '"OpenBook" <noreply@openbook.local>';

  const formListHtml = forms
    .map(
      (f) => `
      <li style="margin-bottom:12px;padding:12px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px">
        <div style="font-weight:600;color:#0f172a">${f.name}</div>
        ${f.description ? `<div style="margin-top:4px;font-size:13px;color:#64748b">${f.description}</div>` : ''}
      </li>`,
    )
    .join('');

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a">
      <h2 style="font-size:22px;font-weight:700;margin:0 0 8px">Action required: complete your forms</h2>
      <p style="color:#64748b;margin:0 0 24px">
        Hi ${recipientName}, you have ${forms.length} form${forms.length === 1 ? '' : 's'} that still need to be completed.
        Please log in and fill them out at your earliest convenience.
      </p>
      <ul style="list-style:none;padding:0;margin:0 0 24px">
        ${formListHtml}
      </ul>
      <p style="font-size:13px;color:#94a3b8;margin:0">
        This is an automated reminder. If you have already submitted these forms, please disregard this message.
      </p>
    </div>`;

  await t.sendMail({
    from,
    to: recipientEmail,
    subject: `Reminder: ${forms.length} form${forms.length === 1 ? '' : 's'} awaiting your completion`,
    html,
  });
}
