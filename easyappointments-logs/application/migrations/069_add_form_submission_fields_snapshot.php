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

class Migration_Add_form_submission_fields_snapshot extends EA_Migration
{
    public function up(): void
    {
        if ($this->db->field_exists('fields_snapshot', 'form_submissions')) {
            return;
        }

        $this->dbforge->add_column('form_submissions', [
            'fields_snapshot' => [
                'type' => 'LONGTEXT',
                'null' => true,
            ],
        ]);
    }

    public function down(): void
    {
        if ($this->db->field_exists('fields_snapshot', 'form_submissions')) {
            $this->dbforge->drop_column('form_submissions', 'fields_snapshot');
        }
    }
}
