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

class Migration_Backfill_form_submission_snapshots extends EA_Migration
{
    public function up(): void
    {
        if (!$this->db->field_exists('fields_snapshot', 'form_submissions')) {
            return;
        }

        $submissions = $this->db
            ->where('fields_snapshot IS NULL', null, false)
            ->get('form_submissions')
            ->result_array();

        if (!$submissions) {
            return;
        }

        foreach ($submissions as $submission) {
            $form = $this->db
                ->get_where('forms', ['id' => (int) $submission['id_forms']])
                ->row_array();

            if (!$form) {
                continue;
            }

            $fields = $this->db
                ->where('id_forms', (int) $submission['id_forms'])
                ->where('is_active', 1)
                ->order_by('sort_order')
                ->get('form_fields')
                ->result_array();

            if (!empty($form['content'])) {
                array_unshift($fields, [
                    'id' => null,
                    'label' => $form['content'],
                    'field_type' => 'text',
                    'is_required' => 0,
                    'sort_order' => -1,
                ]);
            }

            $snapshot_fields = array_map(function ($field) {
                return [
                    'id' => $field['id'] ?? null,
                    'label' => $field['label'] ?? '',
                    'field_type' => $field['field_type'] ?? 'input',
                    'is_required' => (int) ($field['is_required'] ?? 0),
                    'sort_order' => (int) ($field['sort_order'] ?? 0),
                ];
            }, $fields);

            $this->db->update(
                'form_submissions',
                [
                    'fields_snapshot' => json_encode(
                        $snapshot_fields,
                        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
                    ),
                ],
                ['id' => (int) $submission['id']]
            );
        }
    }

    public function down(): void
    {
        // No rollback for data backfill.
    }
}
