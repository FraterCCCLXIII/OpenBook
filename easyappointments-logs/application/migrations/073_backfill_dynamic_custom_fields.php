<?php defined('BASEPATH') or exit('No direct script access allowed');

/* ----------------------------------------------------------------------------
 * Easy!Appointments - Online Appointment Scheduler
 *
 * @package     Easy!Appointments
 * @author      A.Tselegidis <alextselegidis@gmail.com>
 * @copyright   Copyright (c) Alex Tselegidis
 * @license     https://opensource.org/licenses/GPL-3.0 - GPLv3
 * @link        https://easyappointments.org
 * @since       v1.5.0
 * ---------------------------------------------------------------------------- */

class Migration_Backfill_dynamic_custom_fields extends EA_Migration
{
    public function up(): void
    {
        if (!$this->db->table_exists('custom_fields') || !$this->db->table_exists('customer_custom_field_values')) {
            return;
        }

        $existing = $this->db->count_all('custom_fields');
        if ($existing > 0) {
            return;
        }

        $settings_rows = $this->db
            ->select('name, value')
            ->from('settings')
            ->where_in('name', [
                'display_custom_field_1',
                'display_custom_field_2',
                'display_custom_field_3',
                'display_custom_field_4',
                'display_custom_field_5',
                'require_custom_field_1',
                'require_custom_field_2',
                'require_custom_field_3',
                'require_custom_field_4',
                'require_custom_field_5',
                'label_custom_field_1',
                'label_custom_field_2',
                'label_custom_field_3',
                'label_custom_field_4',
                'label_custom_field_5',
            ])
            ->get()
            ->result_array();

        $settings = [];
        foreach ($settings_rows as $row) {
            $settings[$row['name']] = $row['value'];
        }

        $field_map = [];
        for ($i = 1; $i <= 5; $i++) {
            $label = $settings['label_custom_field_' . $i] ?? null;
            $display = isset($settings['display_custom_field_' . $i]) ? (int) $settings['display_custom_field_' . $i] : 0;
            $require = isset($settings['require_custom_field_' . $i]) ? (int) $settings['require_custom_field_' . $i] : 0;

            $data = [
                'label' => $label ?: 'Custom Field #' . $i,
                'is_displayed' => $display,
                'is_required' => $require,
                'is_active' => 1,
                'sort_order' => $i - 1,
                'create_datetime' => date('Y-m-d H:i:s'),
                'update_datetime' => date('Y-m-d H:i:s'),
            ];

            $this->db->insert('custom_fields', $data);
            $field_map[$i] = (int) $this->db->insert_id();
        }

        $role = $this->db->get_where('roles', ['slug' => DB_SLUG_CUSTOMER])->row_array();
        if (!$role) {
            return;
        }

        $customers = $this->db
            ->select('id, custom_field_1, custom_field_2, custom_field_3, custom_field_4, custom_field_5')
            ->from('users')
            ->where('id_roles', (int) $role['id'])
            ->get()
            ->result_array();

        foreach ($customers as $customer) {
            for ($i = 1; $i <= 5; $i++) {
                $value = $customer['custom_field_' . $i] ?? '';
                if ($value === '' || !isset($field_map[$i])) {
                    continue;
                }

                $this->db->insert('customer_custom_field_values', [
                    'id_custom_fields' => $field_map[$i],
                    'id_users' => (int) $customer['id'],
                    'value' => $value,
                    'update_datetime' => date('Y-m-d H:i:s'),
                ]);
            }
        }
    }

    public function down(): void
    {
        // No rollback for backfill.
    }
}
