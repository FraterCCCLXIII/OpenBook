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
 * Customer account controller.
 *
 * @package Controllers
 */
class Customer_account extends EA_Controller
{
    protected array $allowed_customer_fields = [
        'first_name',
        'last_name',
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
        'notes',
    ];

    public function __construct()
    {
        parent::__construct();

        $this->load->model('customers_model');
        $this->load->model('customer_auth_model');
        $this->load->model('customer_otp_model');
        $this->load->model('custom_fields_model');
        $this->load->model('customer_custom_field_values_model');
        $this->load->model('appointments_model');
        $this->load->model('form_assignments_model');
        $this->load->model('forms_model');
        $this->load->library('activity_audit');
        $this->load->library('timezones');
        $this->load->library('stripe_gateway');
        $this->load->library('email_messages');
    }

    public function index(): void
    {
        $customer = $this->require_customer();

        $theme = request('theme', setting('theme', 'default'));

        if (empty($theme) || !file_exists(__DIR__ . '/../../assets/css/themes/' . $theme . '.min.css')) {
            $theme = 'default';
        }

        $flash = session('customer_flash');
        session(['customer_flash' => null]);

        $appointments = $this->appointments_model->get([
            'id_users_customer' => $customer['id'],
            'payment_status !=' => 'not-paid',
        ]);

        $custom_fields = $this->custom_fields_model->find_displayed();
        $custom_field_values = $this->customer_custom_field_values_model->find_for_user((int) $customer['id']);

        html_vars([
            'page_title' => 'My Account',
            'theme' => $theme,
            'company_name' => setting('company_name'),
            'company_logo' => setting('company_logo'),
            'company_color' => setting('company_color'),
            'display_booking_header' => false,
            'customer' => $customer,
            'profile_incomplete' => !$this->is_profile_complete($customer),
            'flash' => $flash,
            'complete_profile' => request('complete') === '1',
            'grouped_timezones' => $this->timezones->to_grouped_array(),
            'appointments' => $appointments,
            'stripe_enabled' => $this->stripe_gateway->is_enabled(),
            'show_customer_forms_link' => $this->has_customer_forms(),
            'custom_fields' => $custom_fields,
            'custom_field_values' => $custom_field_values,
            'customer_login_mode' => customer_login_mode(),
        ]);

        $this->load->view('pages/customer_account');
    }

    public function stripe_portal(): void
    {
        try {
            $customer = $this->require_customer();

            if (empty($customer['stripe_customer_id'])) {
                throw new RuntimeException('No Stripe customer ID found.');
            }

            $session = $this->stripe_gateway->create_portal_session($customer['stripe_customer_id']);
            redirect($session->url);
        } catch (Throwable $e) {
            session([
                'customer_flash' => [
                    'type' => 'danger',
                    'message' => 'Could not open billing portal: ' . $e->getMessage(),
                ],
            ]);
            redirect('customer/account');
        }
    }

    public function update_profile(): void
    {
        try {
            $customer = $this->require_customer();
            $input = request('customer');

            if (!is_array($input)) {
                throw new InvalidArgumentException('Invalid customer data.');
            }

            $updated = array_merge($customer, $input);
            $updated['id'] = $customer['id'];
            $before = $customer;

            $this->customers_model->only($updated, array_merge($this->allowed_customer_fields, ['id', 'email']));

            $this->customers_model->save($updated);
            $after = $this->customers_model->find((int) $customer['id']);

            $custom_fields = request('custom_fields', []);
            if (is_array($custom_fields)) {
                $this->customer_custom_field_values_model->save_for_user(
                    (int) $customer['id'],
                    $custom_fields
                );
            }

            $this->activity_audit->log('customer.profile.updated', 'customer', (string) $customer['id'], [
                'customer_id' => (int) $customer['id'],
                'changes' => $this->activity_audit->build_field_changes($before, $after, ['update_datetime']),
            ]);

            session([
                'customer_flash' => [
                    'type' => 'success',
                    'message' => 'Account details updated.',
                ],
            ]);

            redirect('customer/account');
        } catch (Throwable $e) {
            session([
                'customer_flash' => [
                    'type' => 'danger',
                    'message' => $e->getMessage(),
                ],
            ]);

            redirect('customer/account');
        }
    }

    public function update_email(): void
    {
        try {
            $this->require_customer();
            throw new RuntimeException('Email changes require OTP verification.');
        } catch (Throwable $e) {
            session([
                'customer_flash' => [
                    'type' => 'danger',
                    'message' => $e->getMessage(),
                ],
            ]);

            redirect('customer/account');
        }
    }

    public function request_email_change_otp(): void
    {
        try {
            $customer = $this->require_customer();
            rate_limit($this->input->ip_address(), 10, 120);

            $new_email = trim((string) request('email'));

            if (empty($new_email)) {
                throw new InvalidArgumentException('Email is required.');
            }

            if (!filter_var($new_email, FILTER_VALIDATE_EMAIL)) {
                throw new InvalidArgumentException('Invalid email address provided.');
            }

            if (strcasecmp($new_email, (string) $customer['email']) === 0) {
                throw new InvalidArgumentException('Email matches the current address.');
            }

            $existing = $this->customer_auth_model->find_by_email($new_email);
            if (!empty($existing)) {
                throw new InvalidArgumentException('The provided email address is already in use.');
            }

            $code = $this->customer_otp_model->request_code($new_email);

            if (!filter_var(setting('customer_login_otp_notifications', '1'), FILTER_VALIDATE_BOOLEAN)) {
                throw new RuntimeException('Customer login email notifications are disabled.');
            }

            $company_color = setting('company_color');
            $settings = [
                'company_name' => setting('company_name'),
                'company_link' => setting('company_link'),
                'company_email' => setting('company_email'),
                'company_color' =>
                    !empty($company_color) && $company_color != DEFAULT_COMPANY_COLOR ? $company_color : null,
            ];

            $this->email_messages->send_customer_login_otp($code, $new_email, $settings);

            session([
                'customer_email_change_pending' => $new_email,
            ]);

            json_response(['success' => true]);
        } catch (RuntimeException $e) {
            $remaining = $this->customer_otp_model->get_lockout_remaining_seconds((string) request('email'));
            if ($remaining > 0) {
                json_response([
                    'success' => false,
                    'message' => $e->getMessage(),
                    'lockout_remaining_seconds' => $remaining,
                ], 429);

                return;
            }

            json_exception($e);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    public function confirm_email_change_otp(): void
    {
        try {
            $customer = $this->require_customer();
            rate_limit($this->input->ip_address(), 10, 120);
            $auth = $this->customer_auth_model->find_by_customer_id($customer['id']);

            if (empty($auth)) {
                throw new RuntimeException('Customer account was not found.');
            }

            $code = trim((string) request('code'));
            $new_email = session('customer_email_change_pending');

            if (empty($new_email) || empty($code)) {
                throw new InvalidArgumentException('Email and code are required.');
            }

            $this->customer_otp_model->verify_code($new_email, $code);

            $this->db->where('id', $customer['id'])->update('users', [
                'email' => $new_email,
                'update_datetime' => date('Y-m-d H:i:s'),
            ]);

            $this->customer_auth_model->save([
                'id' => $auth['id'],
                'email' => $new_email,
            ]);

            session([
                'customer_email' => $new_email,
                'customer_email_change_pending' => null,
            ]);

            $this->activity_audit->log('customer.email.updated', 'customer', (string) $customer['id'], [
                'customer_id' => (int) $customer['id'],
            ]);

            json_response(['success' => true]);
        } catch (RuntimeException $e) {
            $remaining = $this->customer_otp_model->get_lockout_remaining_seconds((string) session('customer_email_change_pending'));
            if ($remaining > 0) {
                json_response([
                    'success' => false,
                    'message' => $e->getMessage(),
                    'lockout_remaining_seconds' => $remaining,
                ], 429);

                return;
            }

            json_exception($e);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    public function request_password_change_otp(): void
    {
        try {
            if (customer_login_mode() === 'otp') {
                throw new RuntimeException('Password changes are disabled.');
            }

            $customer = $this->require_customer();
            rate_limit($this->input->ip_address(), 10, 120);

            $new_password = (string) request('new_password');
            $confirm_password = (string) request('confirm_password');

            if (empty($new_password) || empty($confirm_password)) {
                throw new InvalidArgumentException('Both password fields are required.');
            }

            if ($new_password !== $confirm_password) {
                throw new InvalidArgumentException('Passwords do not match.');
            }

            if (strlen($new_password) < MIN_PASSWORD_LENGTH || strlen($new_password) > MAX_PASSWORD_LENGTH) {
                throw new InvalidArgumentException('Password length is invalid.');
            }

            $code = $this->customer_otp_model->request_code($customer['email']);

            if (!filter_var(setting('customer_login_otp_notifications', '1'), FILTER_VALIDATE_BOOLEAN)) {
                throw new RuntimeException('Customer login email notifications are disabled.');
            }

            $company_color = setting('company_color');
            $settings = [
                'company_name' => setting('company_name'),
                'company_link' => setting('company_link'),
                'company_email' => setting('company_email'),
                'company_color' =>
                    !empty($company_color) && $company_color != DEFAULT_COMPANY_COLOR ? $company_color : null,
            ];

            $this->email_messages->send_customer_login_otp($code, $customer['email'], $settings);

            session([
                'customer_password_change_hash' => password_hash($new_password, PASSWORD_DEFAULT),
            ]);

            json_response(['success' => true]);
        } catch (RuntimeException $e) {
            $customer = $customer ?? $this->require_customer();
            $remaining = $this->customer_otp_model->get_lockout_remaining_seconds((string) ($customer['email'] ?? ''));
            if ($remaining > 0) {
                json_response([
                    'success' => false,
                    'message' => $e->getMessage(),
                    'lockout_remaining_seconds' => $remaining,
                ], 429);

                return;
            }

            json_exception($e);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    public function confirm_password_change_otp(): void
    {
        try {
            if (customer_login_mode() === 'otp') {
                throw new RuntimeException('Password changes are disabled.');
            }

            $customer = $this->require_customer();
            rate_limit($this->input->ip_address(), 10, 120);
            $auth = $this->customer_auth_model->find_by_customer_id($customer['id']);

            if (empty($auth)) {
                throw new RuntimeException('Customer account was not found.');
            }

            $code = trim((string) request('code'));
            $password_hash = session('customer_password_change_hash');

            if (empty($code) || empty($password_hash)) {
                throw new InvalidArgumentException('Verification code is required.');
            }

            $this->customer_otp_model->verify_code($customer['email'], $code);

            $this->customer_auth_model->save([
                'id' => $auth['id'],
                'password_hash' => $password_hash,
                'password_updated_at' => date('Y-m-d H:i:s'),
                'failed_attempts' => 0,
                'locked_until' => null,
            ]);

            session([
                'customer_password_change_hash' => null,
            ]);

            $this->activity_audit->log('customer.password.updated', 'customer', (string) $customer['id'], [
                'customer_id' => (int) $customer['id'],
            ]);

            json_response(['success' => true]);
        } catch (RuntimeException $e) {
            $customer = $customer ?? $this->require_customer();
            $remaining = $this->customer_otp_model->get_lockout_remaining_seconds((string) ($customer['email'] ?? ''));
            if ($remaining > 0) {
                json_response([
                    'success' => false,
                    'message' => $e->getMessage(),
                    'lockout_remaining_seconds' => $remaining,
                ], 429);

                return;
            }

            json_exception($e);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    public function update_password(): void
    {
        try {
            $this->require_customer();
            throw new RuntimeException('Password changes require OTP verification.');
        } catch (Throwable $e) {
            session([
                'customer_flash' => [
                    'type' => 'danger',
                    'message' => $e->getMessage(),
                ],
            ]);

            redirect('customer/account');
        }
    }

    protected function require_customer(): array
    {
        if (!customer_logged_in()) {
            session(['customer_return_url' => current_url()]);
            redirect('customer/login');
            exit;
        }

        $customer = $this->customers_model->find(customer_id());

        if (empty($customer)) {
            $this->session->unset_userdata(['customer_id', 'customer_email']);
            redirect('customer/login');
            exit;
        }

        if (customer_login_mode() === 'password') {
            $auth = $this->customer_auth_model->find_by_customer_id((int) $customer['id']);
            if (empty($auth) || empty($auth['password_hash'])) {
                session(['customer_return_url' => current_url()]);
                redirect('customer/create_password');
                exit;
            }
        }

        return $customer;
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

    protected function is_profile_complete(array $customer): bool
    {
        $custom_fields = $this->custom_fields_model->find_displayed();
        $custom_field_values = $this->customer_custom_field_values_model->find_for_user((int) $customer['id']);

        return $this->customers_model->is_profile_complete($customer, $custom_fields, $custom_field_values);
    }
}
