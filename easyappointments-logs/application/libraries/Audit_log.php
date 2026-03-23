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

/**
 * Audit logging helper (PHI-safe).
 */
class Audit_log
{
    private string $log_path;
    private int $retention_days;

    public function __construct()
    {
        $this->log_path = config('audit_log_path', __DIR__ . '/../../storage/logs/audit/');
        $this->retention_days = (int) config('audit_log_retention_days', 365);

        if (!is_dir($this->log_path) && !mkdir($this->log_path, 0755, true) && !is_dir($this->log_path)) {
            throw new RuntimeException('Failed to create audit log directory.');
        }
    }

    public function write(string $event, array $context = []): void
    {
        $record = [
            'timestamp' => date('c'),
            'event' => $event,
            'actor_id' => session('user_id'),
            'actor_role' => session('role_slug'),
            'customer_id' => session('customer_id'),
            'ip' => $this->get_ip(),
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
            'request_uri' => $_SERVER['REQUEST_URI'] ?? null,
            'method' => $_SERVER['REQUEST_METHOD'] ?? null,
            'context' => $this->redact_context($context),
        ];

        $line = json_encode($record, JSON_UNESCAPED_SLASHES);

        if ($line === false) {
            return;
        }

        $filename = $this->log_path . 'audit-' . date('Y-m-d') . '.log';
        write_file($filename, $line . PHP_EOL, 'a');

        $this->prune_old_logs();
    }

    private function redact_context(array $context): array
    {
        $sensitive_keys = [
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

        foreach ($context as $key => $value) {
            if (in_array($key, $sensitive_keys, true)) {
                $context[$key] = '[REDACTED]';
            }
        }

        return $context;
    }

    private function prune_old_logs(): void
    {
        if ($this->retention_days <= 0) {
            return;
        }

        $threshold = strtotime('-' . $this->retention_days . ' days');

        foreach (glob($this->log_path . 'audit-*.log') as $file) {
            $basename = basename($file, '.log');
            $date = substr($basename, strlen('audit-'));
            $timestamp = strtotime($date);

            if ($timestamp !== false && $timestamp < $threshold) {
                @unlink($file);
            }
        }
    }

    private function get_ip(): ?string
    {
        if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $parts = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
            return trim($parts[0]);
        }

        return $_SERVER['REMOTE_ADDR'] ?? null;
    }
}
