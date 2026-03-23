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

class Migration_Create_dynamic_custom_fields extends EA_Migration
{
    public function up(): void
    {
        if (!$this->db->table_exists('custom_fields')) {
            $this->dbforge->add_field([
                'id' => [
                    'type' => 'INT',
                    'constraint' => 11,
                    'auto_increment' => true,
                ],
                'create_datetime' => [
                    'type' => 'DATETIME',
                    'null' => true,
                ],
                'update_datetime' => [
                    'type' => 'DATETIME',
                    'null' => true,
                ],
                'label' => [
                    'type' => 'LONGTEXT',
                    'null' => true,
                ],
                'is_required' => [
                    'type' => 'TINYINT',
                    'constraint' => 1,
                    'default' => 0,
                ],
                'is_displayed' => [
                    'type' => 'TINYINT',
                    'constraint' => 1,
                    'default' => 1,
                ],
                'is_active' => [
                    'type' => 'TINYINT',
                    'constraint' => 1,
                    'default' => 1,
                ],
                'sort_order' => [
                    'type' => 'INT',
                    'constraint' => 11,
                    'default' => 0,
                ],
            ]);

            $this->dbforge->add_key('id', true);
            $this->dbforge->add_key('is_active');
            $this->dbforge->create_table('custom_fields', true, ['engine' => 'InnoDB']);
        }

        if (!$this->db->table_exists('customer_custom_field_values')) {
            $this->dbforge->add_field([
                'id' => [
                    'type' => 'INT',
                    'constraint' => 11,
                    'auto_increment' => true,
                ],
                'id_custom_fields' => [
                    'type' => 'INT',
                    'constraint' => 11,
                    'null' => false,
                ],
                'id_users' => [
                    'type' => 'INT',
                    'constraint' => 11,
                    'null' => false,
                ],
                'value' => [
                    'type' => 'LONGTEXT',
                    'null' => true,
                ],
                'update_datetime' => [
                    'type' => 'DATETIME',
                    'null' => true,
                ],
            ]);

            $this->dbforge->add_key('id', true);
            $this->dbforge->add_key('id_custom_fields');
            $this->dbforge->add_key('id_users');
            $this->dbforge->create_table('customer_custom_field_values', true, ['engine' => 'InnoDB']);
        }
    }

    public function down(): void
    {
        if ($this->db->table_exists('customer_custom_field_values')) {
            $this->dbforge->drop_table('customer_custom_field_values');
        }

        if ($this->db->table_exists('custom_fields')) {
            $this->dbforge->drop_table('custom_fields');
        }
    }
}
