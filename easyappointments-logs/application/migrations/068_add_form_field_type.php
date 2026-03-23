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

class Migration_Add_form_field_type extends EA_Migration
{
    public function up(): void
    {
        if ($this->db->field_exists('field_type', 'form_fields')) {
            return;
        }

        $this->dbforge->add_column('form_fields', [
            'field_type' => [
                'type' => 'VARCHAR',
                'constraint' => 32,
                'default' => 'input',
                'null' => false,
            ],
        ]);
    }

    public function down(): void
    {
        if ($this->db->field_exists('field_type', 'form_fields')) {
            $this->dbforge->drop_column('form_fields', 'field_type');
        }
    }
}
