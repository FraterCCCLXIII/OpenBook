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

class Migration_Add_down_payment_and_payment_stage extends EA_Migration
{
    public function up(): void
    {
        if (!$this->db->field_exists('down_payment_type', 'services')) {
            $this->dbforge->add_column('services', [
                'down_payment_type' => [
                    'type' => 'VARCHAR',
                    'constraint' => 16,
                    'default' => 'none',
                    'null' => false,
                    'after' => 'price',
                ],
            ]);
        }

        if (!$this->db->field_exists('down_payment_value', 'services')) {
            $this->dbforge->add_column('services', [
                'down_payment_value' => [
                    'type' => 'DECIMAL',
                    'constraint' => '10,2',
                    'default' => 0.00,
                    'null' => false,
                    'after' => 'down_payment_type',
                ],
            ]);
        }

        if (!$this->db->field_exists('total_amount', 'appointments')) {
            $this->dbforge->add_column('appointments', [
                'total_amount' => [
                    'type' => 'DECIMAL',
                    'constraint' => '10,2',
                    'default' => 0.00,
                    'null' => false,
                    'after' => 'payment_amount',
                ],
            ]);
        }

        if (!$this->db->field_exists('deposit_amount', 'appointments')) {
            $this->dbforge->add_column('appointments', [
                'deposit_amount' => [
                    'type' => 'DECIMAL',
                    'constraint' => '10,2',
                    'default' => 0.00,
                    'null' => false,
                    'after' => 'total_amount',
                ],
            ]);
        }

        if (!$this->db->field_exists('remaining_amount', 'appointments')) {
            $this->dbforge->add_column('appointments', [
                'remaining_amount' => [
                    'type' => 'DECIMAL',
                    'constraint' => '10,2',
                    'default' => 0.00,
                    'null' => false,
                    'after' => 'deposit_amount',
                ],
            ]);
        }

        if (!$this->db->field_exists('payment_stage', 'appointments')) {
            $this->dbforge->add_column('appointments', [
                'payment_stage' => [
                    'type' => 'VARCHAR',
                    'constraint' => 32,
                    'default' => 'not_paid',
                    'null' => false,
                    'after' => 'remaining_amount',
                ],
            ]);
        }

        if (!$this->db->field_exists('stripe_deposit_payment_intent_id', 'appointments')) {
            $this->dbforge->add_column('appointments', [
                'stripe_deposit_payment_intent_id' => [
                    'type' => 'VARCHAR',
                    'constraint' => 255,
                    'null' => true,
                    'after' => 'stripe_payment_intent_id',
                ],
            ]);
        }

        if (!$this->db->field_exists('stripe_final_payment_intent_id', 'appointments')) {
            $this->dbforge->add_column('appointments', [
                'stripe_final_payment_intent_id' => [
                    'type' => 'VARCHAR',
                    'constraint' => 255,
                    'null' => true,
                    'after' => 'stripe_deposit_payment_intent_id',
                ],
            ]);
        }

        if (!$this->db->field_exists('stripe_payment_method_id', 'appointments')) {
            $this->dbforge->add_column('appointments', [
                'stripe_payment_method_id' => [
                    'type' => 'VARCHAR',
                    'constraint' => 255,
                    'null' => true,
                    'after' => 'stripe_final_payment_intent_id',
                ],
            ]);
        }

        if (!$this->db->field_exists('final_charge_attempts', 'appointments')) {
            $this->dbforge->add_column('appointments', [
                'final_charge_attempts' => [
                    'type' => 'INT',
                    'constraint' => 11,
                    'default' => 0,
                    'null' => false,
                    'after' => 'stripe_payment_method_id',
                ],
            ]);
        }

        if (!$this->db->field_exists('final_charge_error_code', 'appointments')) {
            $this->dbforge->add_column('appointments', [
                'final_charge_error_code' => [
                    'type' => 'VARCHAR',
                    'constraint' => 128,
                    'null' => true,
                    'after' => 'final_charge_attempts',
                ],
            ]);
        }

        if (!$this->db->field_exists('final_charge_error_message', 'appointments')) {
            $this->dbforge->add_column('appointments', [
                'final_charge_error_message' => [
                    'type' => 'TEXT',
                    'null' => true,
                    'after' => 'final_charge_error_code',
                ],
            ]);
        }

        if (!$this->db->table_exists('appointment_payments')) {
            $this->dbforge->add_field([
                'id' => [
                    'type' => 'INT',
                    'constraint' => 11,
                    'unsigned' => true,
                    'auto_increment' => true,
                ],
                'id_appointments' => [
                    'type' => 'INT',
                    'constraint' => 11,
                    'null' => false,
                ],
                'kind' => [
                    'type' => 'VARCHAR',
                    'constraint' => 32,
                    'null' => false,
                ],
                'amount' => [
                    'type' => 'DECIMAL',
                    'constraint' => '10,2',
                    'default' => 0.00,
                    'null' => false,
                ],
                'currency' => [
                    'type' => 'VARCHAR',
                    'constraint' => 16,
                    'default' => 'USD',
                    'null' => false,
                ],
                'status' => [
                    'type' => 'VARCHAR',
                    'constraint' => 32,
                    'default' => 'pending',
                    'null' => false,
                ],
                'stripe_payment_intent_id' => [
                    'type' => 'VARCHAR',
                    'constraint' => 255,
                    'null' => true,
                ],
                'stripe_event_id' => [
                    'type' => 'VARCHAR',
                    'constraint' => 255,
                    'null' => true,
                ],
                'error_code' => [
                    'type' => 'VARCHAR',
                    'constraint' => 128,
                    'null' => true,
                ],
                'error_message' => [
                    'type' => 'TEXT',
                    'null' => true,
                ],
                'create_datetime' => [
                    'type' => 'DATETIME',
                    'null' => false,
                ],
                'update_datetime' => [
                    'type' => 'DATETIME',
                    'null' => false,
                ],
            ]);
            $this->dbforge->add_key('id', true);
            $this->dbforge->add_key('id_appointments');
            $this->dbforge->add_key('kind');
            $this->dbforge->add_key('stripe_payment_intent_id');
            $this->dbforge->add_key('stripe_event_id');
            $this->dbforge->create_table('appointment_payments');
            $payments_table = $this->db->dbprefix('appointment_payments');
            $this->db->query(
                'ALTER TABLE `' .
                    $payments_table .
                    '` ADD UNIQUE KEY `ux_appointment_payments_payment_intent` (`stripe_payment_intent_id`)',
            );
            $this->db->query(
                'ALTER TABLE `' .
                    $payments_table .
                    '` ADD UNIQUE KEY `ux_appointment_payments_event_id` (`stripe_event_id`)',
            );
        }
    }

    public function down(): void
    {
        if ($this->db->table_exists('appointment_payments')) {
            $this->dbforge->drop_table('appointment_payments', true);
        }

        foreach (
            [
                'final_charge_error_message',
                'final_charge_error_code',
                'final_charge_attempts',
                'stripe_payment_method_id',
                'stripe_final_payment_intent_id',
                'stripe_deposit_payment_intent_id',
                'payment_stage',
                'remaining_amount',
                'deposit_amount',
                'total_amount',
            ] as $column
        ) {
            if ($this->db->field_exists($column, 'appointments')) {
                $this->dbforge->drop_column('appointments', $column);
            }
        }

        foreach (['down_payment_value', 'down_payment_type'] as $column) {
            if ($this->db->field_exists($column, 'services')) {
                $this->dbforge->drop_column('services', $column);
            }
        }
    }
}
