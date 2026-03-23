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
 * Customer OTP model.
 *
 * Handles OTP generation, throttling, and verification.
 *
 * @package Models
 */
class Customer_otp_model extends EA_Model
{
    protected int $otp_length = 6;
    protected int $otp_expiry_seconds = 300;
    protected int $max_attempts = 3;
    protected int $attempt_window_seconds = 600;
    protected int $lockout_seconds = 300;

    protected array $casts = [
        'id' => 'integer',
        'attempt_count' => 'integer',
        'send_count' => 'integer',
    ];

    /**
     * @var array
     */
    protected array $phi_fields = [
        'email',
    ];

    public function find_by_email(string $email): ?array
    {
        $normalized = $this->normalize_email($email);
        $crypto = $this->get_phi_crypto();
        $email_hash = $crypto->enabled() ? $crypto->hash_search($normalized) : null;

        $query = $this->db->from('customer_otp');

        if ($crypto->enabled() && $email_hash) {
            $query->group_start()
                ->where('email_hash', $email_hash)
                ->or_where('email', $normalized)
                ->group_end();
        } else {
            $query->where('email', $normalized);
        }

        $record = $query->get()->row_array();

        if (empty($record)) {
            return null;
        }

        $this->cast($record);
        $this->decrypt_phi_fields($record, $this->phi_fields);

        return $record;
    }

    public function save(array $record): int
    {
        if (!empty($record['id'])) {
            $existing = $this->db->get_where('customer_otp', ['id' => $record['id']])->row_array();

            if (empty($existing)) {
                throw new InvalidArgumentException('Customer OTP record was not found.');
            }

            $this->decrypt_phi_fields($existing, $this->phi_fields);
            $record = array_merge($existing, $record);
        }

        $record['email'] = $this->normalize_email($record['email'] ?? '');

        if (empty($record['email']) || !filter_var($record['email'], FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Invalid email address provided.');
        }

        if (empty($record['id'])) {
            $this->apply_phi_write($record);
            return $this->insert($record);
        }

        $this->apply_phi_write($record);
        return $this->update($record);
    }

    public function request_code(string $email): string
    {
        $now = time();
        $record = $this->find_by_email($email);

        if (!empty($record['lockout_until']) && strtotime($record['lockout_until']) > $now) {
            throw new RuntimeException('Account is temporarily locked. Please try again later.');
        }

        $record = $record ?: [
            'email' => $this->normalize_email($email),
        ];

        $record = $this->reset_send_window_if_needed($record, $now);

        if (($record['send_count'] ?? 0) >= $this->max_attempts) {
            $record['lockout_until'] = date('Y-m-d H:i:s', $now + $this->lockout_seconds);
            $record['send_count'] = $record['send_count'] ?? 0;
            $record['send_window_started_at'] = $record['send_window_started_at'] ?? date('Y-m-d H:i:s', $now);
            $this->save($record);

            throw new RuntimeException('Account is temporarily locked. Please try again later.');
        }

        $code = $this->generate_code();

        $record['code_hash'] = password_hash($code, PASSWORD_DEFAULT);
        $record['expires_at'] = date('Y-m-d H:i:s', $now + $this->otp_expiry_seconds);
        $record['send_count'] = ($record['send_count'] ?? 0) + 1;
        $record['send_window_started_at'] = $record['send_window_started_at'] ?? date('Y-m-d H:i:s', $now);
        $record['last_send_at'] = date('Y-m-d H:i:s', $now);
        $record['attempt_count'] = 0;
        $record['attempt_window_started_at'] = date('Y-m-d H:i:s', $now);

        $this->save($record);

        return $code;
    }

    public function verify_code(string $email, string $code): void
    {
        $now = time();
        $record = $this->find_by_email($email);

        if (empty($record)) {
            throw new InvalidArgumentException('Invalid verification code.');
        }

        if (!empty($record['lockout_until']) && strtotime($record['lockout_until']) > $now) {
            throw new RuntimeException('Account is temporarily locked. Please try again later.');
        }

        $record = $this->reset_attempt_window_if_needed($record, $now);

        $is_expired = empty($record['expires_at']) || strtotime($record['expires_at']) < $now;
        $is_valid = !$is_expired && !empty($record['code_hash']) && password_verify($code, $record['code_hash']);

        if (!$is_valid) {
            $record['attempt_count'] = ($record['attempt_count'] ?? 0) + 1;
            $record['last_attempt_at'] = date('Y-m-d H:i:s', $now);

            if ($record['attempt_count'] >= $this->max_attempts) {
                $record['lockout_until'] = date('Y-m-d H:i:s', $now + $this->lockout_seconds);
            }

            $this->save($record);

            throw new InvalidArgumentException('Invalid verification code.');
        }

        $record['code_hash'] = null;
        $record['expires_at'] = null;
        $record['attempt_count'] = 0;
        $record['last_attempt_at'] = date('Y-m-d H:i:s', $now);
        $record['lockout_until'] = null;

        $this->save($record);
    }

    public function get_lockout_remaining_seconds(string $email): int
    {
        $record = $this->find_by_email($email);

        if (empty($record['lockout_until'])) {
            return 0;
        }

        $remaining = strtotime($record['lockout_until']) - time();

        return max(0, $remaining);
    }

    protected function reset_attempt_window_if_needed(array $record, int $now): array
    {
        $window_start = $record['attempt_window_started_at'] ?? null;

        if (!$window_start || strtotime($window_start) < ($now - $this->attempt_window_seconds)) {
            $record['attempt_window_started_at'] = date('Y-m-d H:i:s', $now);
            $record['attempt_count'] = 0;
        }

        return $record;
    }

    protected function reset_send_window_if_needed(array $record, int $now): array
    {
        $window_start = $record['send_window_started_at'] ?? null;

        if (!$window_start || strtotime($window_start) < ($now - $this->attempt_window_seconds)) {
            $record['send_window_started_at'] = date('Y-m-d H:i:s', $now);
            $record['send_count'] = 0;
        }

        return $record;
    }

    protected function generate_code(): string
    {
        $max = (10 ** $this->otp_length) - 1;
        $code = (string) random_int(0, $max);

        return str_pad($code, $this->otp_length, '0', STR_PAD_LEFT);
    }

    protected function normalize_email(string $email): string
    {
        return strtolower(trim($email));
    }

    protected function insert(array $record): int
    {
        $timestamp = date('Y-m-d H:i:s');
        $record['create_datetime'] = $record['create_datetime'] ?? $timestamp;
        $record['update_datetime'] = $record['update_datetime'] ?? $timestamp;

        $this->db->insert('customer_otp', $record);

        return (int) $this->db->insert_id();
    }

    protected function update(array $record): int
    {
        $record_id = $record['id'];
        unset($record['id']);

        $record['update_datetime'] = date('Y-m-d H:i:s');

        $this->db->where('id', $record_id)->update('customer_otp', $record);

        return (int) $record_id;
    }

    /**
     * Apply PHI encryption + hashes before persisting data.
     *
     * @param array $record
     */
    protected function apply_phi_write(array &$record): void
    {
        $crypto = $this->get_phi_crypto();

        if (!$crypto->enabled()) {
            return;
        }

        $this->set_phi_hashes($record, [
            'email_hash' => 'email',
        ]);

        $this->encrypt_phi_fields($record, $this->phi_fields);
    }
}
