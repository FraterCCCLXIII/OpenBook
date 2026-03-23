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

class Migration_Create_forms_tables extends EA_Migration
{
    public function up(): void
    {
        if (!$this->db->table_exists('forms')) {
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
                'name' => [
                    'type' => 'VARCHAR',
                    'constraint' => 255,
                    'null' => false,
                ],
                'content' => [
                    'type' => 'LONGTEXT',
                    'null' => true,
                ],
                'is_active' => [
                    'type' => 'TINYINT',
                    'constraint' => 1,
                    'default' => 1,
                ],
            ]);

            $this->dbforge->add_key('id', true);

            $this->dbforge->create_table('forms', true, ['engine' => 'InnoDB']);
        }

        if (!$this->db->table_exists('form_fields')) {
            $this->dbforge->add_field([
                'id' => [
                    'type' => 'INT',
                    'constraint' => 11,
                    'auto_increment' => true,
                ],
                'id_forms' => [
                    'type' => 'INT',
                    'constraint' => 11,
                    'null' => false,
                ],
                'label' => [
                    'type' => 'VARCHAR',
                    'constraint' => 255,
                    'null' => false,
                ],
                'is_required' => [
                    'type' => 'TINYINT',
                    'constraint' => 1,
                    'default' => 0,
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
            $this->dbforge->add_key('id_forms');

            $this->dbforge->create_table('form_fields', true, ['engine' => 'InnoDB']);
        }

        if (!$this->db->table_exists('form_assignments')) {
            $this->dbforge->add_field([
                'id' => [
                    'type' => 'INT',
                    'constraint' => 11,
                    'auto_increment' => true,
                ],
                'id_forms' => [
                    'type' => 'INT',
                    'constraint' => 11,
                    'null' => false,
                ],
                'role_slug' => [
                    'type' => 'VARCHAR',
                    'constraint' => 64,
                    'null' => false,
                ],
            ]);

            $this->dbforge->add_key('id', true);
            $this->dbforge->add_key('id_forms');
            $this->dbforge->add_key('role_slug');

            $this->dbforge->create_table('form_assignments', true, ['engine' => 'InnoDB']);
        }

        if (!$this->db->table_exists('form_submissions')) {
            $this->dbforge->add_field([
                'id' => [
                    'type' => 'INT',
                    'constraint' => 11,
                    'auto_increment' => true,
                ],
                'id_forms' => [
                    'type' => 'INT',
                    'constraint' => 11,
                    'null' => false,
                ],
                'id_users' => [
                    'type' => 'INT',
                    'constraint' => 11,
                    'null' => false,
                ],
                'submitted_at' => [
                    'type' => 'DATETIME',
                    'null' => false,
                ],
            ]);

            $this->dbforge->add_key('id', true);
            $this->dbforge->add_key('id_forms');
            $this->dbforge->add_key('id_users');

            $this->dbforge->create_table('form_submissions', true, ['engine' => 'InnoDB']);
        }

        if (!$this->db->table_exists('form_submission_fields')) {
            $this->dbforge->add_field([
                'id' => [
                    'type' => 'INT',
                    'constraint' => 11,
                    'auto_increment' => true,
                ],
                'id_form_submissions' => [
                    'type' => 'INT',
                    'constraint' => 11,
                    'null' => false,
                ],
                'id_form_fields' => [
                    'type' => 'INT',
                    'constraint' => 11,
                    'null' => false,
                ],
                'value' => [
                    'type' => 'TEXT',
                    'null' => true,
                ],
            ]);

            $this->dbforge->add_key('id', true);
            $this->dbforge->add_key('id_form_submissions');
            $this->dbforge->add_key('id_form_fields');

            $this->dbforge->create_table('form_submission_fields', true, ['engine' => 'InnoDB']);
        }
    }

    public function down(): void
    {
        if ($this->db->table_exists('form_submission_fields')) {
            $this->dbforge->drop_table('form_submission_fields');
        }

        if ($this->db->table_exists('form_submissions')) {
            $this->dbforge->drop_table('form_submissions');
        }

        if ($this->db->table_exists('form_assignments')) {
            $this->dbforge->drop_table('form_assignments');
        }

        if ($this->db->table_exists('form_fields')) {
            $this->dbforge->drop_table('form_fields');
        }

        if ($this->db->table_exists('forms')) {
            $this->dbforge->drop_table('forms');
        }
    }
}
