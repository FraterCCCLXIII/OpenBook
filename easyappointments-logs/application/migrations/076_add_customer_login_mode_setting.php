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

class Migration_Add_customer_login_mode_setting extends EA_Migration
{
    public function up(): void
    {
        if (!$this->db->get_where('settings', ['name' => 'customer_login_mode'])->num_rows()) {
            $this->db->insert('settings', [
                'create_datetime' => date('Y-m-d H:i:s'),
                'update_datetime' => date('Y-m-d H:i:s'),
                'name' => 'customer_login_mode',
                'value' => 'password',
            ]);
        }
    }

    public function down(): void
    {
        if ($this->db->get_where('settings', ['name' => 'customer_login_mode'])->num_rows()) {
            $this->db->delete('settings', ['name' => 'customer_login_mode']);
        }
    }
}
