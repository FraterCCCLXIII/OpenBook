# Activity Timeline Contract

## Endpoint

- `POST /logs/events`

## Request Body

Supported filters:

- `start_date` (`YYYY-MM-DD`)
- `end_date` (`YYYY-MM-DD`)
- `actor_user_id` (int)
- `customer_id` (int)
- `appointment_id` (int)
- `action` (string, partial match)
- `entity_type` (string exact match)
- `source` (`web`, `api`, `customer_portal`, `cli`)
- `limit` (1..250)
- `offset` (>= 0)

## Response Shape

```json
{
  "items": [
    {
      "id": 123,
      "occurred_at": "2026-03-22 13:45:11",
      "request_id": "ab12cd34ef56",
      "source": "web",
      "action": "appointment.updated",
      "entity_type": "appointment",
      "entity_id": "101",
      "actor_user_id": 7,
      "actor_role": "admin",
      "actor_display_name": "Jane Doe",
      "customer_id": 52,
      "appointment_id": 101,
      "ip_address": "203.0.113.10",
      "metadata_json": "{...}",
      "metadata": {}
    }
  ],
  "total": 424,
  "limit": 50,
  "offset": 0
}
```

## Ordering and Pagination

- Sort order: `occurred_at DESC`
- Paging: offset-based (`limit`, `offset`)
- Timeline widgets should request `limit=100` for detail panels by default

## Visibility Rules

- Logs section: Admin and Manager only.
- Customer profile activity tab: same authorization as Logs endpoint.
- Appointment timeline in Billing: same authorization as Logs endpoint.

## Rendering Guidance

- Primary label: `action` + `entity_type` + `entity_id`
- Secondary metadata: actor display name + timestamp
- Expandable payload: redacted metadata JSON
