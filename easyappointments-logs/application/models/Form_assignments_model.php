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
 * Form assignments model.
 *
 * Handles all the database operations of the form assignments resource.
 *
 * @package Models
 */
class Form_assignments_model extends EA_Model
{
    protected array $casts = [
        'id' => 'integer',
        'id_forms' => 'integer',
    ];

    public function find_for_form(int $form_id): array
    {
        $assignments = $this->db->get_where('form_assignments', ['id_forms' => $form_id])->result_array();

        foreach ($assignments as &$assignment) {
            $this->cast($assignment);
        }

        return $assignments;
    }

    public function find_for_role(string $role_slug): array
    {
        return $this->db
            ->select('form_assignments.id_forms')
            ->from('form_assignments')
            ->where('role_slug', $role_slug)
            ->get()
            ->result_array();
    }

    public function sync_assignments(int $form_id, array $role_slugs): void
    {
        $this->db->delete('form_assignments', ['id_forms' => $form_id]);

        foreach ($role_slugs as $role_slug) {
            $this->db->insert('form_assignments', [
                'id_forms' => $form_id,
                'role_slug' => $role_slug,
            ]);
        }
    }

    public function is_assigned(int $form_id, string $role_slug): bool
    {
        return $this->db
                ->where([
                    'id_forms' => $form_id,
                    'role_slug' => $role_slug,
                ])
                ->from('form_assignments')
                ->count_all_results() > 0;
    }
}
