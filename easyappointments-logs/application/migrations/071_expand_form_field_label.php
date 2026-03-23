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

class Migration_Expand_form_field_label extends EA_Migration
{
    public function up(): void
    {
        if (!$this->db->field_exists('label', 'form_fields')) {
            return;
        }

        $this->dbforge->modify_column('form_fields', [
            'label' => [
                'type' => 'LONGTEXT',
                'null' => true,
            ],
        ]);
    }

    public function down(): void
    {
        if (!$this->db->field_exists('label', 'form_fields')) {
            return;
        }

        $this->dbforge->modify_column('form_fields', [
            'label' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
                'null' => false,
            ],
        ]);
    }
}
