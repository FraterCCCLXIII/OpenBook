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

/**
 * Form submission fields model.
 *
 * Handles all the database operations of the form submission fields resource.
 *
 * @package Models
 */
class Form_submission_fields_model extends EA_Model
{
    protected array $casts = [
        'id' => 'integer',
        'id_form_submissions' => 'integer',
        'id_form_fields' => 'integer',
    ];

    /**
     * @var array
     */
    protected array $phi_fields = [
        'value',
    ];

    public function insert_batch(int $submission_id, array $responses): void
    {
        if (!$responses) {
            return;
        }

        $batch = array_map(function ($response) use ($submission_id) {
            $row = [
                'id_form_submissions' => $submission_id,
                'id_form_fields' => $response['field_id'],
                'value' => $response['value'],
            ];

            $this->encrypt_phi_fields($row, $this->phi_fields);

            return $row;
        }, $responses);

        $this->db->insert_batch('form_submission_fields', $batch);
    }

    public function find_for_submission(int $submission_id): array
    {
        $rows = $this->db
            ->get_where('form_submission_fields', ['id_form_submissions' => $submission_id])
            ->result_array();

        foreach ($rows as &$row) {
            $this->cast($row);
            $this->decrypt_phi_fields($row, $this->phi_fields);
        }

        return $rows;
    }

    public function find_with_fields(int $submission_id): array
    {
        $rows = $this->db
            ->select('form_submission_fields.id_form_fields AS field_id, form_submission_fields.value, form_fields.label, form_fields.is_required, form_fields.is_active, form_fields.sort_order, form_fields.field_type')
            ->from('form_submission_fields')
            ->join('form_fields', 'form_fields.id = form_submission_fields.id_form_fields', 'left')
            ->where('form_submission_fields.id_form_submissions', $submission_id)
            ->order_by('form_fields.sort_order')
            ->get()
            ->result_array();

        foreach ($rows as &$row) {
            $this->decrypt_phi_fields($row, $this->phi_fields);
        }

        return $rows;
    }
}
