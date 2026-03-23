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

class Migration_Create_audit_events_table extends EA_Migration
{
    public function up(): void
    {
        if ($this->db->table_exists('audit_events')) {
            return;
        }

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
            'occurred_at' => [
                'type' => 'DATETIME',
                'null' => false,
            ],
            'request_id' => [
                'type' => 'VARCHAR',
                'constraint' => 64,
                'null' => true,
            ],
            'source' => [
                'type' => 'VARCHAR',
                'constraint' => 32,
                'null' => false,
                'default' => 'web',
            ],
            'action' => [
                'type' => 'VARCHAR',
                'constraint' => 191,
                'null' => false,
            ],
            'entity_type' => [
                'type' => 'VARCHAR',
                'constraint' => 64,
                'null' => false,
            ],
            'entity_id' => [
                'type' => 'VARCHAR',
                'constraint' => 64,
                'null' => true,
            ],
            'actor_user_id' => [
                'type' => 'INT',
                'constraint' => 11,
                'null' => true,
            ],
            'actor_role' => [
                'type' => 'VARCHAR',
                'constraint' => 64,
                'null' => true,
            ],
            'customer_id' => [
                'type' => 'INT',
                'constraint' => 11,
                'null' => true,
            ],
            'appointment_id' => [
                'type' => 'INT',
                'constraint' => 11,
                'null' => true,
            ],
            'ip_address' => [
                'type' => 'VARCHAR',
                'constraint' => 64,
                'null' => true,
            ],
            'metadata_json' => [
                'type' => 'LONGTEXT',
                'null' => true,
            ],
        ]);

        $this->dbforge->add_key('id', true);
        $this->dbforge->add_key('occurred_at');
        $this->dbforge->add_key('action');
        $this->dbforge->add_key('entity_type');
        $this->dbforge->add_key('entity_id');
        $this->dbforge->add_key('actor_user_id');
        $this->dbforge->add_key('customer_id');
        $this->dbforge->add_key('appointment_id');
        $this->dbforge->add_key('request_id');
        $this->dbforge->add_key('source');

        $this->dbforge->create_table('audit_events', true, ['engine' => 'InnoDB']);
    }

    public function down(): void
    {
        if ($this->db->table_exists('audit_events')) {
            $this->dbforge->drop_table('audit_events');
        }
    }
}
