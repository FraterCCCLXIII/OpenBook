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
 * Components controller.
 *
 * Provides a canonical UI components reference page for admins.
 *
 * @package Controllers
 */
class Components extends EA_Controller
{
    /**
     * Components constructor.
     */
    public function __construct()
    {
        parent::__construct();

        if (!can('view', PRIV_SYSTEM_SETTINGS)) {
            redirect('login');

            return;
        }
    }

    /**
     * Render the components reference page.
     */
    public function index(): void
    {
        session(['dest_url' => site_url('components')]);

        $user_id = (int) session('user_id');

        html_vars([
            'page_title' => 'Components',
            'active_menu' => 'components',
            'user_display_name' => $this->accounts->get_user_display_name($user_id),
            'role_slug' => session('role_slug'),
        ]);

        $this->load->view('pages/components');
    }
}
