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

class Migration_Create_customer_otp_table extends EA_Migration
{
    public function up(): void
    {
        if (!$this->db->table_exists('customer_otp')) {
            $this->dbforge->add_field([
                'id' => [
                    'type' => 'INT',
                    'constraint' => 11,
                    'auto_increment' => true,
                ],
                'email' => [
                    'type' => 'VARCHAR',
                    'constraint' => '512',
                ],
                'code_hash' => [
                    'type' => 'VARCHAR',
                    'constraint' => '255',
                    'null' => true,
                ],
                'expires_at' => [
                    'type' => 'DATETIME',
                    'null' => true,
                ],
                'attempt_count' => [
                    'type' => 'INT',
                    'constraint' => 11,
                    'default' => 0,
                ],
                'attempt_window_started_at' => [
                    'type' => 'DATETIME',
                    'null' => true,
                ],
                'send_count' => [
                    'type' => 'INT',
                    'constraint' => 11,
                    'default' => 0,
                ],
                'send_window_started_at' => [
                    'type' => 'DATETIME',
                    'null' => true,
                ],
                'lockout_until' => [
                    'type' => 'DATETIME',
                    'null' => true,
                ],
                'last_attempt_at' => [
                    'type' => 'DATETIME',
                    'null' => true,
                ],
                'last_send_at' => [
                    'type' => 'DATETIME',
                    'null' => true,
                ],
                'create_datetime' => [
                    'type' => 'DATETIME',
                    'null' => true,
                ],
                'update_datetime' => [
                    'type' => 'DATETIME',
                    'null' => true,
                ],
            ]);

            $this->dbforge->add_key('id', true);
            $this->dbforge->add_key('email');

            $this->dbforge->create_table('customer_otp', true, ['engine' => 'InnoDB']);

            $this->db->query('CREATE UNIQUE INDEX customer_otp_email_unique ON customer_otp (email)');
        }
    }

    public function down(): void
    {
        if ($this->db->table_exists('customer_otp')) {
            $this->dbforge->drop_table('customer_otp');
        }
    }
}
