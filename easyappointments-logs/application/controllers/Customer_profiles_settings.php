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

/**
 * Customer profiles settings controller.
 *
 * Handles customer profile fields and custom fields settings.
 *
 * @package Controllers
 */
class Customer_profiles_settings extends EA_Controller
{
    public array $allowed_setting_fields = ['id', 'name', 'value'];

    public array $optional_setting_fields = [
        //
    ];

    public function __construct()
    {
        parent::__construct();

        $this->load->model('custom_fields_model');
        $this->load->model('settings_model');

        $this->load->library('accounts');
    }

    public function index(): void
    {
        session(['dest_url' => site_url('customer_profiles_settings')]);

        $user_id = session('user_id');

        if (cannot('view', PRIV_SYSTEM_SETTINGS)) {
            if ($user_id) {
                abort(403, 'Forbidden');
            }

            redirect('login');

            return;
        }

        $role_slug = session('role_slug');

        script_vars([
            'user_id' => $user_id,
            'role_slug' => $role_slug,
            'customer_profile_settings' => $this->settings_model->get_batch(),
            'custom_fields' => $this->custom_fields_model->find_all(false),
        ]);

        html_vars([
            'page_title' => lang('settings'),
            'active_menu' => PRIV_SYSTEM_SETTINGS,
            'user_display_name' => $this->accounts->get_user_display_name($user_id),
        ]);

        $this->load->view('pages/customer_profiles_settings');
    }

    public function save(): void
    {
        try {
            if (cannot('edit', PRIV_SYSTEM_SETTINGS)) {
                throw new RuntimeException('You do not have the required permissions for this task.');
            }

            $settings = request('customer_profile_settings', []);
            $custom_fields = request('custom_fields', []);

            $this->db->trans_start();

            foreach ($settings as $setting) {
                $existing_setting = $this->settings_model
                    ->query()
                    ->where('name', $setting['name'])
                    ->get()
                    ->row_array();

                if (!empty($existing_setting)) {
                    $setting['id'] = $existing_setting['id'];
                }

                $this->settings_model->only($setting, $this->allowed_setting_fields);
                $this->settings_model->optional($setting, $this->optional_setting_fields);
                $this->settings_model->save($setting);
            }

            if (is_array($custom_fields)) {
                $this->custom_fields_model->sync_fields($custom_fields);
            }

            $this->db->trans_complete();

            response();
        } catch (Throwable $e) {
            json_exception($e);
        }
    }
}
