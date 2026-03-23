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

class Migration_Add_field_options_to_custom_fields_and_form_fields extends EA_Migration
{
    public function up(): void
    {
        if (!$this->db->field_exists('field_type', 'custom_fields')) {
            $this->dbforge->add_column('custom_fields', [
                'field_type' => [
                    'type' => 'VARCHAR',
                    'constraint' => 32,
                    'default' => 'input',
                    'null' => false,
                ],
            ]);
        }

        if (!$this->db->field_exists('options', 'custom_fields')) {
            $this->dbforge->add_column('custom_fields', [
                'options' => [
                    'type' => 'LONGTEXT',
                    'null' => true,
                ],
            ]);
        }

        if (!$this->db->field_exists('options', 'form_fields')) {
            $this->dbforge->add_column('form_fields', [
                'options' => [
                    'type' => 'LONGTEXT',
                    'null' => true,
                ],
            ]);
        }
    }

    public function down(): void
    {
        if ($this->db->field_exists('field_type', 'custom_fields')) {
            $this->dbforge->drop_column('custom_fields', 'field_type');
        }

        if ($this->db->field_exists('options', 'custom_fields')) {
            $this->dbforge->drop_column('custom_fields', 'options');
        }

        if ($this->db->field_exists('options', 'form_fields')) {
            $this->dbforge->drop_column('form_fields', 'options');
        }
    }
}
