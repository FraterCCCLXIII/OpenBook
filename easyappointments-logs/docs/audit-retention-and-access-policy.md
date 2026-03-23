# Audit Retention and Access Policy

## Access Control

- Admin Logs visibility is restricted to:
  - `admin`
  - `manager`
- Access is additionally gated by `PRIV_SYSTEM_SETTINGS` view permission.

## Retention Controls

- File audit logs:
  - Config key: `audit_log_retention_days`
  - Env override: `AUDIT_LOG_RETENTION_DAYS`
- Database audit events:
  - Config key: `audit_event_retention_days`
  - Env override: `AUDIT_EVENT_RETENTION_DAYS`

Default database retention targets multi-year retention for HIPAA audit workflows.

## Redaction Requirements

- Sensitive keys are redacted before persistence.
- Sensitive field updates in metadata are represented as changed-flag markers, not raw values.

## Export and Review

- Exports should preserve timestamps, actor, action, entity linkage, request id, and source.
- Exports must not include unredacted PHI payloads.

## Operational Guardrails

- Do not delete audit data outside configured retention processes.
- Do not overwrite existing events (append-only event model).
- Maintain synchronized system clocks on application hosts.
