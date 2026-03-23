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

class Migration_Add_appointment_change_notification_settings extends EA_Migration
{
    /**
     * Upgrade method.
     *
     * @throws Exception
     */
    public function up(): void
    {
        $settings = [
            'appointment_change_notify_customer' => '1',
            'appointment_change_notify_provider' => '1',
            'appointment_change_notify_admin' => '0',
            'appointment_change_notify_staff' => '0',
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
            'appointment_change_notify_customer',
            'appointment_change_notify_provider',
            'appointment_change_notify_admin',
            'appointment_change_notify_staff',
        ];

        foreach ($names as $name) {
            if ($this->db->get_where('settings', ['name' => $name])->num_rows()) {
                $this->db->delete('settings', ['name' => $name]);
            }
        }
    }
}
