<?php defined('BASEPATH') or exit('No direct script access allowed');

class Migration_Add_limit_provider_customer_access_setting extends EA_Migration
{
    public function up(): void
    {
        if (!$this->db->get_where('settings', ['name' => 'limit_provider_customer_access'])->num_rows()) {
            $this->db->insert('settings', [
                'create_datetime' => date('Y-m-d H:i:s'),
                'update_datetime' => date('Y-m-d H:i:s'),
                'name' => 'limit_provider_customer_access',
                'value' => '0',
            ]);
        }
    }

    public function down(): void
    {
        if ($this->db->get_where('settings', ['name' => 'limit_provider_customer_access'])->num_rows()) {
            $this->db->delete('settings', ['name' => 'limit_provider_customer_access']);
        }
    }
}
