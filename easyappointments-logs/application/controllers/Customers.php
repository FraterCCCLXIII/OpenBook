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
 * Customers controller.
 *
 * Handles the customers related operations.
 *
 * @package Controllers
 */
class Customers extends EA_Controller
{
    public array $allowed_customer_fields = [
        'id',
        'first_name',
        'last_name',
        'email',
        'phone_number',
        'address',
        'city',
        'state',
        'zip_code',
        'notes',
        'timezone',
        'language',
        'custom_field_1',
        'custom_field_2',
        'custom_field_3',
        'custom_field_4',
        'custom_field_5',
        'ldap_dn',
    ];

    public array $optional_customer_fields = [
        //
    ];

    /**
     * Customers constructor.
     */
    public function __construct()
    {
        parent::__construct();

        $this->load->model('appointments_model');
        $this->load->model('appointment_notes_model');
        $this->load->model('customers_model');
        $this->load->model('custom_fields_model');
        $this->load->model('customer_custom_field_values_model');
        $this->load->model('customer_alerts_model');
        $this->load->model('customer_notes_model');
        $this->load->model('form_assignments_model');
        $this->load->model('forms_model');
        $this->load->model('providers_model');
        $this->load->model('secretaries_model');
        $this->load->model('roles_model');
        $this->load->model('services_model');

        $this->load->library('accounts');
        $this->load->library('activity_audit');
        $this->load->library('audit_log');
        $this->load->library('permissions');
        $this->load->library('timezones');
        $this->load->library('webhooks_client');
    }

    /**
     * Render the backend customers page.
     *
     * On this page admin users will be able to manage customers, which are eventually selected by customers during the
     * booking process.
     */
    public function index(?string $slug = null): void
    {
        session(['dest_url' => site_url('customers')]);

        $user_id = session('user_id');

        if (cannot('view', PRIV_CUSTOMERS)) {
            if ($user_id) {
                abort(403, 'Forbidden');
            }

            redirect('login');

            return;
        }

        $role_slug = session('role_slug');

        $date_format = setting('date_format');
        $time_format = setting('time_format');
        $require_first_name = setting('require_first_name');
        $require_last_name = setting('require_last_name');
        $require_email = setting('require_email');
        $require_phone_number = setting('require_phone_number');
        $require_address = setting('require_address');
        $require_city = setting('require_city');
        $require_zip_code = setting('require_zip_code');
        $require_notes = setting('require_notes');

        $secretary_providers = [];

        if ($role_slug === DB_SLUG_SECRETARY) {
            $secretary = $this->secretaries_model->find($user_id);

            $secretary_providers = $secretary['providers'];
        }

        $available_providers = $this->providers_model->get_available_providers();

        if ($role_slug === DB_SLUG_PROVIDER) {
            $available_providers = array_values(
                array_filter($available_providers, function ($available_provider) use ($user_id) {
                    return (int) $available_provider['id'] === (int) $user_id;
                }),
            );
        }

        if ($role_slug === DB_SLUG_SECRETARY) {
            $available_providers = array_values(
                array_filter($available_providers, function ($available_provider) use ($secretary_providers) {
                    return in_array($available_provider['id'], $secretary_providers);
                }),
            );
        }

        $available_services = $this->services_model->get_available_services();
        $appointment_status_options = setting('appointment_status_options');

        $selected_slug = $slug ?: request('slug');

        $customers = $this->customers_model->get(null, 50, null, 'update_datetime DESC');
        foreach ($customers as &$customer) {
            $customer['custom_field_values'] = $this->customer_custom_field_values_model
                ->find_for_user((int) $customer['id']);
        }

        script_vars([
            'user_id' => $user_id,
            'role_slug' => $role_slug,
            'date_format' => $date_format,
            'time_format' => $time_format,
            'timezones' => $this->timezones->to_array(),
            'secretary_providers' => $secretary_providers,
            'default_language' => setting('default_language'),
            'default_timezone' => setting('default_timezone'),
            'available_providers' => $available_providers,
            'available_services' => $available_services,
            'customers' => $customers,
            'selected_record_slug' => $selected_slug,
        ]);

        html_vars([
            'page_title' => lang('customers'),
            'active_menu' => PRIV_CUSTOMERS,
            'user_display_name' => $this->accounts->get_user_display_name($user_id),
            'timezones' => $this->timezones->to_array(),
            'grouped_timezones' => $this->timezones->to_grouped_array(),
            'privileges' => $this->roles_model->get_permissions_by_slug($role_slug),
            'require_first_name' => $require_first_name,
            'require_last_name' => $require_last_name,
            'require_email' => $require_email,
            'require_phone_number' => $require_phone_number,
            'require_address' => $require_address,
            'require_city' => $require_city,
            'require_zip_code' => $require_zip_code,
            'require_notes' => $require_notes,
            'available_languages' => config('available_languages'),
            'available_services' => $available_services,
            'appointment_status_options' => $appointment_status_options,
            'show_customer_forms_tab' => $this->has_forms_for_role(DB_SLUG_CUSTOMER),
            'custom_fields' => $this->custom_fields_model->find_displayed(),
        ]);

        $this->load->view('pages/customers');
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
     * Find a customer.
     */
    public function find(): void
    {
        try {
            if (cannot('view', PRIV_CUSTOMERS)) {
                abort(403, 'Forbidden');
            }

            $user_id = session('user_id');

            $customer_id = request('customer_id');

            if (!$this->permissions->has_customer_access($user_id, $customer_id)) {
                abort(403, 'Forbidden');
            }

            $customer = $this->customers_model->find($customer_id);
            if ($customer) {
                $customer['custom_field_values'] = $this->customer_custom_field_values_model
                    ->find_for_user((int) $customer['id']);
            }

            $this->audit_log->write('customer.view', [
                'customer_id' => (int) $customer_id,
            ]);

            json_response($customer);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    /**
     * Find a customer by slug.
     */
    public function find_by_slug(): void
    {
        try {
            if (cannot('view', PRIV_CUSTOMERS)) {
                abort(403, 'Forbidden');
            }

            $slug = request('slug');

            if (empty($slug)) {
                abort(400, 'Bad Request');
            }

            $customer = $this->customers_model->find_by_slug($slug);

            $user_id = session('user_id');

            if (!$this->permissions->has_customer_access($user_id, $customer['id'])) {
                abort(403, 'Forbidden');
            }

            $appointments = $this->appointments_model->get(['id_users_customer' => $customer['id']]);

            foreach ($appointments as &$appointment) {
                $this->appointments_model->load($appointment, ['service', 'provider']);
            }

            $this->audit_log->write('customer.view_by_slug', [
                'customer_id' => (int) $customer['id'],
                'slug' => $slug,
            ]);

            $customer['appointments'] = $appointments;
            $customer['custom_field_values'] = $this->customer_custom_field_values_model
                ->find_for_user((int) $customer['id']);

            json_response($customer);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    /**
     * Filter customers by the provided keyword.
     */
    public function search(): void
    {
        try {
            if (cannot('view', PRIV_CUSTOMERS)) {
                abort(403, 'Forbidden');
            }

            $keyword = request('keyword', '');

            $order_by = request('order_by', 'update_datetime DESC');

            $limit = request('limit', 1000);

            $offset = (int) request('offset', '0');

            $customers = $this->customers_model->search($keyword, $limit, $offset, $order_by);

            $user_id = session('user_id');

            foreach ($customers as $index => &$customer) {
                if (!$this->permissions->has_customer_access($user_id, $customer['id'])) {
                    unset($customers[$index]);

                    continue;
                }

                $appointments = $this->appointments_model->get(['id_users_customer' => $customer['id']]);

                foreach ($appointments as &$appointment) {
                    $this->appointments_model->load($appointment, ['service', 'provider']);
                }

                $customer['appointments'] = $appointments;
                $customer['custom_field_values'] = $this->customer_custom_field_values_model
                    ->find_for_user((int) $customer['id']);
            }

            json_response(array_values($customers));
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    /**
     * Get customer alerts.
     */
    public function alerts(): void
    {
        try {
            if (cannot('view', PRIV_CUSTOMERS)) {
                abort(403, 'Forbidden');
            }

            $customer_id = (int) request('customer_id');

            if (!$customer_id) {
                abort(400, 'Bad Request');
            }

            $user_id = session('user_id');

            if (!$this->permissions->has_customer_access($user_id, $customer_id)) {
                abort(403, 'Forbidden');
            }

            $alerts = $this->customer_alerts_model->get_by_customer($customer_id);

            json_response($alerts);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    /**
     * Get customer notes.
     */
    public function notes(): void
    {
        try {
            if (cannot('view', PRIV_CUSTOMERS)) {
                abort(403, 'Forbidden');
            }

            $customer_id = (int) request('customer_id');

            if (!$customer_id) {
                abort(400, 'Bad Request');
            }

            $user_id = session('user_id');

            if (!$this->permissions->has_customer_access($user_id, $customer_id)) {
                abort(403, 'Forbidden');
            }

            $notes = $this->customer_notes_model->get_by_customer($customer_id);

            json_response($notes);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    /**
     * Get customer visit notes.
     */
    public function visit_notes(): void
    {
        try {
            if (cannot('view', PRIV_CUSTOMERS)) {
                abort(403, 'Forbidden');
            }

            $customer_id = (int) request('customer_id');

            if (!$customer_id) {
                abort(400, 'Bad Request');
            }

            $user_id = session('user_id');

            if (!$this->permissions->has_customer_access($user_id, $customer_id)) {
                abort(403, 'Forbidden');
            }

            $notes = $this->appointment_notes_model->get_by_customer($customer_id);

            json_response($notes);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    /**
     * Store a new customer alert.
     */
    public function store_alert(): void
    {
        try {
            if (cannot('view', PRIV_CUSTOMERS)) {
                abort(403, 'Forbidden');
            }

            $alert = request('alert');

            if (!$alert || empty($alert['id_users_customer'])) {
                abort(400, 'Bad Request');
            }

            $customer_id = (int) $alert['id_users_customer'];
            $user_id = session('user_id');

            if (!$this->permissions->has_customer_access($user_id, $customer_id)) {
                abort(403, 'Forbidden');
            }

            $alert_payload = [
                'id_users_customer' => $customer_id,
                'id_users_author' => $user_id,
                'alert' => $alert['alert'] ?? '',
                'show_in_banner' => array_key_exists('show_in_banner', $alert)
                    ? (int) (bool) $alert['show_in_banner']
                    : 1,
            ];

            $alert_id = $this->customer_alerts_model->save($alert_payload);
            $alert_response = $this->customer_alerts_model->find_with_author($alert_id);

            $this->activity_audit->log('customer.alert.created', 'customer_alert', (string) $alert_id, [
                'customer_id' => (int) $customer_id,
            ]);

            json_response($alert_response);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    /**
     * Store a new customer note.
     */
    public function store_note(): void
    {
        try {
            if (cannot('view', PRIV_CUSTOMERS)) {
                abort(403, 'Forbidden');
            }

            $note = request('note');

            if (!$note || empty($note['id_users_customer'])) {
                abort(400, 'Bad Request');
            }

            $customer_id = (int) $note['id_users_customer'];
            $user_id = session('user_id');

            if (!$this->permissions->has_customer_access($user_id, $customer_id)) {
                abort(403, 'Forbidden');
            }

            $note_payload = [
                'id_users_customer' => $customer_id,
                'id_users_author' => $user_id,
                'note' => $note['note'] ?? '',
            ];

            $note_id = $this->customer_notes_model->save($note_payload);
            $note_response = $this->customer_notes_model->find_with_author($note_id);

            $this->activity_audit->log('customer.note.created', 'customer_note', (string) $note_id, [
                'customer_id' => (int) $customer_id,
            ]);

            json_response($note_response);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    /**
     * Update an existing customer alert.
     */
    public function update_alert(): void
    {
        try {
            if (cannot('view', PRIV_CUSTOMERS)) {
                abort(403, 'Forbidden');
            }

            $alert = request('alert');

            if (!$alert || empty($alert['id'])) {
                abort(400, 'Bad Request');
            }

            $alert_id = (int) $alert['id'];
            $existing_alert = $this->customer_alerts_model->find($alert_id);
            $user_id = session('user_id');

            if (!$this->permissions->has_customer_access($user_id, (int) $existing_alert['id_users_customer'])) {
                abort(403, 'Forbidden');
            }

            if ((int) $existing_alert['id_users_author'] !== (int) $user_id) {
                abort(403, 'Forbidden');
            }

            $alert_payload = [
                'id' => $alert_id,
                'id_users_customer' => (int) $existing_alert['id_users_customer'],
                'id_users_author' => (int) $existing_alert['id_users_author'],
                'alert' => $alert['alert'] ?? $existing_alert['alert'],
                'show_in_banner' => array_key_exists('show_in_banner', $alert)
                    ? (int) (bool) $alert['show_in_banner']
                    : (int) $existing_alert['show_in_banner'],
            ];

            $this->customer_alerts_model->save($alert_payload);
            $alert_response = $this->customer_alerts_model->find_with_author($alert_id);

            $this->activity_audit->log('customer.alert.updated', 'customer_alert', (string) $alert_id, [
                'customer_id' => (int) ($existing_alert['id_users_customer'] ?? 0),
            ]);

            json_response($alert_response);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    /**
     * Update an existing customer note.
     */
    public function update_note(): void
    {
        try {
            if (cannot('view', PRIV_CUSTOMERS)) {
                abort(403, 'Forbidden');
            }

            $note = request('note');

            if (!$note || empty($note['id'])) {
                abort(400, 'Bad Request');
            }

            $note_id = (int) $note['id'];
            $existing_note = $this->customer_notes_model->find($note_id);
            $user_id = session('user_id');

            if (!$this->permissions->has_customer_access($user_id, (int) $existing_note['id_users_customer'])) {
                abort(403, 'Forbidden');
            }

            if ((int) $existing_note['id_users_author'] !== (int) $user_id) {
                abort(403, 'Forbidden');
            }

            $note_payload = [
                'id' => $note_id,
                'id_users_customer' => (int) $existing_note['id_users_customer'],
                'id_users_author' => (int) $existing_note['id_users_author'],
                'note' => $note['note'] ?? '',
            ];

            $this->customer_notes_model->save($note_payload);
            $note_response = $this->customer_notes_model->find_with_author($note_id);

            $this->activity_audit->log('customer.note.updated', 'customer_note', (string) $note_id, [
                'customer_id' => (int) ($existing_note['id_users_customer'] ?? 0),
            ]);

            json_response($note_response);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    /**
     * Delete an existing customer alert.
     */
    public function delete_alert(): void
    {
        try {
            if (cannot('view', PRIV_CUSTOMERS)) {
                abort(403, 'Forbidden');
            }

            $alert_id = (int) request('alert_id');

            if (!$alert_id) {
                abort(400, 'Bad Request');
            }

            $existing_alert = $this->customer_alerts_model->find($alert_id);
            $user_id = session('user_id');

            if (!$this->permissions->has_customer_access($user_id, (int) $existing_alert['id_users_customer'])) {
                abort(403, 'Forbidden');
            }

            $this->customer_alerts_model->delete($alert_id);

            $this->activity_audit->log('customer.alert.deleted', 'customer_alert', (string) $alert_id, [
                'customer_id' => (int) ($existing_alert['id_users_customer'] ?? 0),
            ]);

            json_response(['deleted' => true]);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    /**
     * Delete an existing customer note.
     */
    public function delete_note(): void
    {
        try {
            if (cannot('view', PRIV_CUSTOMERS)) {
                abort(403, 'Forbidden');
            }

            $note_id = (int) request('note_id');

            if (!$note_id) {
                abort(400, 'Bad Request');
            }

            $existing_note = $this->customer_notes_model->find($note_id);
            $user_id = session('user_id');

            if (!$this->permissions->has_customer_access($user_id, (int) $existing_note['id_users_customer'])) {
                abort(403, 'Forbidden');
            }

            $this->customer_notes_model->delete($note_id);

            $this->activity_audit->log('customer.note.deleted', 'customer_note', (string) $note_id, [
                'customer_id' => (int) ($existing_note['id_users_customer'] ?? 0),
            ]);

            json_response(['deleted' => true]);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    /**
     * Store a new customer.
     */
    public function store(): void
    {
        try {
            if (cannot('add', PRIV_CUSTOMERS)) {
                abort(403, 'Forbidden');
            }

            if (session('role_slug') !== DB_SLUG_ADMIN && setting('limit_customer_visibility')) {
                abort(403);
            }

            $customer = request('customer');
            $custom_fields = request('custom_fields', []);

            $this->customers_model->only($customer, $this->allowed_customer_fields);

            $this->customers_model->optional($customer, $this->optional_customer_fields);

            $customer_id = $this->customers_model->save($customer);

            if (is_array($custom_fields)) {
                $this->customer_custom_field_values_model->save_for_user((int) $customer_id, $custom_fields);
            }

            $customer = $this->customers_model->find($customer_id);

            $this->webhooks_client->trigger(WEBHOOK_CUSTOMER_SAVE, $customer);

            $this->audit_log->write('customer.create', [
                'customer_id' => (int) $customer_id,
            ]);

            json_response([
                'success' => true,
                'id' => $customer_id,
            ]);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    /**
     * Update a customer.
     */
    public function update(): void
    {
        try {
            if (cannot('edit', PRIV_CUSTOMERS)) {
                abort(403, 'Forbidden');
            }

            $user_id = session('user_id');

            $customer = request('customer');
            $custom_fields = request('custom_fields', []);

            if (!$this->permissions->has_customer_access($user_id, $customer['id'])) {
                abort(403, 'Forbidden');
            }

            $this->customers_model->only($customer, $this->allowed_customer_fields);

            $this->customers_model->optional($customer, $this->optional_customer_fields);

            $customer_id = $this->customers_model->save($customer);

            if (is_array($custom_fields)) {
                $this->customer_custom_field_values_model->save_for_user((int) $customer_id, $custom_fields);
            }

            $customer = $this->customers_model->find($customer_id);

            $this->webhooks_client->trigger(WEBHOOK_CUSTOMER_SAVE, $customer);

            $this->audit_log->write('customer.update', [
                'customer_id' => (int) $customer_id,
            ]);

            json_response([
                'success' => true,
                'id' => $customer_id,
            ]);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    /**
     * Remove a customer.
     */
    public function destroy(): void
    {
        try {
            if (cannot('delete', PRIV_CUSTOMERS)) {
                abort(403, 'Forbidden');
            }

            $user_id = session('user_id');

            $customer_id = request('customer_id');

            if (!$this->permissions->has_customer_access($user_id, $customer_id)) {
                abort(403, 'Forbidden');
            }

            $customer = $this->customers_model->find($customer_id);

            $this->customers_model->delete($customer_id);

            $this->webhooks_client->trigger(WEBHOOK_CUSTOMER_DELETE, $customer);

            $this->audit_log->write('customer.delete', [
                'customer_id' => (int) $customer_id,
            ]);

            json_response([
                'success' => true,
            ]);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }
}
