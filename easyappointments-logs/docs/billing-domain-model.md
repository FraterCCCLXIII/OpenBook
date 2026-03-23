# Billing Domain Model

## Goal

Support operations and finance review workflows without conflating booking records and payment ledger entries.

## Hybrid UX

Billing provides two coordinated views:

- **Appointments view (operational)**  
  One row per appointment with billing controls, payment state, and activity drill-in.

- **Transactions view (ledger)**  
  One row per payment ledger event from `appointment_payments` (deposit/final captures and statuses).

## Data Sources

- Appointment state: `appointments` table (`billing_status`, `payment_status`, `payment_stage`, amount fields).
- Transaction ledger: `appointment_payments` table.
- Audit trail and timeline: `audit_events` + file audit logs.

## Status Semantics

- `billing_status`: operational workflow state for staff actions.
- `payment_status`: financial processing state from payment lifecycle.
- UI should always show both clearly and avoid treating them as interchangeable.

## Refund Handling

- Refund actions log an immutable audit entry.
- Appointment row reflects high-level post-refund state.
- Timeline records exact operation context (amount, reference, actor, request id).

## Appointment Drill-In

From the appointment row, users can view a full activity timeline including:

- Billing status updates
- Payment link generation and email actions
- Retry final charge attempts
- Refund operations
- Appointment updates and notes
