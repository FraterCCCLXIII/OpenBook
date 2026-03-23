/**
 * Thin email sender used by the BullMQ worker (runs outside NestJS DI).
 * Reads SMTP config from env; falls back to Mailpit on localhost:1025.
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

  await t.sendMail({
    from,
    to: data.customerEmail,
    subject: `Booking Confirmed — ${data.serviceName} on ${formatDate(data.startDatetime)}`,
    html: renderTemplate(getCustomerTemplate(), vars),
  });

  if (data.providerEmail) {
    await t.sendMail({
      from,
      to: data.providerEmail,
      subject: `New Booking — ${data.customerName} for ${data.serviceName}`,
      html: renderTemplate(getProviderTemplate(), vars),
    });
  }
}
