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
 * Customer custom field values model.
 *
 * @package Models
 */
class Customer_custom_field_values_model extends EA_Model
{
    /**
     * @var array
     */
    protected array $phi_fields = [
        'value',
    ];

    public function find_for_user(int $user_id): array
    {
        $rows = $this->db
            ->get_where('customer_custom_field_values', ['id_users' => $user_id])
            ->result_array();

        $values = [];
        foreach ($rows as $row) {
            $this->decrypt_phi_fields($row, $this->phi_fields);
            $values[(int) $row['id_custom_fields']] = $this->decode_value($row['value'] ?? null);
        }

        return $values;
    }

    public function save_for_user(int $user_id, array $values): void
    {
        foreach ($values as $field_id => $value) {
            $field_id = (int) $field_id;
            [$value, $is_empty] = $this->normalize_value($value);

            if ($is_empty) {
                $this->db->delete('customer_custom_field_values', [
                    'id_users' => $user_id,
                    'id_custom_fields' => $field_id,
                ]);
                continue;
            }

            $existing = $this->db
                ->get_where('customer_custom_field_values', [
                    'id_users' => $user_id,
                    'id_custom_fields' => $field_id,
                ])
                ->row_array();

            $data = [
                'id_users' => $user_id,
                'id_custom_fields' => $field_id,
                'value' => $value,
                'update_datetime' => date('Y-m-d H:i:s'),
            ];

            $this->encrypt_phi_fields($data, $this->phi_fields);

            if ($existing) {
                $this->db->update(
                    'customer_custom_field_values',
                    $data,
                    ['id' => (int) $existing['id']]
                );
            } else {
                $this->db->insert('customer_custom_field_values', $data);
            }
        }
    }

    private function normalize_value($value): array
    {
        if (is_array($value)) {
            $normalized = array_values(array_filter(array_map(
                fn ($item) => trim((string) $item),
                $value
            ), fn ($item) => $item !== ''));

            if (!$normalized) {
                return ['', true];
            }

            return [
                json_encode($normalized, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                false,
            ];
        }

        $string_value = is_string($value) ? trim($value) : '';

        return [$string_value, $string_value === ''];
    }

    private function decode_value($value)
    {
        if (!is_string($value) || $value === '') {
            return $value ?? '';
        }

        $decoded = json_decode($value, true);
        if (is_array($decoded)) {
            return $decoded;
        }

        return $value;
    }
}
