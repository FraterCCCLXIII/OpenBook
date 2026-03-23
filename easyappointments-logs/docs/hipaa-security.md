## HIPAA Security Configuration

This guide describes the technical safeguards added to support HIPAA-aligned handling of PHI.

### Required Environment Variables

- `ENCRYPTION_KEY` (base64-encoded 32 bytes) - required in production.
- `PHI_ENCRYPTION_ENABLED` - set to `true` to enable PHI field encryption.
- `PHI_ALLOW_PLAINTEXT_SEARCH` - optional; keep `true` during migration.
- `SESSION_MATCH_IP` - set to `true` if your network topology supports IP binding.

### Database TLS

Enable encrypted DB connections:

- `DB_SSL_ENABLED=true`
- `DB_SSL_CA=/path/to/ca.pem`
- `DB_SSL_CERT=/path/to/client-cert.pem`
- `DB_SSL_KEY=/path/to/client-key.pem`
- `DB_SSL_VERIFY=true`

### Backups

Backups are encrypted when `BACKUP_ENCRYPTION_ENABLED=true` (defaults to PHI encryption state).

- `BACKUP_RETENTION_DAYS` controls how long backups are kept.

### Audit Logging

Audit logs are written to `storage/logs/audit/` with JSON lines.

- `AUDIT_LOG_RETENTION_DAYS` controls audit log retention.
- Audit entries avoid PHI values and record who accessed or changed data.

### File Upload Security

Uploads are stored encrypted (when PHI encryption is enabled) and validated:

- `USER_FILE_ALLOWED_EXTENSIONS` (comma-separated)
- `USER_FILE_ALLOWED_MIME_TYPES` (comma-separated)
- `USER_FILE_AV_SCAN_COMMAND="clamdscan --no-summary %s"` (optional)

### Migration Notes

The PHI migration adds hashed lookup columns and expands field sizes to store encrypted values.

Run migrations before enabling PHI encryption in production.

If you already have data stored in plaintext, enable `PHI_ALLOW_PLAINTEXT_SEARCH=true` during migration,
then re-save records (or perform a backfill) to populate the hash columns.

### Operational Checklist

- Ensure TLS termination for web traffic (HTTPS).
- Enable database TLS.
- Set `ENCRYPTION_KEY` and enable `PHI_ENCRYPTION_ENABLED`.
- Run migrations and verify encrypted writes.
- Verify audit logs and backup encryption.
- Restrict storage permissions and deny direct access to `/storage/`.

### Verification Steps

- Create/update a customer and confirm PHI fields are stored encrypted in the database.
- Download a file and verify it decrypts correctly while the stored file is encrypted.
- Confirm `storage/logs/audit/` contains audit entries for PHI access.
- Trigger a backup and verify it is encrypted and retention removes older files.
- Confirm DB connections use TLS when `DB_SSL_ENABLED=true`.
