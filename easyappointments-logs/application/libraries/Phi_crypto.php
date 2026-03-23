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
 * PHI encryption helper.
 *
 * Uses AES-256-GCM with a base64-encoded 32-byte key.
 */
class Phi_crypto
{
    private const ENCRYPTION_PREFIX = 'enc:v1:';
    private const CIPHER = 'aes-256-gcm';
    private const KEY_BYTES = 32;
    private const IV_BYTES = 12;
    private const TAG_BYTES = 16;

    private bool $enabled = false;
    private string $key;
    private string $search_key;

    public function __construct()
    {
        $CI = &get_instance();
        $enabled = (bool) $CI->config->item('phi_encryption_enabled');
        $configured_key = $CI->config->item('encryption_key');

        if (!$enabled) {
            $this->enabled = false;
            return;
        }

        if (empty($configured_key)) {
            throw new RuntimeException('PHI encryption is enabled but ENCRYPTION_KEY is missing.');
        }

        $decoded = base64_decode($configured_key, true);

        if ($decoded === false || strlen($decoded) !== self::KEY_BYTES) {
            throw new RuntimeException('ENCRYPTION_KEY must be base64-encoded 32 bytes.');
        }

        $this->key = $decoded;
        $this->search_key = hash_hmac('sha256', 'search', $this->key, true);
        $this->enabled = true;
    }

    public function enabled(): bool
    {
        return $this->enabled;
    }

    public function encrypt_string(?string $value): ?string
    {
        if (!$this->enabled || $value === null || $value === '') {
            return $value;
        }

        if ($this->is_encrypted($value)) {
            return $value;
        }

        $iv = random_bytes(self::IV_BYTES);
        $tag = '';
        $ciphertext = openssl_encrypt($value, self::CIPHER, $this->key, OPENSSL_RAW_DATA, $iv, $tag);

        if ($ciphertext === false || strlen($tag) !== self::TAG_BYTES) {
            throw new RuntimeException('Failed to encrypt sensitive data.');
        }

        return self::ENCRYPTION_PREFIX . base64_encode($iv . $tag . $ciphertext);
    }

    public function decrypt_string(?string $value): ?string
    {
        if (!$this->enabled || $value === null || $value === '') {
            return $value;
        }

        if (!$this->is_encrypted($value)) {
            return $value;
        }

        $encoded = substr($value, strlen(self::ENCRYPTION_PREFIX));
        $decoded = base64_decode($encoded, true);

        if ($decoded === false || strlen($decoded) < (self::IV_BYTES + self::TAG_BYTES + 1)) {
            throw new RuntimeException('Encrypted payload is invalid.');
        }

        $iv = substr($decoded, 0, self::IV_BYTES);
        $tag = substr($decoded, self::IV_BYTES, self::TAG_BYTES);
        $ciphertext = substr($decoded, self::IV_BYTES + self::TAG_BYTES);

        $plaintext = openssl_decrypt($ciphertext, self::CIPHER, $this->key, OPENSSL_RAW_DATA, $iv, $tag);

        if ($plaintext === false) {
            throw new RuntimeException('Failed to decrypt sensitive data.');
        }

        return $plaintext;
    }

    public function hash_search(?string $value): ?string
    {
        if (!$this->enabled || $value === null) {
            return null;
        }

        $normalized = $this->normalize($value);

        if ($normalized === '') {
            return null;
        }

        return hash_hmac('sha256', $normalized, $this->search_key);
    }

    public function encrypt_file(string $source_path, string $dest_path): void
    {
        if (!$this->enabled) {
            if (!copy($source_path, $dest_path)) {
                throw new RuntimeException('Failed to copy uploaded file.');
            }
            return;
        }

        $contents = file_get_contents($source_path);

        if ($contents === false) {
            throw new RuntimeException('Failed to read uploaded file.');
        }

        $encrypted = $this->encrypt_string($contents);

        if ($encrypted === null || !write_file($dest_path, $encrypted)) {
            throw new RuntimeException('Failed to store encrypted file.');
        }
    }

    public function decrypt_file_to_string(string $path): string
    {
        $contents = file_get_contents($path);

        if ($contents === false) {
            throw new RuntimeException('Failed to read encrypted file.');
        }

        $decrypted = $this->decrypt_string($contents);

        if ($decrypted === null) {
            return '';
        }

        return $decrypted;
    }

    public function is_encrypted(string $value): bool
    {
        return str_starts_with($value, self::ENCRYPTION_PREFIX);
    }

    private function normalize(string $value): string
    {
        $normalized = trim($value);

        if (function_exists('mb_strtolower')) {
            $normalized = mb_strtolower($normalized);
        } else {
            $normalized = strtolower($normalized);
        }

        return $normalized;
    }
}
