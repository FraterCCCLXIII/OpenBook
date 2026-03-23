<?php defined('BASEPATH') or exit('No direct script access allowed');

/* ----------------------------------------------------------------------------
 * Easy!Appointments - Online Appointment Scheduler
 *
 * @package     EasyAppointments
 * @author      A.Tselegidis <alextselegidis@gmail.com>
 * @copyright   Copyright (c) Alex Tselegidis
 * @license     https://opensource.org/licenses/GPL-3.0 - GPLv3
 * @link        https://easyappointments.org
 * @since       v1.0.0
 * ---------------------------------------------------------------------------- */

/**
 * Providers controller.
 *
 * Handles the providers related operations.
 *
 * @package Controllers
 */
class Providers extends EA_Controller
{
    public array $allowed_provider_fields = [
        'id',
        'first_name',
        'last_name',
        'email',
        'alt_number',
        'phone_number',
        'address',
        'city',
        'state',
        'zip_code',
        'notes',
        'timezone',
        'language',
        'is_private',
        'ldap_dn',
        'id_roles',
        'settings',
        'services',
    ];

    public array $optional_provider_fields = [
        'services' => [],
    ];

    public array $allowed_provider_setting_fields = [
        'username',
        'password',
        'working_plan',
        'working_plan_exceptions',
        'notifications',
        'calendar_view',
    ];

    public array $optional_provider_setting_fields = [
        'working_plan' => null,
        'working_plan_exceptions' => '{}',
    ];

    public array $allowed_service_fields = ['id', 'name'];

    /**
     * Providers constructor.
     */
    public function __construct()
    {
        parent::__construct();

        $this->load->model('appointments_model');
        $this->load->model('form_assignments_model');
        $this->load->model('forms_model');
        $this->load->model('providers_model');
        $this->load->model('provider_service_area_zips_model');
        $this->load->model('secretaries_model');
        $this->load->model('service_area_zips_model');
        $this->load->model('services_model');
        $this->load->model('roles_model');

        $this->load->library('accounts');
        $this->load->library('timezones');
        $this->load->library('webhooks_client');

        $this->optional_provider_setting_fields['working_plan'] = setting('company_working_plan');
    }

    /**
     * Render the backend providers page.
     *
     * On this page admin users will be able to manage providers, which are eventually selected by customers during the
     * booking process.
     */
    public function index(?string $slug = null): void
    {
        session(['dest_url' => site_url('providers')]);

        $user_id = session('user_id');

        if (cannot('view', PRIV_USERS)) {
            if ($user_id) {
                abort(403, 'Forbidden');
            }

            redirect('login');

            return;
        }

        $role_slug = session('role_slug');

        $services = $this->services_model->get();

        foreach ($services as &$service) {
            $this->services_model->only($service, $this->allowed_service_fields);
        }

        $selected_slug = $slug ?: request('slug');

        script_vars([
            'user_id' => $user_id,
            'role_slug' => $role_slug,
            'company_working_plan' => setting('company_working_plan'),
            'date_format' => setting('date_format'),
            'time_format' => setting('time_format'),
            'first_weekday' => setting('first_weekday'),
            'min_password_length' => MIN_PASSWORD_LENGTH,
            'timezones' => $this->timezones->to_array(),
            'services' => $services,
            'default_language' => setting('default_language'),
            'default_timezone' => setting('default_timezone'),
            'selected_record_slug' => $selected_slug,
            'service_area_zips' => $this->service_area_zips_model->get_with_labels(),
        ]);

        html_vars([
            'page_title' => lang('providers'),
            'active_menu' => PRIV_USERS,
            'user_display_name' => $this->accounts->get_user_display_name($user_id),
            'grouped_timezones' => $this->timezones->to_grouped_array(),
            'privileges' => $this->roles_model->get_permissions_by_slug($role_slug),
            'services' => $this->services_model->get(),
            'show_provider_forms_tab' => $this->has_forms_for_role(DB_SLUG_PROVIDER),
        ]);

        $this->load->view('pages/providers');
    }

    protected function has_forms_for_role(string $role_slug): bool
    {
        $assigned = $this->form_assignments_model->find_for_role($role_slug);

        if (!$assigned) {
            return false;
        }

        $form_ids = array_map(fn ($row) => $row['id_forms'], $assigned);
        $forms = $this->forms_model->find_by_ids($form_ids, true);

        return !empty($forms);
    }

    /**
     * Filter providers by the provided keyword.
     */
    public function search(): void
    {
        try {
            if (cannot('view', PRIV_USERS)) {
                abort(403, 'Forbidden');
            }

            $keyword = request('keyword', '');

            $order_by = request('order_by', 'update_datetime DESC');

            $limit = request('limit', 1000);

            $offset = (int) request('offset', '0');

            $providers = $this->providers_model->search($keyword, $limit, $offset, $order_by);

            json_response($providers);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    /**
     * Get provider bookings list.
     */
    public function bookings(): void
    {
        try {
            if (cannot('view', PRIV_APPOINTMENTS)) {
                abort(403, 'Forbidden');
            }

            $provider_id = (int) request('provider_id');

            if (!$provider_id) {
                abort(400, 'Bad Request');
            }

            $user_id = session('user_id');
            $role_slug = session('role_slug');

            if ($role_slug === DB_SLUG_PROVIDER && $provider_id !== (int) $user_id) {
                abort(403, 'Forbidden');
            }

            if ($role_slug === DB_SLUG_SECRETARY) {
                $provider_ids = $this->secretaries_model->find($user_id)['providers'];

                if (!in_array($provider_id, $provider_ids)) {
                    abort(403, 'Forbidden');
                }
            }

            $appointments = $this->appointments_model
                ->query()
                ->select(
                    'appointments.*,
                    services.name AS service_name,
                    providers.first_name AS provider_first_name,
                    providers.last_name AS provider_last_name,
                    customers.first_name AS customer_first_name,
                    customers.last_name AS customer_last_name',
                )
                ->join('services', 'services.id = appointments.id_services', 'left')
                ->join('users AS providers', 'providers.id = appointments.id_users_provider', 'left')
                ->join('users AS customers', 'customers.id = appointments.id_users_customer', 'left')
                ->where('appointments.is_unavailability', false)
                ->where('appointments.id_users_provider', $provider_id)
                ->order_by('appointments.start_datetime', 'DESC')
                ->limit(50)
                ->get()
                ->result_array();

            $response = [];

            foreach ($appointments as $appointment) {
                $provider_name = trim(
                    ($appointment['provider_first_name'] ?? '') . ' ' . ($appointment['provider_last_name'] ?? ''),
                );
                $customer_first_name = $appointment['customer_first_name'] ?? null;
                $customer_last_name = $appointment['customer_last_name'] ?? null;
                $customer_name = trim(($customer_first_name ?? '') . ' ' . ($customer_last_name ?? ''));

                $response[] = [
                    'id' => $appointment['id'],
                    'provider_id' => $appointment['id_users_provider'] ?? null,
                    'customer_id' => $appointment['id_users_customer'] ?? null,
                    'start_datetime' => $appointment['start_datetime'],
                    'status' => $appointment['status'],
                    'hash' => $appointment['hash'],
                    'service_name' => $appointment['service_name'] ?? null,
                    'provider_name' => $provider_name ?: null,
                    'customer_name' => $customer_name ?: null,
                    'customer_first_name' => $customer_first_name,
                    'customer_last_name' => $customer_last_name,
                ];
            }

            json_response($response);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    /**
     * Store a new provider.
     */
    public function store(): void
    {
        try {
            if (cannot('add', PRIV_USERS)) {
                abort(403, 'Forbidden');
            }

            $provider = request('provider');
            $service_area_zip_ids = $provider['service_area_zip_ids'] ?? [];

            $this->providers_model->only($provider, $this->allowed_provider_fields);

            $this->providers_model->only($provider['settings'], $this->allowed_provider_setting_fields);

            $this->providers_model->optional($provider, $this->optional_provider_fields);

            $this->providers_model->optional($provider['settings'], $this->optional_provider_setting_fields);

            $provider_id = $this->providers_model->save($provider);
            $this->provider_service_area_zips_model
                ->sync_for_provider((int) $provider_id, (array) $service_area_zip_ids);

            $provider = $this->providers_model->find($provider_id);

            $this->webhooks_client->trigger(WEBHOOK_PROVIDER_SAVE, $provider);

            json_response([
                'success' => true,
                'id' => $provider_id,
            ]);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    /**
     * Find a provider.
     */
    public function find(): void
    {
        try {
            if (cannot('view', PRIV_USERS)) {
                abort(403, 'Forbidden');
            }

            $provider_id = request('provider_id');

            $provider = $this->providers_model->find($provider_id);
        $provider['service_area_zip_ids'] = $this->provider_service_area_zips_model
            ->get_zip_ids_for_provider((int) $provider_id);

            json_response($provider);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    /**
     * Find a provider by slug.
     */
    public function find_by_slug(): void
    {
        try {
            if (cannot('view', PRIV_USERS)) {
                abort(403, 'Forbidden');
            }

            $slug = request('slug');

            if (empty($slug)) {
                abort(400, 'Bad Request');
            }

            $provider = $this->providers_model->find_by_slug($slug);
            $provider['service_area_zip_ids'] = $this->provider_service_area_zips_model
                ->get_zip_ids_for_provider((int) $provider['id']);

            json_response($provider);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    /**
     * Update a provider.
     */
    public function update(): void
    {
        try {
            if (cannot('edit', PRIV_USERS)) {
                abort(403, 'Forbidden');
            }

            $provider = request('provider');
            $service_area_zip_ids = $provider['service_area_zip_ids'] ?? [];

            $this->providers_model->only($provider, $this->allowed_provider_fields);

            $this->providers_model->only($provider['settings'], $this->allowed_provider_setting_fields);

            $this->providers_model->optional($provider, $this->optional_provider_fields);

            $this->providers_model->optional($provider['settings'], $this->optional_provider_setting_fields);

            $provider_id = $this->providers_model->save($provider);
            $this->provider_service_area_zips_model
                ->sync_for_provider((int) $provider_id, (array) $service_area_zip_ids);

            $provider = $this->providers_model->find($provider_id);

            $this->webhooks_client->trigger(WEBHOOK_PROVIDER_SAVE, $provider);

            json_response([
                'success' => true,
                'id' => $provider_id,
            ]);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    /**
     * Remove a provider.
     */
    public function destroy(): void
    {
        try {
            if (cannot('delete', PRIV_USERS)) {
                abort(403, 'Forbidden');
            }

            $provider_id = request('provider_id');

            $provider = $this->providers_model->find($provider_id);

            $this->providers_model->delete($provider_id);

            $this->webhooks_client->trigger(WEBHOOK_PROVIDER_DELETE, $provider);

            json_response([
                'success' => true,
            ]);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }
}
