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
 * Forms settings controller.
 *
 * Handles admin forms configuration.
 *
 * @package Controllers
 */
class Forms_settings extends EA_Controller
{
    public function __construct()
    {
        parent::__construct();

        $this->load->library('accounts');
    }

    public function index(): void
    {
        session(['dest_url' => site_url('forms_settings')]);

        $user_id = session('user_id');

        if (cannot('view', PRIV_SYSTEM_SETTINGS)) {
            if ($user_id) {
                abort(403, 'Forbidden');
            }

            redirect('login');

            return;
        }

        html_vars([
            'page_title' => lang('settings'),
            'active_menu' => PRIV_SYSTEM_SETTINGS,
            'user_display_name' => $this->accounts->get_user_display_name($user_id),
        ]);

        $this->load->view('pages/forms_settings');
    }

    public function create(): void
    {
        session(['dest_url' => site_url('forms_settings/create')]);

        $user_id = session('user_id');

        if (cannot('edit', PRIV_SYSTEM_SETTINGS)) {
            if ($user_id) {
                abort(403, 'Forbidden');
            }

            redirect('login');

            return;
        }

        html_vars([
            'page_title' => lang('settings'),
            'active_menu' => PRIV_SYSTEM_SETTINGS,
            'user_display_name' => $this->accounts->get_user_display_name($user_id),
            'form_id' => null,
        ]);

        $this->load->view('pages/forms_settings_edit');
    }

    public function view(int $form_id): void
    {
        session(['dest_url' => site_url('forms_settings/view/' . $form_id)]);

        $user_id = session('user_id');

        if (cannot('view', PRIV_SYSTEM_SETTINGS)) {
            if ($user_id) {
                abort(403, 'Forbidden');
            }

            redirect('login');

            return;
        }

        html_vars([
            'page_title' => lang('settings'),
            'active_menu' => PRIV_SYSTEM_SETTINGS,
            'user_display_name' => $this->accounts->get_user_display_name($user_id),
            'form_id' => $form_id,
        ]);

        $this->load->view('pages/forms_settings_edit');
    }
}
