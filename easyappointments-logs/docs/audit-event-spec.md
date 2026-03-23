# Audit Event Specification

## Purpose

This document defines the canonical audit event schema for compliance and operational investigations.

## Event Taxonomy

- `auth.*`: Login, API auth, OTP, password flows.
- `customer.*`: Profile, notes, alerts, account changes.
- `appointment.*`: Create, update, delete, note actions.
- `billing.*`: Status changes, payment links, retries, refunds.
- `booking.*`: Public booking lifecycle and Stripe webhook outcomes.
- `api.*`: API appointment lifecycle operations.

## Required Fields

Every `audit_events` row must include:

- `occurred_at`: Server timestamp (UTC-aligned deployment recommended).
- `action`: Dot-separated verb, for example `appointment.updated`.
- `entity_type`: Domain noun (`appointment`, `customer`, `customer_note`, etc.).
- `entity_id`: Primary identifier of the domain entity when available.
- `source`: `web`, `api`, `customer_portal`, or `cli`.
- `request_id`: Correlation key (from `X-Request-Id` if available, otherwise generated).
- `actor_user_id`: Staff user id where authenticated as staff.
- `actor_role`: Role slug (`admin`, `secretary`, `provider`, `customer`, `manager`).
- `customer_id`: Customer link when the operation relates to a customer.
- `appointment_id`: Appointment link when the operation relates to an appointment.
- `ip_address`: Request source IP.
- `metadata_json`: Redacted contextual payload.

## Redaction Protocol

The following keys are redacted recursively in metadata:

- `email`, `phone`, `phone_number`, `mobile_number`
- `address`, `city`, `state`, `zip`, `zip_code`
- `notes`, `note`
- `custom_field_1` through `custom_field_5`
- `file_name`, `file_path`, `reason`

For sensitive fields in change tracking, use:

- `{ "changed": true, "sensitive": true }`

instead of storing raw values.

## Change Tracking

When applicable, include `changes` in metadata:

- Non-sensitive fields: include `before` and `after`.
- Sensitive fields: include only boolean change metadata.

Ignore noisy/system columns such as `update_datetime` unless needed for incident analysis.

## Retention

- File audit retention: `AUDIT_LOG_RETENTION_DAYS`
- DB audit retention: `AUDIT_EVENT_RETENTION_DAYS`

Default policy in this project targets multi-year database retention for HIPAA audit operations.
