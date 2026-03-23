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
 * Account controller.
 *
 * Handles current account related operations.
 *
 * @package Controllers
 */
class Account extends EA_Controller
{
    public array $allowed_user_fields = [
        'id',
        'first_name',
        'last_name',
        'email',
        'mobile_number',
        'phone_number',
        'address',
        'city',
        'state',
        'zip_code',
        'notes',
        'timezone',
        'language',
        'settings',
    ];

    public array $optional_user_fields = [
        //
    ];

    public array $allowed_user_setting_fields = ['username', 'password', 'notifications', 'calendar_view'];

    public array $optional_user_setting_fields = [
        //
    ];

    /**
     * Account constructor.
     */
    public function __construct()
    {
        parent::__construct();

        $this->load->model('appointments_model');
        $this->load->model('customers_model');
        $this->load->model('form_assignments_model');
        $this->load->model('forms_model');
        $this->load->model('services_model');
        $this->load->model('providers_model');
        $this->load->model('provider_service_area_zips_model');
        $this->load->model('roles_model');
        $this->load->model('settings_model');
        $this->load->model('service_area_zips_model');

        $this->load->library('accounts');
        $this->load->library('google_sync');
        $this->load->library('notifications');
        $this->load->library('synchronization');
        $this->load->library('timezones');
    }

    /**
     * Render the settings page.
     */
    public function index(): void
    {
        session(['dest_url' => site_url('account')]);

        $user_id = session('user_id');

        if (cannot('view', PRIV_USER_SETTINGS)) {
            if ($user_id) {
                abort(403, 'Forbidden');
            }

            redirect('login');

            return;
        }

        $account = $this->users_model->find($user_id);
        $show_forms_nav = $this->has_assigned_forms();
        $role_slug = session('role_slug');
        $show_service_area_nav = $role_slug === DB_SLUG_PROVIDER;
        $show_availability_nav = $role_slug === DB_SLUG_PROVIDER;

        script_vars([
            'account' => $account,
        ]);

        html_vars([
            'page_title' => lang('settings'),
            'active_menu' => PRIV_SYSTEM_SETTINGS,
            'user_display_name' => $this->accounts->get_user_display_name($user_id),
            'role_slug' => $role_slug,
            'grouped_timezones' => $this->timezones->to_grouped_array(),
            'show_forms_nav' => $show_forms_nav,
            'show_service_area_nav' => $show_service_area_nav,
            'show_availability_nav' => $show_availability_nav,
        ]);

        $this->load->view('pages/account');
    }

    public function forms(): void
    {
        session(['dest_url' => site_url('account/forms')]);

        $user_id = session('user_id');

        if (cannot('view', PRIV_USER_SETTINGS)) {
            if ($user_id) {
                abort(403, 'Forbidden');
            }

            redirect('login');

            return;
        }

        $show_forms_nav = $this->has_assigned_forms();
        $role_slug = session('role_slug');
        $show_service_area_nav = $role_slug === DB_SLUG_PROVIDER;
        $show_availability_nav = $role_slug === DB_SLUG_PROVIDER;

        html_vars([
            'page_title' => lang('forms'),
            'active_menu' => PRIV_SYSTEM_SETTINGS,
            'user_display_name' => $this->accounts->get_user_display_name($user_id),
            'role_slug' => $role_slug,
            'show_forms_nav' => $show_forms_nav,
            'show_service_area_nav' => $show_service_area_nav,
            'show_availability_nav' => $show_availability_nav,
        ]);

        $this->load->view('pages/account_forms');
    }

    public function form(int $form_id): void
    {
        session(['dest_url' => site_url('account/forms/' . $form_id)]);

        $user_id = session('user_id');

        if (cannot('view', PRIV_USER_SETTINGS)) {
            if ($user_id) {
                abort(403, 'Forbidden');
            }

            redirect('login');

            return;
        }

        $show_forms_nav = $this->has_assigned_forms();
        $role_slug = session('role_slug');
        $show_service_area_nav = $role_slug === DB_SLUG_PROVIDER;
        $show_availability_nav = $role_slug === DB_SLUG_PROVIDER;

        script_vars([
            'form_id' => $form_id,
        ]);

        html_vars([
            'page_title' => lang('settings'),
            'active_menu' => PRIV_SYSTEM_SETTINGS,
            'user_display_name' => $this->accounts->get_user_display_name($user_id),
            'role_slug' => $role_slug,
            'show_forms_nav' => $show_forms_nav,
            'show_service_area_nav' => $show_service_area_nav,
            'show_availability_nav' => $show_availability_nav,
        ]);

        $this->load->view('pages/account_form_view');
    }

    public function service_areas(): void
    {
        session(['dest_url' => site_url('account/service_areas')]);

        $user_id = session('user_id');

        if (cannot('view', PRIV_USER_SETTINGS)) {
            if ($user_id) {
                abort(403, 'Forbidden');
            }

            redirect('login');

            return;
        }

        if (session('role_slug') !== DB_SLUG_PROVIDER) {
            abort(403, 'Forbidden');
        }

        $show_forms_nav = $this->has_assigned_forms();
        $show_service_area_nav = true;
        $show_availability_nav = true;

        script_vars([
            'service_area_zips' => $this->service_area_zips_model->get_with_labels(),
            'service_area_zip_ids' => $this->provider_service_area_zips_model
                ->get_zip_ids_for_provider((int) $user_id),
        ]);

        html_vars([
            'page_title' => lang('service_area_preferences'),
            'active_menu' => PRIV_SYSTEM_SETTINGS,
            'user_display_name' => $this->accounts->get_user_display_name($user_id),
            'role_slug' => session('role_slug'),
            'show_forms_nav' => $show_forms_nav,
            'show_service_area_nav' => $show_service_area_nav,
            'show_availability_nav' => $show_availability_nav,
        ]);

        $this->load->view('pages/account_service_areas');
    }

    public function save_service_areas(): void
    {
        try {
            if (cannot('edit', PRIV_USER_SETTINGS)) {
                throw new RuntimeException('You do not have the required permissions for this task.');
            }

            if (session('role_slug') !== DB_SLUG_PROVIDER) {
                abort(403, 'Forbidden');
            }

            $user_id = (int) session('user_id');
            $zip_ids = request('service_area_zip_ids', []);

            if (!is_array($zip_ids)) {
                $zip_ids = [];
            }

            $this->provider_service_area_zips_model->sync_for_provider($user_id, $zip_ids);

            response();
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    public function availability(): void
    {
        session(['dest_url' => site_url('account/availability')]);

        $user_id = session('user_id');

        if (cannot('view', PRIV_USER_SETTINGS)) {
            if ($user_id) {
                abort(403, 'Forbidden');
            }

            redirect('login');

            return;
        }

        if (session('role_slug') !== DB_SLUG_PROVIDER) {
            abort(403, 'Forbidden');
        }

        $provider = $this->providers_model->find((int) $user_id);
        $show_forms_nav = $this->has_assigned_forms();

        script_vars([
            'working_plan' => $provider['settings']['working_plan'] ?? null,
            'working_plan_exceptions' => $provider['settings']['working_plan_exceptions'] ?? null,
            'company_working_plan' => setting('company_working_plan'),
            'date_format' => setting('date_format'),
            'time_format' => setting('time_format'),
            'first_weekday' => setting('first_weekday'),
        ]);

        html_vars([
            'page_title' => lang('availability'),
            'active_menu' => PRIV_SYSTEM_SETTINGS,
            'user_display_name' => $this->accounts->get_user_display_name($user_id),
            'role_slug' => session('role_slug'),
            'show_forms_nav' => $show_forms_nav,
            'show_service_area_nav' => true,
            'show_availability_nav' => true,
        ]);

        $this->load->view('pages/account_availability');
    }

    public function save_availability(): void
    {
        try {
            if (cannot('edit', PRIV_USER_SETTINGS)) {
                throw new RuntimeException('You do not have the required permissions for this task.');
            }

            if (session('role_slug') !== DB_SLUG_PROVIDER) {
                abort(403, 'Forbidden');
            }

            $user_id = (int) session('user_id');
            $working_plan = request('working_plan', setting('company_working_plan'));
            $working_plan_exceptions = request('working_plan_exceptions', '{}');

            $this->providers_model->set_settings($user_id, [
                'working_plan' => $working_plan,
                'working_plan_exceptions' => $working_plan_exceptions,
            ]);

            response();
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    protected function has_assigned_forms(): bool
    {
        $role_slug = (string) session('role_slug');
        $assigned = $this->form_assignments_model->find_for_role($role_slug);

        if (!$assigned) {
            return false;
        }

        $form_ids = array_map(fn ($row) => $row['id_forms'], $assigned);
        $forms = $this->forms_model->find_by_ids($form_ids, true);

        return !empty($forms);
    }

    /**
     * Save general settings.
     */
    public function save(): void
    {
        try {
            if (cannot('edit', PRIV_USER_SETTINGS)) {
                throw new RuntimeException('You do not have the required permissions for this task.');
            }

            $account = request('account');

            $account['id'] = session('user_id');

            $this->users_model->only($account, $this->allowed_user_fields);

            $this->users_model->optional($account, $this->optional_user_fields);

            $this->users_model->only($account['settings'], $this->allowed_user_setting_fields);

            $this->users_model->optional($account['settings'], $this->optional_user_setting_fields);

            if (empty($account['password'])) {
                unset($account['password']);
            }

            $this->users_model->save($account);

            session([
                'user_email' => $account['email'],
                'username' => $account['settings']['username'],
                'timezone' => $account['timezone'],
                'language' => $account['language'],
            ]);

            response();
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    /**
     * Make sure the username is valid and unique in the database.
     */
    public function validate_username(): void
    {
        try {
            $username = request('username');

            $user_id = request('user_id');

            $is_valid = $this->users_model->validate_username($username, $user_id);

            json_response([
                'is_valid' => $is_valid,
            ]);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }
}
