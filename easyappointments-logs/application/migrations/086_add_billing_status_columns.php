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

class Migration_Add_billing_status_columns extends EA_Migration
{
    public function up(): void
    {
        if (!$this->db->field_exists('billing_status', 'appointments')) {
            $this->dbforge->add_column('appointments', [
                'billing_status' => [
                    'type' => 'VARCHAR',
                    'constraint' => 64,
                    'default' => 'unpaid',
                    'null' => false,
                    'after' => 'payment_status',
                ],
            ]);
        }

        if (!$this->db->field_exists('billing_reference', 'appointments')) {
            $this->dbforge->add_column('appointments', [
                'billing_reference' => [
                    'type' => 'VARCHAR',
                    'constraint' => 255,
                    'null' => true,
                    'after' => 'billing_status',
                ],
            ]);
        }

        if (!$this->db->field_exists('billing_notes', 'appointments')) {
            $this->dbforge->add_column('appointments', [
                'billing_notes' => [
                    'type' => 'TEXT',
                    'null' => true,
                    'after' => 'billing_reference',
                ],
            ]);
        }

        if (!$this->db->field_exists('billing_updated_at', 'appointments')) {
            $this->dbforge->add_column('appointments', [
                'billing_updated_at' => [
                    'type' => 'DATETIME',
                    'null' => true,
                    'after' => 'billing_notes',
                ],
            ]);
        }

        $this->db->set('billing_status', 'paid');
        $this->db->where('payment_status', 'paid');
        $this->db->update('appointments');

        $this->db->set('billing_status', 'payment_link_sent');
        $this->db->where('payment_status', 'pending');
        $this->db->update('appointments');

        $this->db->set('billing_status', 'unpaid');
        $this->db->where('payment_status', 'not-paid');
        $this->db->update('appointments');
    }

    public function down(): void
    {
        if ($this->db->field_exists('billing_updated_at', 'appointments')) {
            $this->dbforge->drop_column('appointments', 'billing_updated_at');
        }

        if ($this->db->field_exists('billing_notes', 'appointments')) {
            $this->dbforge->drop_column('appointments', 'billing_notes');
        }

        if ($this->db->field_exists('billing_reference', 'appointments')) {
            $this->dbforge->drop_column('appointments', 'billing_reference');
        }

        if ($this->db->field_exists('billing_status', 'appointments')) {
            $this->dbforge->drop_column('appointments', 'billing_status');
        }
    }
}
