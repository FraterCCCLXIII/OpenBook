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
 * Booking controller.
 *
 * Handles the booking related operations.
 *
 * Notice: This file used to have the booking page related code which since v1.5 has now moved to the Booking.php
 * controller for improved consistency.
 *
 * @package Controllers
 */
class Booking extends EA_Controller
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
        'timezone',
        'language',
        'custom_field_1',
        'custom_field_2',
        'custom_field_3',
        'custom_field_4',
        'custom_field_5',
    ];
    public mixed $allowed_provider_fields = ['id', 'first_name', 'last_name', 'services', 'timezone'];
    public array $allowed_appointment_fields = [
        'id',
        'start_datetime',
        'end_datetime',
        'location',
        'notes',
        'color',
        'status',
        'is_unavailability',
        'id_users_provider',
        'id_users_customer',
        'id_services',
    ];

    /**
     * Booking constructor.
     */
    public function __construct()
    {
        parent::__construct();

        $this->load->model('appointments_model');
        $this->load->model('providers_model');
        $this->load->model('admins_model');
        $this->load->model('secretaries_model');
        $this->load->model('service_categories_model');
        $this->load->model('services_model');
        $this->load->model('customers_model');
        $this->load->model('provider_service_area_zips_model');
        $this->load->model('service_area_zips_model');
        $this->load->model('customer_auth_model');
        $this->load->model('custom_fields_model');
        $this->load->model('customer_custom_field_values_model');
        $this->load->model('form_assignments_model');
        $this->load->model('forms_model');
        $this->load->model('settings_model');
        $this->load->model('consents_model');
        $this->load->model('appointment_payments_model');

        $this->load->library('timezones');
        $this->load->library('activity_audit');
        $this->load->library('synchronization');
        $this->load->library('notifications');
        $this->load->library('availability');
        $this->load->library('webhooks_client');
        $this->load->library('stripe_gateway');
        $this->load->library('appointment_payments_service');
        $this->load->library('google_sync');
    }

    /**
     * Handle Stripe Webhook.
     */
    public function stripe_webhook(): void
    {
        try {
            $payload = @file_get_contents('php://input');
            $sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
            $event = $this->stripe_gateway->construct_webhook_event($payload, $sig_header);
            $event_id = (string) ($event->id ?? '');

            if ($event_id !== '' && $this->appointment_payments_model->find_by_event_id($event_id)) {
                json_response(['success' => true]);
                return;
            }

            if ($event->type === 'checkout.session.completed') {
                $session = $event->data->object;
                $session = $this->stripe_gateway->retrieve_checkout_session((string) $session->id);
                $appointment_id = $session->client_reference_id;
                $appointment = $this->appointments_model->find($appointment_id);

                if ($appointment) {
                    $flow = (string) ($session->metadata->payment_flow ?? 'deposit');
                    $appointment = $this->appointment_payments_service->mark_checkout_completed(
                        $appointment,
                        $session,
                        $event_id,
                        $flow,
                    );
                    
                    // Trigger notifications and webhooks now that it's paid
                    $service = $this->services_model->find($appointment['id_services']);
                    $provider = $this->providers_model->find($appointment['id_users_provider']);
                    $customer = $this->customers_model->find($appointment['id_users_customer']);
                    
                    $settings = [
                        'company_name' => setting('company_name'),
                        'company_link' => setting('company_link'),
                        'company_email' => setting('company_email'),
                        'company_color' => setting('company_color'),
                        'date_format' => setting('date_format'),
                        'time_format' => setting('time_format'),
                    ];

                    $this->synchronization->sync_appointment_saved($appointment, $service, $provider, $customer, $settings);
                    $this->notifications->notify_appointment_saved($appointment, $service, $provider, $customer, $settings, false);
                    $this->webhooks_client->trigger(WEBHOOK_APPOINTMENT_SAVE, $appointment);

                    $this->activity_audit->log('booking.webhook.checkout_completed', 'appointment', (string) $appointment_id, [
                        'appointment_id' => (int) $appointment_id,
                        'customer_id' => (int) ($appointment['id_users_customer'] ?? 0),
                        'stripe_event_id' => $event_id,
                        'payment_flow' => $flow,
                    ]);
                }
            }

            json_response(['success' => true]);
        } catch (Throwable $e) {
            log_message('error', 'Stripe Webhook Error: ' . $e->getMessage());
            http_response_code(400);
            exit();
        }
    }

    /**
     * Handle payment success return.
     */
    public function payment_success(string $appointment_hash): void
    {
        $results = $this->appointments_model->get(['hash' => $appointment_hash]);
        if (empty($results)) {
            redirect('dashboard');
            return;
        }

        $appointment = $results[0];
        $add_to_google_url = '';

        try {
            $add_to_google_url = $this->google_sync->get_add_to_google_url($appointment['id']);
        } catch (Throwable) {
            $add_to_google_url = '';
        }

        html_vars([
            'appointment' => $appointment,
            'page_title' => lang('booking_complete'),
            'add_to_google_url' => $add_to_google_url,
            'company_name' => setting('company_name'),
            'company_logo' => setting('company_logo'),
            'company_color' => setting('company_color'),
            'google_analytics_code' => setting('google_analytics_code'),
            'matomo_analytics_url' => setting('matomo_analytics_url'),
            'matomo_analytics_site_id' => setting('matomo_analytics_site_id'),
            'show_customer_forms_link' => $this->has_customer_forms(),
        ]);

        $session_id = request('session_id');

        if ($session_id && $this->stripe_gateway->is_enabled()) {
            try {
                $session = $this->stripe_gateway->retrieve_checkout_session($session_id);

                $matches_appointment =
                    (string)$session->client_reference_id === (string)$appointment['id'] ||
                    (($session->metadata->appointment_hash ?? '') === $appointment_hash);

                if ($matches_appointment && ($session->payment_status ?? '') === 'paid') {
                    $flow = (string) ($session->metadata->payment_flow ?? 'deposit');
                    $appointment = $this->appointment_payments_service->mark_checkout_completed(
                        $appointment,
                        $session,
                        '',
                        $flow,
                    );
                }
            } catch (Throwable $e) {
                log_message('error', 'Stripe Payment Success Error: ' . $e->getMessage());
            }
        }

        $this->load->view('pages/booking_success');
    }

    /**
     * Handle payment cancel return.
     */
    public function payment_cancel(string $appointment_hash): void
    {
        // Optionally delete the pending appointment or just redirect back
        redirect('booking/reschedule/' . $appointment_hash);
    }

    /**
     * Create a retry payment link for an outstanding appointment balance.
     */
    public function retry_payment_link(string $appointment_hash): void
    {
        try {
            $results = $this->appointments_model->get(['hash' => $appointment_hash]);
            if (empty($results)) {
                abort(404, 'Not Found');
            }

            $appointment = $results[0];
            $customer = customer_logged_in() ? $this->customers_model->find(customer_id()) : null;

            if (!$customer || (int) $appointment['id_users_customer'] !== (int) $customer['id']) {
                abort(403, 'Forbidden');
            }

            $payload = $this->appointment_payments_service->prepare_remaining_payment_link((int) $appointment['id']);

            json_response([
                'success' => true,
                'payment_link' => $payload['payment_link'],
            ]);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    /**
     * Redirect customer to a hosted checkout session for outstanding balance.
     */
    public function retry_payment(string $appointment_hash): void
    {
        try {
            $results = $this->appointments_model->get(['hash' => $appointment_hash]);
            if (empty($results)) {
                abort(404, 'Not Found');
            }

            $appointment = $results[0];
            $customer = customer_logged_in() ? $this->customers_model->find(customer_id()) : null;

            if (!$customer || (int) $appointment['id_users_customer'] !== (int) $customer['id']) {
                abort(403, 'Forbidden');
            }

            $payload = $this->appointment_payments_service->prepare_remaining_payment_link((int) $appointment['id']);
            redirect($payload['payment_link']);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    /**
     * Render the booking page and display the selected appointment.
     *
     * This method will call the "index" callback to handle the page rendering.
     *
     * @param string $appointment_hash
     */
    public function reschedule(string $appointment_hash): void
    {
        html_vars(['appointment_hash' => $appointment_hash]);

        $this->index();
    }

    /**
     * Render the booking page.
     *
     * This method creates the appointment book wizard.
     */
    public function index(): void
    {
        if (!is_app_installed()) {
            redirect('installation');

            return;
        }

        $company_name = setting('company_name');
        $company_logo = setting('company_logo');
        $company_color = setting('company_color');
        $disable_booking = setting('disable_booking');
        $google_analytics_code = setting('google_analytics_code');
        $matomo_analytics_url = setting('matomo_analytics_url');
        $matomo_analytics_site_id = setting('matomo_analytics_site_id');

        if ($disable_booking) {
            $disable_booking_message = setting('disable_booking_message');

            html_vars([
                'show_message' => true,
                'page_title' => lang('page_title') . ' ' . $company_name,
                'message_title' => lang('booking_is_disabled'),
                'message_text' => $disable_booking_message,
                'message_icon' => base_url('assets/img/error.png'),
                'google_analytics_code' => $google_analytics_code,
                'matomo_analytics_url' => $matomo_analytics_url,
                'matomo_analytics_site_id' => $matomo_analytics_site_id,
            ]);

            $this->load->view('pages/booking_message');

            return;
        }

        $appointment_hash = html_vars('appointment_hash');
        $login_mode = customer_login_mode();
        $requires_login = $login_mode !== 'none';

        if ($requires_login && !customer_logged_in()) {
            session(['customer_return_url' => current_url()]);
            redirect('customer/login');
            return;
        }

        if (!$requires_login && !empty($appointment_hash) && !customer_logged_in()) {
            session(['customer_return_url' => current_url()]);
            redirect('customer/login');
            return;
        }

        $available_services = $this->services_model->get_available_services(true);
        $available_providers = $this->providers_model->get_available_providers(true);

        foreach ($available_providers as &$available_provider) {
            // Only expose the required provider data.

            $this->providers_model->only($available_provider, $this->allowed_provider_fields);
        }

        $date_format = setting('date_format');
        $time_format = setting('time_format');
        $first_weekday = setting('first_weekday');
        $display_first_name = setting('display_first_name');
        $require_first_name = setting('require_first_name');
        $display_last_name = setting('display_last_name');
        $require_last_name = setting('require_last_name');
        $display_email = setting('display_email');
        $require_email = setting('require_email');
        $display_phone_number = setting('display_phone_number');
        $require_phone_number = setting('require_phone_number');
        $display_address = setting('display_address');
        $require_address = setting('require_address');
        $display_city = setting('display_city');
        $require_city = setting('require_city');
        $display_zip_code = setting('display_zip_code');
        $require_zip_code = setting('require_zip_code');
        $display_notes = setting('display_notes');
        $require_notes = setting('require_notes');
        $display_cookie_notice = setting('display_cookie_notice');
        $cookie_notice_content = setting('cookie_notice_content');
        $display_terms_and_conditions = setting('display_terms_and_conditions');
        $terms_and_conditions_content = setting('terms_and_conditions_content');
        $display_privacy_policy = setting('display_privacy_policy');
        $privacy_policy_content = setting('privacy_policy_content');
        $display_any_provider = setting('display_any_provider');
        $display_login_button = setting('display_login_button');
        $display_delete_personal_information = setting('display_delete_personal_information');
        $book_advance_timeout = setting('book_advance_timeout');
        $show_customer_forms_link = $this->has_customer_forms();
        $theme = request('theme', setting('theme', 'default'));

        if (empty($theme) || !file_exists(__DIR__ . '/../../assets/css/themes/' . $theme . '.min.css')) {
            $theme = 'default';
        }

        $timezones = $this->timezones->to_array();
        $grouped_timezones = $this->timezones->to_grouped_array();

        $customer = customer_logged_in() ? $this->customers_model->find(customer_id()) : null;

        if (customer_logged_in() && empty($customer)) {
            $this->session->unset_userdata(['customer_id', 'customer_email']);
            redirect('customer/login');
            return;
        }

        if (customer_logged_in() && customer_login_mode() === 'password') {
            $auth = $this->customer_auth_model->find_by_customer_id((int) $customer['id']);
            if (empty($auth) || empty($auth['password_hash'])) {
                session(['customer_return_url' => current_url()]);
                redirect('customer/create_password');
                return;
            }
        }

        if (customer_logged_in() && !$this->is_customer_profile_complete($customer)) {
            session([
                'customer_flash' => [
                    'type' => 'warning',
                    'message' => 'Please complete your profile before booking.',
                ],
            ]);
            redirect('customer/account?complete=1');
            return;
        }

        if (!empty($appointment_hash)) {
            // Load the appointments data and enable the manage mode of the booking page.

            $manage_mode = true;

            $results = $this->appointments_model->get(['hash' => $appointment_hash]);

            if (empty($results)) {
                html_vars([
                    'show_message' => true,
                    'page_title' => lang('page_title') . ' ' . $company_name,
                    'message_title' => lang('appointment_not_found'),
                    'message_text' => lang('appointment_does_not_exist_in_db'),
                    'message_icon' => base_url('assets/img/error.png'),
                    'google_analytics_code' => $google_analytics_code,
                    'matomo_analytics_url' => $matomo_analytics_url,
                    'matomo_analytics_site_id' => $matomo_analytics_site_id,
                ]);

                $this->load->view('pages/booking_message');

                return;
            }

            // Make sure the appointment can still be rescheduled.

            $start_datetime = strtotime($results[0]['start_datetime']);

            $limit = strtotime('+' . $book_advance_timeout . ' minutes', strtotime('now'));

            if ($start_datetime < $limit) {
                $hours = floor($book_advance_timeout / 60);

                $minutes = $book_advance_timeout % 60;

                html_vars([
                    'show_message' => true,
                    'page_title' => lang('page_title') . ' ' . $company_name,
                    'message_title' => lang('appointment_locked'),
                    'message_text' => strtr(lang('appointment_locked_message'), [
                        '{$limit}' => sprintf('%02d:%02d', $hours, $minutes),
                    ]),
                    'message_icon' => base_url('assets/img/error.png'),
                    'google_analytics_code' => $google_analytics_code,
                    'matomo_analytics_url' => $matomo_analytics_url,
                    'matomo_analytics_site_id' => $matomo_analytics_site_id,
                ]);

                $this->load->view('pages/booking_message');

                return;
            }

            $appointment = $results[0];

            if (empty($customer) || (int) $appointment['id_users_customer'] !== (int) $customer['id']) {
                abort(403, 'Forbidden');
            }
            $provider = $this->providers_model->find($appointment['id_users_provider']);
            $customer = $this->customers_model->find($appointment['id_users_customer']);
            $customer_token = md5(uniqid(mt_rand(), true));

            // Cache the token for 10 minutes.
            $this->cache->save('customer-token-' . $customer_token, $customer['id'], 600);
        } else {
            $manage_mode = false;
            $customer_token = false;
            $appointment = null;
            $provider = null;
        }

        $customer_data = $customer ?: [];
        if (!empty($customer_data)) {
            $this->customers_model->only($customer_data, $this->allowed_customer_fields);
        }
        $custom_fields = $this->custom_fields_model->find_displayed();
        $custom_field_values = $customer
            ? $this->customer_custom_field_values_model->find_for_user((int) $customer['id'])
            : [];

        script_vars([
            'manage_mode' => $manage_mode,
            'available_services' => $available_services,
            'available_providers' => $available_providers,
            'date_format' => $date_format,
            'time_format' => $time_format,
            'first_weekday' => $first_weekday,
            'display_cookie_notice' => $display_cookie_notice,
            'display_any_provider' => setting('display_any_provider'),
            'future_booking_limit' => setting('future_booking_limit'),
            'appointment_data' => $appointment,
            'provider_data' => $provider,
            'customer_data' => $customer_data,
            'customer_token' => $customer_token,
            'custom_field_values' => $custom_field_values,
            'default_language' => setting('default_language'),
            'default_timezone' => setting('default_timezone'),
            'default_service_area_country' => setting('default_service_area_country', 'US'),
            'customer_logged_in' => customer_logged_in(),
        ]);

        html_vars([
            'available_services' => $available_services,
            'available_providers' => $available_providers,
            'theme' => $theme,
            'company_name' => $company_name,
            'company_logo' => $company_logo,
            'company_color' => $company_color === '#ffffff' ? '' : $company_color,
            'date_format' => $date_format,
            'time_format' => $time_format,
            'first_weekday' => $first_weekday,
            'display_first_name' => $display_first_name,
            'require_first_name' => $require_first_name,
            'display_last_name' => $display_last_name,
            'require_last_name' => $require_last_name,
            'display_email' => $display_email,
            'require_email' => $require_email,
            'display_phone_number' => $display_phone_number,
            'require_phone_number' => $require_phone_number,
            'display_address' => $display_address,
            'require_address' => $require_address,
            'display_city' => $display_city,
            'require_city' => $require_city,
            'display_zip_code' => $display_zip_code,
            'require_zip_code' => $require_zip_code,
            'display_notes' => $display_notes,
            'require_notes' => $require_notes,
            'display_cookie_notice' => $display_cookie_notice,
            'cookie_notice_content' => $cookie_notice_content,
            'display_terms_and_conditions' => $display_terms_and_conditions,
            'terms_and_conditions_content' => $terms_and_conditions_content,
            'display_privacy_policy' => $display_privacy_policy,
            'privacy_policy_content' => $privacy_policy_content,
            'display_any_provider' => $display_any_provider,
            'display_login_button' => $display_login_button,
            'display_delete_personal_information' => $display_delete_personal_information,
            'google_analytics_code' => $google_analytics_code,
            'matomo_analytics_url' => $matomo_analytics_url,
            'matomo_analytics_site_id' => $matomo_analytics_site_id,
            'show_customer_forms_link' => $show_customer_forms_link,
            'timezones' => $timezones,
            'grouped_timezones' => $grouped_timezones,
            'manage_mode' => $manage_mode,
            'appointment_data' => $appointment,
            'provider_data' => $provider,
            'customer_data' => $customer_data,
            'custom_fields' => $custom_fields,
            'custom_field_values' => $custom_field_values,
        ]);

        $this->load->view('pages/booking');
    }

    /**
     * Register the appointment to the database.
     */
    public function register(): void
    {
        try {
            $disable_booking = setting('disable_booking');

            if ($disable_booking) {
                abort(403);
            }

            $login_mode = customer_login_mode();
            $requires_login = $login_mode !== 'none';

            if ($requires_login && !customer_logged_in()) {
                abort(403, 'Forbidden');
            }

            $post_data = request('post_data');
            $captcha = request('captcha');
            $appointment = $post_data['appointment'];
            $customer_input = $post_data['customer'];
            $manage_mode = filter_var($post_data['manage_mode'], FILTER_VALIDATE_BOOLEAN);

            $customer_id = customer_logged_in() ? customer_id() : null;
            $customer = $customer_id ? $this->customers_model->find($customer_id) : null;

            if (customer_logged_in() && empty($customer)) {
                abort(403, 'Forbidden');
            }

            if (customer_logged_in() && customer_login_mode() === 'password') {
                $auth = $this->customer_auth_model->find_by_customer_id((int) $customer_id);
                if (empty($auth) || empty($auth['password_hash'])) {
                    abort(403, 'Forbidden');
                }
            }

            if (!customer_logged_in()) {
                $customer_email = trim((string) ($customer_input['email'] ?? ''));

                if (empty($customer_email) || !filter_var($customer_email, FILTER_VALIDATE_EMAIL)) {
                    throw new InvalidArgumentException('Valid email address is required.');
                }

                $customer_data = [
                    'email' => $customer_email,
                ];

                if ($this->customers_model->exists($customer_data)) {
                    $customer_id = $this->customers_model->find_record_id($customer_data);
                } else {
                    $customer_id = $this->customers_model->create_shell($customer_data);
                }

                $customer = $this->customers_model->find($customer_id);

                if (empty($customer)) {
                    abort(403, 'Forbidden');
                }

                $auth = $this->customer_auth_model->find_by_email($customer_email);
                if (empty($auth)) {
                    $this->customer_auth_model->save([
                        'customer_id' => $customer_id,
                        'email' => $customer_email,
                        'password_hash' => '',
                        'status' => 'active',
                    ]);
                }
            }

            $customer_input = is_array($customer_input) ? $customer_input : [];
            $custom_fields_input = $customer_input['custom_fields'] ?? [];
            unset($customer_input['custom_fields']);
            $customer_email = $customer['email'];
            $customer = array_merge($customer, $customer_input);
            $customer['id'] = $customer_id;
            $customer['email'] = $customer_email;

            if (!array_key_exists('address', $customer)) {
                $customer['address'] = '';
            }

            if (!array_key_exists('city', $customer)) {
                $customer['city'] = '';
            }

            if (!array_key_exists('zip_code', $customer)) {
                $customer['zip_code'] = '';
            }

            if (!array_key_exists('notes', $customer)) {
                $customer['notes'] = '';
            }

            if (!array_key_exists('phone_number', $customer)) {
                $customer['phone_number'] = '';
            }

            // Check appointment availability before registering it to the database.
            $appointment['id_users_provider'] = $this->check_datetime_availability();

            if (!$appointment['id_users_provider']) {
                throw new RuntimeException(lang('requested_hour_is_unavailable'));
            }

            $provider = $this->providers_model->find($appointment['id_users_provider']);

            $service = $this->services_model->find($appointment['id_services']);

            $require_captcha = (bool) setting('require_captcha');

            $captcha_phrase = session('captcha_phrase');

            // Validate the CAPTCHA string.

            if ($require_captcha && strtoupper($captcha_phrase) !== strtoupper($captcha)) {
                json_response([
                    'captcha_verification' => false,
                ]);

                return;
            }

            $existing_appointments = $this->appointments_model->get([
                'id !=' => $manage_mode ? $appointment['id'] : null,
                'id_users_customer' => $customer_id,
                'start_datetime <=' => $appointment['start_datetime'],
                'end_datetime >=' => $appointment['end_datetime'],
            ]);

            if (count($existing_appointments)) {
                throw new RuntimeException(lang('customer_is_already_booked'));
            }

            if (empty($appointment['location']) && !empty($service['location'])) {
                $appointment['location'] = $service['location'];
            }

            if (empty($appointment['color']) && !empty($service['color'])) {
                $appointment['color'] = $service['color'];
            }

            $customer_ip = $this->input->ip_address();

            // Create the consents (if needed).
            $consent = [
                'first_name' => $customer['first_name'] ?? '-',
                'last_name' => $customer['last_name'] ?? '-',
                'email' => $customer['email'] ?? '-',
                'ip' => $customer_ip,
            ];

            if (setting('display_terms_and_conditions')) {
                $consent['type'] = 'terms-and-conditions';

                $this->consents_model->save($consent);
            }

            if (setting('display_privacy_policy')) {
                $consent['type'] = 'privacy-policy';

                $this->consents_model->save($consent);
            }

            // Save customer language (the language which is used to render the booking page).
            $customer['language'] = session('language') ?? config('language');

            $this->customers_model->only($customer, $this->allowed_customer_fields);

            $customer_id = $this->customers_model->save($customer);
            $customer = $this->customers_model->find($customer_id);

            if (is_array($custom_fields_input)) {
                $this->customer_custom_field_values_model->save_for_user(
                    (int) $customer_id,
                    $custom_fields_input
                );
            }

            $appointment['id_users_customer'] = $customer_id;
            $appointment['is_unavailability'] = false;
            $appointment['color'] = $service['color'];

            $appointment_status_options_json = setting('appointment_status_options', '[]');
            $appointment_status_options = json_decode($appointment_status_options_json, true) ?? [];
            $appointment['status'] = $appointment_status_options[0] ?? null;
            $appointment['end_datetime'] = $this->appointments_model->calculate_end_datetime($appointment);

            $this->appointments_model->only($appointment, $this->allowed_appointment_fields);

            $appointment_id = $this->appointments_model->save($appointment);
            $appointment = $this->appointments_model->find($appointment_id);
            $this->activity_audit->log('booking.appointment.created', 'appointment', (string) $appointment_id, [
                'appointment_id' => (int) $appointment_id,
                'customer_id' => (int) ($appointment['id_users_customer'] ?? 0),
                'provider_id' => (int) ($appointment['id_users_provider'] ?? 0),
            ]);

            $company_color = setting('company_color');

            $settings = [
                'company_name' => setting('company_name'),
                'company_link' => setting('company_link'),
                'company_email' => setting('company_email'),
                'company_logo_email_png' => setting('company_logo_email_png'),
                'company_color' =>
                    !empty($company_color) && $company_color != DEFAULT_COMPANY_COLOR ? $company_color : null,
                'date_format' => setting('date_format'),
                'time_format' => setting('time_format'),
            ];

            $response = [
                'appointment_id' => $appointment['id'],
                'appointment_hash' => $appointment['hash'],
            ];

            $requires_online_payment =
                !$manage_mode &&
                $this->stripe_gateway->is_enabled() &&
                !empty($service['price']) &&
                (float)$service['price'] > 0;

            if ($requires_online_payment) {
                $this->appointment_payments_service->initialize_appointment_payment_state($appointment, $service);
                $this->appointments_model->save($appointment);
                $appointment = $this->appointments_model->find($appointment_id);

                $deposit_amount = (float) ($appointment['deposit_amount'] ?? $appointment['payment_amount'] ?? 0);

                if ($deposit_amount > 0) {
                    $session = $this->stripe_gateway->create_amount_checkout_session(
                        $appointment,
                        $service,
                        $customer,
                        $deposit_amount,
                        (string) ($service['name'] ?? 'Service'),
                        [
                            'payment_flow' => 'deposit',
                        ],
                    );
                    $response['stripe_checkout_url'] = $session->url;
                } else {
                    $appointment['payment_status'] = 'not-paid';
                    $appointment['payment_stage'] = 'deposit_paid';
                    $appointment['billing_status'] = 'unpaid';
                    $appointment['billing_updated_at'] = date('Y-m-d H:i:s');
                    $this->appointments_model->save($appointment);

                    $this->synchronization->sync_appointment_saved($appointment, $service, $provider, $customer, $settings);

                    $this->notifications->notify_appointment_saved(
                        $appointment,
                        $service,
                        $provider,
                        $customer,
                        $settings,
                        $manage_mode,
                    );

                    $this->webhooks_client->trigger(WEBHOOK_APPOINTMENT_SAVE, $appointment);

                    $this->activity_audit->log('booking.appointment.saved_without_deposit', 'appointment', (string) $appointment_id, [
                        'appointment_id' => (int) $appointment_id,
                        'customer_id' => (int) ($appointment['id_users_customer'] ?? 0),
                    ]);
                }
            } else {
                $this->synchronization->sync_appointment_saved($appointment, $service, $provider, $customer, $settings);

                $this->notifications->notify_appointment_saved(
                    $appointment,
                    $service,
                    $provider,
                    $customer,
                    $settings,
                    $manage_mode,
                );

                $this->webhooks_client->trigger(WEBHOOK_APPOINTMENT_SAVE, $appointment);
                $this->activity_audit->log('booking.appointment.saved', 'appointment', (string) $appointment_id, [
                    'appointment_id' => (int) $appointment_id,
                    'customer_id' => (int) ($appointment['id_users_customer'] ?? 0),
                ]);
            }

            json_response($response);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    /**
     * Check whether the provider is still available in the selected appointment date.
     *
     * It is possible that two or more customers select the same appointment date and time concurrently. The app won't
     * allow this to happen, so one of the two will eventually get the selected date and the other one will have
     * to choose for another one.
     *
     * Use this method just before the customer confirms the appointment registration. If the selected date was reserved
     * in the meanwhile, the customer must be prompted to select another time.
     *
     * @return int|null Returns the ID of the provider that is available for the appointment.
     *
     * @throws Exception
     */
    protected function check_datetime_availability(): ?int
    {
        $post_data = request('post_data');

        $appointment = $post_data['appointment'];

        $appointment_start = new DateTime($appointment['start_datetime']);

        $date = $appointment_start->format('Y-m-d');

        $hour = $appointment_start->format('H:i');

        if ($appointment['id_users_provider'] === ANY_PROVIDER) {
            $appointment['id_users_provider'] = $this->search_any_provider($appointment['id_services'], $date, $hour);

            return $appointment['id_users_provider'];
        }

        $service = $this->services_model->find($appointment['id_services']);

        $exclude_appointment_id = $appointment['id'] ?? null;

        $provider = $this->providers_model->find($appointment['id_users_provider']);

        $available_hours = $this->availability->get_available_hours(
            $date,
            $service,
            $provider,
            $exclude_appointment_id,
        );

        $is_still_available = false;

        $appointment_hour = date('H:i', strtotime($appointment['start_datetime']));

        foreach ($available_hours as $available_hour) {
            if ($appointment_hour === $available_hour) {
                $is_still_available = true;
                break;
            }
        }

        return $is_still_available ? $appointment['id_users_provider'] : null;
    }

    /**
     * Check whether the customer profile is complete for booking.
     *
     * @param array $customer
     *
     * @return bool
     */
    protected function is_customer_profile_complete(array $customer): bool
    {
        if (empty($customer['first_name'])) {
            return false;
        }

        if (empty($customer['last_name'])) {
            return false;
        }

        if (empty($customer['address'])) {
            return false;
        }

        return true;
    }

    protected function has_customer_forms(): bool
    {
        $assigned = $this->form_assignments_model->find_for_role(DB_SLUG_CUSTOMER);

        if (!$assigned) {
            return false;
        }

        $form_ids = array_map(fn ($row) => $row['id_forms'], $assigned);
        $forms = $this->forms_model->find_by_ids($form_ids, true);

        return !empty($forms);
    }

    /**
     * Search for any provider that can handle the requested service.
     *
     * This method will return the database ID of the provider with the most available periods.
     *
     * @param int $service_id Service ID
     * @param string $date Selected date (Y-m-d).
     * @param string|null $hour Selected hour (H:i).
     *
     * @return int|null Returns the ID of the provider that can provide the service at the selected date.
     *
     * @throws Exception
     */
    protected function search_any_provider(int $service_id, string $date, ?string $hour = null): ?int
    {
        $available_providers = $this->providers_model->get_available_providers(true);

        $service = $this->services_model->find($service_id);

        $provider_id = null;

        $max_hours_count = 0;

        foreach ($available_providers as $provider) {
            foreach ($provider['services'] as $provider_service_id) {
                if ($provider_service_id == $service_id) {
                    // Check if the provider is available for the requested date.
                    $available_hours = $this->availability->get_available_hours($date, $service, $provider);

                    if (
                        count($available_hours) > $max_hours_count &&
                        (empty($hour) || in_array($hour, $available_hours))
                    ) {
                        $provider_id = $provider['id'];

                        $max_hours_count = count($available_hours);
                    }
                }
            }
        }

        return $provider_id;
    }

    /**
     * Get the available appointment hours for the selected date.
     *
     * This method answers to an AJAX request. It calculates the available hours for the given service, provider and
     * date.
     */
    public function get_available_hours(): void
    {
        try {
            $disable_booking = setting('disable_booking');

            if ($disable_booking) {
                abort(403);
            }

            $provider_id = request('provider_id');
            $service_id = request('service_id');
            $selected_date = request('selected_date');

            // Do not continue if there was no provider selected (more likely there is no provider in the system).

            if (empty($provider_id)) {
                json_response();

                return;
            }

            // If manage mode is TRUE then the following we should not consider the selected appointment when
            // calculating the available time periods of the provider.

            $exclude_appointment_id = request('manage_mode') ? request('appointment_id') : null;

            // If the user has selected the "any-provider" option then we will need to search for an available provider
            // that will provide the requested service.

            $service = $this->services_model->find($service_id);

            if ($provider_id === ANY_PROVIDER) {
                $providers = $this->providers_model->get_available_providers(true);

                $available_hours = [];

                foreach ($providers as $provider) {
                    if (!in_array($service_id, $provider['services'])) {
                        continue;
                    }

                    $provider_available_hours = $this->availability->get_available_hours(
                        $selected_date,
                        $service,
                        $provider,
                        $exclude_appointment_id,
                    );

                    $available_hours = array_merge($available_hours, $provider_available_hours);
                }

                $available_hours = array_unique(array_values($available_hours));

                sort($available_hours);

                $response = $available_hours;
            } else {
                $provider = $this->providers_model->find($provider_id);

                $response = $this->availability->get_available_hours(
                    $selected_date,
                    $service,
                    $provider,
                    $exclude_appointment_id,
                );
            }

            json_response($response);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    /**
     * Get Unavailable Dates
     *
     * Get an array with the available dates of a specific provider, service and month of the year. Provide the
     * "provider_id", "service_id" and "selected_date" as GET parameters to the request. The "selected_date" parameter
     * must have the "Y-m-d" format.
     *
     * Outputs a JSON string with the unavailability dates. that are unavailability.
     */
    public function get_unavailable_dates(): void
    {
        try {
            $disable_booking = setting('disable_booking');

            if ($disable_booking) {
                abort(403);
            }

            $provider_id = request('provider_id');
            $service_id = request('service_id');
            $appointment_id = request('appointment_id');
            $manage_mode = filter_var(request('manage_mode'), FILTER_VALIDATE_BOOLEAN);
            $selected_date_string = request('selected_date');
            $selected_date = new DateTime($selected_date_string);
            $number_of_days_in_month = (int) $selected_date->format('t');
            $unavailable_dates = [];

            $provider_ids =
                $provider_id === ANY_PROVIDER ? $this->search_providers_by_service($service_id) : [$provider_id];

            $exclude_appointment_id = $manage_mode ? $appointment_id : null;

            // Get the service record.
            $service = $this->services_model->find($service_id);

            for ($i = 1; $i <= $number_of_days_in_month; $i++) {
                $current_date = new DateTime($selected_date->format('Y-m') . '-' . $i);

                if ($current_date < new DateTime(date('Y-m-d 00:00:00'))) {
                    // Past dates become immediately unavailability.
                    $unavailable_dates[] = $current_date->format('Y-m-d');
                    continue;
                }

                // Finding at least one slot of availability.
                foreach ($provider_ids as $current_provider_id) {
                    $provider = $this->providers_model->find($current_provider_id);

                    $available_hours = $this->availability->get_available_hours(
                        $current_date->format('Y-m-d'),
                        $service,
                        $provider,
                        $exclude_appointment_id,
                    );

                    if (!empty($available_hours)) {
                        break;
                    }
                }

                // No availability amongst all the provider.
                if (empty($available_hours)) {
                    $unavailable_dates[] = $current_date->format('Y-m-d');
                }
            }

            if (count($unavailable_dates) === $number_of_days_in_month) {
                json_response([
                    'is_month_unavailable' => true,
                ]);

                return;
            }

            json_response($unavailable_dates);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    /**
     * Get providers that serve the requested ZIP.
     */
    public function service_area_providers(): void
    {
        try {
            $service_id = (int) request('service_id');
            $raw_zip_code = trim((string) request('zip_code', ''));
            $zip_code = $raw_zip_code;
            $country_code = strtoupper(
                trim((string) request('country_code', setting('default_service_area_country', 'US'))),
            );

            $this->log_service_area_debug('request_received', [
                'service_id' => $service_id,
                'raw_zip_code' => $raw_zip_code,
                'country_code' => $country_code,
            ]);

            if (!$service_id || !$zip_code) {
                $this->log_service_area_debug('missing_required_inputs', [
                    'service_id' => $service_id,
                    'raw_zip_code' => $raw_zip_code,
                    'country_code' => $country_code,
                ]);
                json_response(['provider_ids' => []]);
                return;
            }

            $zip_code = $this->normalize_service_area_postal_code($zip_code, $country_code);
            if ($zip_code === '') {
                $this->log_service_area_debug('normalized_zip_empty', [
                    'service_id' => $service_id,
                    'raw_zip_code' => $raw_zip_code,
                    'country_code' => $country_code,
                ]);
                json_response(['provider_ids' => []]);
                return;
            }

            $this->log_service_area_debug('zip_normalized', [
                'service_id' => $service_id,
                'raw_zip_code' => $raw_zip_code,
                'normalized_zip_code' => $zip_code,
                'country_code' => $country_code,
            ]);

            $service = $this->services_model->find($service_id);
            $service_area_only = filter_var($service['service_area_only'] ?? false, FILTER_VALIDATE_BOOLEAN);

            if (!$service_area_only) {
                $this->log_service_area_debug('service_not_service_area_only', [
                    'service_id' => $service_id,
                    'normalized_zip_code' => $zip_code,
                    'country_code' => $country_code,
                ]);
                json_response(['provider_ids' => []]);
                return;
            }

            $provider_ids = $this->provider_service_area_zips_model
                ->get_provider_ids_for_zip($country_code, $zip_code);

            $this->log_service_area_debug('country_zip_match_result', [
                'service_id' => $service_id,
                'normalized_zip_code' => $zip_code,
                'country_code' => $country_code,
                'provider_ids' => $provider_ids,
            ]);

            if (empty($provider_ids)) {
                // If the default country does not match the stored ZIP country, retry by postal code only.
                $provider_ids = $this->provider_service_area_zips_model->get_provider_ids_for_postal_code($zip_code);
                $this->log_service_area_debug('postal_code_only_fallback_result', [
                    'service_id' => $service_id,
                    'normalized_zip_code' => $zip_code,
                    'country_code' => $country_code,
                    'provider_ids' => $provider_ids,
                ]);
            }

            if (empty($provider_ids)) {
                $zip_exists = $this->service_area_zips_model->find_by_postal_code($country_code, $zip_code)
                    ?: $this->service_area_zips_model->find_by_postal_code_any_country($zip_code);
                $has_provider_assignments = $this->provider_service_area_zips_model->has_any_assignments();

                $this->log_service_area_debug('no_direct_provider_match', [
                    'service_id' => $service_id,
                    'normalized_zip_code' => $zip_code,
                    'country_code' => $country_code,
                    'zip_exists' => (bool) $zip_exists,
                    'has_provider_assignments' => $has_provider_assignments,
                ]);

                // Backward compatibility: before provider ZIP assignment is configured,
                // treat configured service-area ZIPs as available for all service providers.
                if ($zip_exists && !$has_provider_assignments) {
                    $provider_ids = $this->search_providers_by_service($service_id);
                    $this->log_service_area_debug('fallback_all_service_providers', [
                        'service_id' => $service_id,
                        'normalized_zip_code' => $zip_code,
                        'country_code' => $country_code,
                        'provider_ids' => $provider_ids,
                    ]);
                }
            }

            $provider_ids = array_values(array_unique(array_map('intval', $provider_ids)));

            $this->log_service_area_debug('response_ready', [
                'service_id' => $service_id,
                'normalized_zip_code' => $zip_code,
                'country_code' => $country_code,
                'provider_ids' => $provider_ids,
            ]);

            json_response(['provider_ids' => $provider_ids]);
        } catch (Throwable $e) {
            $this->log_service_area_debug('exception', [
                'message' => $e->getMessage(),
            ]);
            json_exception($e);
        }
    }

    protected function normalize_service_area_postal_code(string $postal_code, string $country_code): string
    {
        $postal_code = strtoupper(trim($postal_code));
        $country_code = strtoupper(trim($country_code));

        if ($postal_code === '') {
            return '';
        }

        // Normalize separators for formats like "92104-1234" or "M5V 2T6".
        $postal_code = preg_replace('/\s+/', '', $postal_code);

        if ($country_code === 'US') {
            if (preg_match('/^(\d{5})-\d{4}$/', $postal_code, $matches)) {
                return $matches[1];
            }

            if (preg_match('/^\d{9}$/', $postal_code)) {
                return substr($postal_code, 0, 5);
            }
        }

        return $postal_code;
    }

    protected function log_service_area_debug(string $event, array $context = []): void
    {
        $payload = json_encode(
            array_merge(
                ['event' => $event],
                $context
            ),
            JSON_UNESCAPED_SLASHES
        );

        if ($payload === false) {
            $payload = '{"event":"log_encoding_failed"}';
        }

        log_message('debug', '[ServiceAreaProviders] ' . $payload);
    }

    /**
     * Search for any provider that can handle the requested service.
     *
     * This method will return the database ID of the providers affected to the requested service.
     *
     * @param int $service_id The requested service ID.
     *
     * @return array Returns the ID of the provider that can provide the requested service.
     */
    protected function search_providers_by_service(int $service_id): array
    {
        $available_providers = $this->providers_model->get_available_providers(true);
        $provider_list = [];

        foreach ($available_providers as $provider) {
            foreach ($provider['services'] as $provider_service_id) {
                if ($provider_service_id === $service_id) {
                    // Check if the provider is affected to the selected service.
                    $provider_list[] = $provider['id'];
                }
            }
        }

        return $provider_list;
    }
}
