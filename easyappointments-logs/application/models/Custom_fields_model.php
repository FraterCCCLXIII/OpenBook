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
 * Custom fields model.
 *
 * Handles dynamic customer custom fields.
 *
 * @package Models
 */
class Custom_fields_model extends EA_Model
{
    private const FIELD_TYPES = ['input', 'dropdown', 'radio', 'checkboxes', 'date'];
    private const FIELD_TYPES_WITH_OPTIONS = ['dropdown', 'radio', 'checkboxes'];

    protected array $casts = [
        'id' => 'integer',
        'is_required' => 'boolean',
        'is_displayed' => 'boolean',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function find_all(bool $active_only = true): array
    {
        $query = $this->db->order_by('sort_order')->get('custom_fields');
        $fields = $query->result_array();

        if ($active_only) {
            $fields = array_values(array_filter($fields, function ($field) {
                return (int) ($field['is_active'] ?? 0) === 1;
            }));
        }

        foreach ($fields as &$field) {
            $this->cast($field);
            $field['field_type'] = $this->normalize_field_type($field['field_type'] ?? null);
            $field['options'] = $this->decode_options($field['options'] ?? null, $field['field_type']);
        }

        return $fields;
    }

    public function find_displayed(): array
    {
        $fields = $this->find_all(true);
        $fields = array_values(array_filter($fields, function ($field) {
            return (int) ($field['is_displayed'] ?? 0) === 1;
        }));

        return $fields;
    }

    public function sync_fields(array $fields): void
    {
        $existing = $this->db->get_where('custom_fields', [])->result_array();
        $existing_by_id = [];

        foreach ($existing as $field) {
            $existing_by_id[$field['id']] = $field;
        }

        $incoming_ids = [];

        foreach ($fields as $field) {
            $field_type = $this->normalize_field_type($field['field_type'] ?? null);
            $options = $this->normalize_options($field['options'] ?? null);
            $data = [
                'label' => $field['label'] ?? '',
                'is_required' => (int) ($field['is_required'] ?? 0),
                'is_displayed' => (int) ($field['is_displayed'] ?? 0),
                'is_active' => 1,
                'sort_order' => (int) ($field['sort_order'] ?? 0),
                'field_type' => $field_type,
                'options' => $this->field_type_requires_options($field_type)
                    ? json_encode($options, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
                    : null,
                'update_datetime' => date('Y-m-d H:i:s'),
            ];

            if (!empty($field['id'])) {
                $incoming_ids[] = (int) $field['id'];
                $this->db->update('custom_fields', $data, ['id' => (int) $field['id']]);
            } else {
                $data['create_datetime'] = date('Y-m-d H:i:s');
                $this->db->insert('custom_fields', $data);
                $incoming_ids[] = (int) $this->db->insert_id();
            }
        }

        foreach ($existing_by_id as $existing_id => $existing_field) {
            if (!in_array((int) $existing_id, $incoming_ids, true)) {
                $this->db->update('custom_fields', ['is_active' => 0], ['id' => (int) $existing_id]);
            }
        }
    }

    private function normalize_field_type(?string $field_type): string
    {
        $normalized = strtolower(trim((string) ($field_type ?? '')));

        return in_array($normalized, self::FIELD_TYPES, true) ? $normalized : 'input';
    }

    private function field_type_requires_options(string $field_type): bool
    {
        return in_array($field_type, self::FIELD_TYPES_WITH_OPTIONS, true);
    }

    private function normalize_options($options): array
    {
        if (is_string($options)) {
            $decoded = json_decode($options, true);
            if (is_array($decoded)) {
                $options = $decoded;
            } else {
                $options = preg_split('/\r\n|\r|\n/', $options);
            }
        }

        if (!is_array($options)) {
            return [];
        }

        $normalized = array_map(
            fn ($option) => trim((string) $option),
            $options
        );

        return array_values(array_filter($normalized, fn ($option) => $option !== ''));
    }

    private function decode_options($options, string $field_type): array
    {
        if (!$this->field_type_requires_options($field_type)) {
            return [];
        }

        if (is_array($options)) {
            return $this->normalize_options($options);
        }

        if (!is_string($options) || $options === '') {
            return [];
        }

        $decoded = json_decode($options, true);
        if (is_array($decoded)) {
            return $this->normalize_options($decoded);
        }

        return $this->normalize_options($options);
    }
}
