<?php defined('BASEPATH') or exit('No direct script access allowed');

class Migration_Add_stripe_integration extends CI_Migration
{
    public function up()
    {
        // Add payment columns to ea_appointments
        $this->dbforge->add_column('appointments', [
            'payment_status' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
                'default' => 'not-paid',
                'null' => FALSE,
            ],
            'stripe_payment_intent_id' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
                'null' => TRUE,
            ],
            'payment_amount' => [
                'type' => 'DECIMAL',
                'constraint' => '10,2',
                'default' => 0.00,
                'null' => FALSE,
            ],
        ]);

        // Add stripe_customer_id to ea_users (for customers)
        $this->dbforge->add_column('users', [
            'stripe_customer_id' => [
                'type' => 'VARCHAR',
                'constraint' => 255,
                'null' => TRUE,
            ],
        ]);

        // Add Stripe settings
        $settings = [
            [
                'name' => 'stripe_enabled',
                'value' => '0',
            ],
            [
                'name' => 'stripe_publishable_key',
                'value' => '',
            ],
            [
                'name' => 'stripe_secret_key',
                'value' => '',
            ],
            [
                'name' => 'stripe_webhook_secret',
                'value' => '',
            ],
            [
                'name' => 'stripe_currency',
                'value' => 'USD',
            ],
        ];

        foreach ($settings as $setting) {
            $this->db->insert('settings', $setting);
        }
    }

    public function down()
    {
        $this->dbforge->drop_column('appointments', 'payment_status');
        $this->dbforge->drop_column('appointments', 'stripe_payment_intent_id');
        $this->dbforge->drop_column('appointments', 'payment_amount');
        $this->dbforge->drop_column('users', 'stripe_customer_id');

        $this->db->delete('settings', ['name' => 'stripe_enabled']);
        $this->db->delete('settings', ['name' => 'stripe_publishable_key']);
        $this->db->delete('settings', ['name' => 'stripe_secret_key']);
        $this->db->delete('settings', ['name' => 'stripe_webhook_secret']);
        $this->db->delete('settings', ['name' => 'stripe_currency']);
    }
}
