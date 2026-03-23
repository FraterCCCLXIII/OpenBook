<?php defined('BASEPATH') or exit('No direct script access allowed');

/* ----------------------------------------------------------------------------
 * Easy!Appointments - Online Appointment Scheduler
 *
 * @package     EasyAppointments
 * @author      A.Tselegidis <alextselegidis@gmail.com>
 * @copyright   Copyright (c) Alex Tselegidis
 * @license     https://opensource.org/licenses/GPL-3.0 - GPLv3
 * @link        https://easyappointments.org
 * @since       v1.5.0
 * ---------------------------------------------------------------------------- */

class Activity_audit
{
    private CI_Controller $CI;
    private array $sensitive_keys = [
        'email',
        'phone',
        'phone_number',
        'mobile_number',
        'address',
        'city',
        'state',
        'zip',
        'zip_code',
        'notes',
        'note',
        'custom_field_1',
        'custom_field_2',
        'custom_field_3',
        'custom_field_4',
        'custom_field_5',
        'file_name',
        'file_path',
        'reason',
    ];

    private ?string $request_id = null;

    public function __construct()
    {
        $this->CI = &get_instance();
        $this->CI->load->library('audit_log');
        $this->CI->load->model('audit_events_model');
    }

    public function log(string $action, string $entity_type, $entity_id = null, array $metadata = []): void
    {
        $safe_metadata = $this->redact_metadata($metadata);
        $customer_id = $this->resolve_int($metadata, ['customer_id', 'id_users_customer']) ?? session('customer_id');
        $appointment_id = $this->resolve_int($metadata, ['appointment_id', 'id_appointments']);
        $source = $this->resolve_source();
        $request_id = $this->get_request_id();

        $this->CI->audit_log->write($action, array_merge($safe_metadata, [
            'entity_type' => $entity_type,
            'entity_id' => $entity_id,
            'request_id' => $request_id,
            'source' => $source,
        ]));

        $this->CI->audit_events_model->save([
            'occurred_at' => date('Y-m-d H:i:s'),
            'request_id' => $request_id,
            'source' => $source,
            'action' => $action,
            'entity_type' => $entity_type,
            'entity_id' => $entity_id === null ? null : (string) $entity_id,
            'actor_user_id' => $this->resolve_actor_user_id(),
            'actor_role' => $this->resolve_actor_role(),
            'customer_id' => $customer_id,
            'appointment_id' => $appointment_id,
            'ip_address' => $this->resolve_ip_address(),
            'metadata_json' => empty($safe_metadata) ? null : json_encode($safe_metadata, JSON_UNESCAPED_SLASHES),
        ]);

        if (random_int(1, 100) === 1) {
            $this->CI->audit_events_model->prune_older_than_days((int) config('audit_event_retention_days', 2555));
        }
    }

    public function build_field_changes(array $before, array $after, array $ignore_fields = []): array
    {
        $changes = [];
        $ignored = array_flip($ignore_fields);
        $keys = array_unique(array_merge(array_keys($before), array_keys($after)));

        foreach ($keys as $key) {
            if (isset($ignored[$key])) {
                continue;
            }

            $before_value = $before[$key] ?? null;
            $after_value = $after[$key] ?? null;

            if ($before_value === $after_value) {
                continue;
            }

            if ($this->is_sensitive_key((string) $key)) {
                $changes[$key] = [
                    'changed' => true,
                    'sensitive' => true,
                ];
                continue;
            }

            $changes[$key] = [
                'before' => $before_value,
                'after' => $after_value,
            ];
        }

        return $changes;
    }

    private function redact_metadata(array $metadata): array
    {
        foreach ($metadata as $key => $value) {
            if ($this->is_sensitive_key((string) $key)) {
                $metadata[$key] = '[REDACTED]';
                continue;
            }

            if (is_array($value)) {
                $metadata[$key] = $this->redact_metadata($value);
            }
        }

        return $metadata;
    }

    private function is_sensitive_key(string $key): bool
    {
        return in_array(strtolower($key), $this->sensitive_keys, true);
    }

    private function resolve_int(array $metadata, array $keys): ?int
    {
        foreach ($keys as $key) {
            if (!array_key_exists($key, $metadata)) {
                continue;
            }

            $value = (int) $metadata[$key];
            if ($value > 0) {
                return $value;
            }
        }

        return null;
    }

    private function resolve_actor_user_id(): ?int
    {
        $user_id = (int) session('user_id');

        return $user_id > 0 ? $user_id : null;
    }

    private function resolve_actor_role(): ?string
    {
        $role = session('role_slug');

        if (!empty($role)) {
            return (string) $role;
        }

        if (customer_logged_in()) {
            return DB_SLUG_CUSTOMER;
        }

        return null;
    }

    private function resolve_ip_address(): ?string
    {
        if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $parts = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);

            return trim($parts[0]);
        }

        return $_SERVER['REMOTE_ADDR'] ?? null;
    }

    private function resolve_source(): string
    {
        if (is_cli()) {
            return 'cli';
        }

        $uri = $_SERVER['REQUEST_URI'] ?? '';

        if (strpos($uri, '/api/') !== false) {
            return 'api';
        }

        if (customer_logged_in()) {
            return 'customer_portal';
        }

        return 'web';
    }

    private function get_request_id(): string
    {
        if ($this->request_id !== null) {
            return $this->request_id;
        }

        $incoming = $_SERVER['HTTP_X_REQUEST_ID'] ?? '';
        if (!empty($incoming)) {
            $this->request_id = substr((string) $incoming, 0, 64);

            return $this->request_id;
        }

        $this->request_id = bin2hex(random_bytes(8));

        return $this->request_id;
    }
}
