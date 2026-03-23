# ADR: Logs and Billing Separation

## Status

Accepted

## Context

The platform needs both:

- A global compliance and investigation surface (audit logs).
- A finance operations surface (billing workflows).

Combining these concerns in a single screen makes both workflows harder to use and harder to secure.

## Decision

Keep **Logs** and **Billing** as separate admin sections:

- `Admin > Logs`: Cross-platform audit and investigation.
- `Admin > Billing`: Financial operations with appointment and transaction views.

Bridge both via contextual drill-ins:

- Billing appointment row opens appointment activity timeline.
- Customer profile exposes customer and appointment activity timelines.

## Consequences

- Clear role-based boundaries and purpose-built workflows.
- Better compliance review usability.
- Lower risk of operational UI noise in audit investigations.
