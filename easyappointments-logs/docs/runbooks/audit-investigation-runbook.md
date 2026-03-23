# Audit Investigation Runbook

## Use Cases

- Investigate all activity for a specific customer.
- Investigate all activity for a specific appointment.
- Investigate billing actions performed by a specific actor.

## Query Playbooks

### Customer Investigation

1. Open Admin Logs.
2. Filter by `customer_id`.
3. Optional: set date range.
4. Review event sequence and request IDs for related actions.

### Appointment Investigation

1. Open Billing appointments view or Customer appointment detail.
2. Open appointment activity timeline.
3. Correlate with Logs page using `appointment_id`.

### Billing Dispute Review

1. Filter action by `billing.` prefix.
2. Filter by appointment id.
3. Confirm status transitions and refund details.

## Escalation Path

1. Capture request IDs and timestamps.
2. Export relevant event windows.
3. Escalate to compliance/security team with redacted event bundle.

## Response Checklist

- Confirm actor identity and role.
- Confirm target entity and ownership.
- Confirm sequence and timing.
- Confirm whether sensitive fields were changed (without exposing values).
