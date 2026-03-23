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

class Migration_Create_customer_auth_table extends EA_Migration
{
    /**
     * Upgrade method.
     */
    public function up(): void
    {
        if (!$this->db->table_exists('customer_auth')) {
            $this->dbforge->add_field([
                'id' => [
                    'type' => 'INT',
                    'constraint' => 11,
                    'auto_increment' => true,
                ],
                'customer_id' => [
                    'type' => 'BIGINT',
                    'constraint' => 20,
                ],
                'email' => [
                    'type' => 'VARCHAR',
                    'constraint' => '512',
                ],
                'password_hash' => [
                    'type' => 'VARCHAR',
                    'constraint' => '255',
                ],
                'status' => [
                    'type' => 'VARCHAR',
                    'constraint' => '32',
                    'default' => 'active',
                ],
                'email_verified' => [
                    'type' => 'TINYINT',
                    'constraint' => 1,
                    'default' => 0,
                ],
                'email_verified_at' => [
                    'type' => 'DATETIME',
                    'null' => true,
                ],
                'failed_attempts' => [
                    'type' => 'INT',
                    'constraint' => 11,
                    'default' => 0,
                ],
                'locked_until' => [
                    'type' => 'DATETIME',
                    'null' => true,
                ],
                'last_login_at' => [
                    'type' => 'DATETIME',
                    'null' => true,
                ],
                'password_updated_at' => [
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
            $this->dbforge->add_key('customer_id');
            $this->dbforge->add_key('email');

            $this->dbforge->create_table('customer_auth', true, ['engine' => 'InnoDB']);

            $this->db->query('CREATE UNIQUE INDEX customer_auth_email_unique ON customer_auth (email)');
            $this->db->query('CREATE UNIQUE INDEX customer_auth_customer_id_unique ON customer_auth (customer_id)');
        }
    }

    /**
     * Downgrade method.
     */
    public function down(): void
    {
        if ($this->db->table_exists('customer_auth')) {
            $this->dbforge->drop_table('customer_auth');
        }
    }
}
