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

class Migration_Add_email_notification_settings extends EA_Migration
{
    /**
     * Upgrade method.
     *
     * @throws Exception
     */
    public function up(): void
    {
        $settings = [
            'customer_profile_completion_notifications' => '1',
            'customer_login_otp_notifications' => '1',
            'account_recovery_notifications' => '1',
        ];

        foreach ($settings as $name => $value) {
            if (!$this->db->get_where('settings', ['name' => $name])->num_rows()) {
                $this->db->insert('settings', [
                    'name' => $name,
                    'value' => $value,
                ]);
            }
        }
    }

    /**
     * Downgrade method.
     *
     * @throws Exception
     */
    public function down(): void
    {
        $names = [
            'customer_profile_completion_notifications',
            'customer_login_otp_notifications',
            'account_recovery_notifications',
        ];

        foreach ($names as $name) {
            if ($this->db->get_where('settings', ['name' => $name])->num_rows()) {
                $this->db->delete('settings', ['name' => $name]);
            }
        }
    }
}
