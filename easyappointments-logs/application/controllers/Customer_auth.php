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
 * Customer authentication controller.
 *
 * @package Controllers
 */
class Customer_auth extends EA_Controller
{
    protected int $max_failed_attempts = 5;
    protected int $lockout_minutes = 15;

    public function __construct()
    {
        parent::__construct();

        $this->load->model('customers_model');
        $this->load->model('customer_auth_model');
        $this->load->model('customer_otp_model');
        $this->load->model('form_assignments_model');
        $this->load->model('forms_model');
        $this->load->model('form_submissions_model');
        $this->load->model('settings_model');
        $this->load->library('audit_log');
        $this->load->library('email_messages');
    }

    /**
     * Render the customer login/registration page.
     */
    public function login(): void
    {
        if (customer_logged_in()) {
            redirect('dashboard');
            return;
        }

        if (request('reset_otp')) {
            session([
                'customer_otp_pending' => null,
                'customer_otp_pending_email' => null,
                'customer_otp_pending_intent' => null,
                'customer_auth_mode' => null,
            ]);
        }

        $theme = request('theme', setting('theme', 'default'));

        if (empty($theme) || !file_exists(__DIR__ . '/../../assets/css/themes/' . $theme . '.min.css')) {
            $theme = 'default';
        }

        html_vars([
            'page_title' => 'Customer Login',
            'theme' => $theme,
            'company_name' => setting('company_name'),
            'company_logo' => setting('company_logo'),
            'company_color' => setting('company_color'),
            'display_booking_header' => false,
            'booking_wizard_max_width' => 'max-w-sm',
            'auth_error' => session('customer_auth_error'),
            'auth_mode' => session('customer_auth_mode'),
            'login_mode' => $this->get_login_mode(),
            'otp_pending' => session('customer_otp_pending'),
            'otp_pending_email' => session('customer_otp_pending_email'),
            'otp_pending_intent' => session('customer_otp_pending_intent'),
        ]);

        session(['customer_auth_error' => null, 'customer_auth_mode' => null]);

        $this->load->view('pages/customer_auth');
    }

    /**
     * Authenticate a customer.
     */
    public function authenticate(): void
    {
        try {
            rate_limit($this->input->ip_address(), 30, 120);

            if ($this->get_login_mode() !== 'password') {
                throw new RuntimeException('Password login is currently disabled.');
            }

            $email = trim((string) request('email'));
            $password = (string) request('password');

            if (empty($email) || empty($password)) {
                throw new InvalidArgumentException('Email and password are required.');
            }

            $auth = $this->customer_auth_model->find_by_email($email);

            if (empty($auth) || $auth['status'] !== 'active') {
                throw new InvalidArgumentException('Invalid credentials provided.');
            }

            if (!empty($auth['locked_until']) && strtotime($auth['locked_until']) > time()) {
                throw new RuntimeException('Account is temporarily locked. Please try again later.');
            }

            if (empty($auth['password_hash'])) {
                throw new RuntimeException('Password is required for this account.');
            }

            if (!password_verify($password, $auth['password_hash'])) {
                $failed_attempts = $auth['failed_attempts'] + 1;
                $update = [
                    'id' => $auth['id'],
                    'failed_attempts' => $failed_attempts,
                ];

                if ($failed_attempts >= $this->max_failed_attempts) {
                    $update['locked_until'] = date('Y-m-d H:i:s', strtotime('+' . $this->lockout_minutes . ' minutes'));
                }

                $this->customer_auth_model->save($update);

                throw new InvalidArgumentException('Invalid credentials provided.');
            }

            $is_first_login = empty($auth['last_login_at']);

            $this->customer_auth_model->save([
                'id' => $auth['id'],
                'failed_attempts' => 0,
                'locked_until' => null,
                'last_login_at' => date('Y-m-d H:i:s'),
            ]);

            $this->session->sess_regenerate();

            session([
                'customer_id' => $auth['customer_id'],
                'customer_email' => $auth['email'],
            ]);

            $this->audit_log->write('customer.login.success', [
                'customer_id' => (int) $auth['customer_id'],
            ]);

            if ($is_first_login) {
                $this->send_profile_completion_email((int) $auth['customer_id'], (string) $auth['email']);
            }

            $return_url = $this->resolve_login_redirect($is_first_login);
            session(['customer_return_url' => null]);

            redirect($return_url);
        } catch (Throwable $e) {
            $this->audit_log->write('customer.login.failed', [
                'reason' => $e->getMessage(),
            ]);

            session([
                'customer_auth_error' => $e->getMessage(),
                'customer_auth_mode' => 'login',
            ]);

            redirect('customer/login');
        }
    }

    /**
     * Register a new customer account.
     */
    public function register(): void
    {
        try {
            rate_limit($this->input->ip_address(), 20, 120);

            if ($this->get_login_mode() !== 'password') {
                throw new RuntimeException('Password login is currently disabled.');
            }

            $email = trim((string) request('email'));
            $password = (string) request('password');
            $password_confirm = (string) request('password_confirm');

            if (empty($email) || empty($password) || empty($password_confirm)) {
                throw new InvalidArgumentException('Email and password are required.');
            }

            if ($password !== $password_confirm) {
                throw new InvalidArgumentException('Passwords do not match.');
            }

            if (strlen($password) < MIN_PASSWORD_LENGTH || strlen($password) > MAX_PASSWORD_LENGTH) {
                throw new InvalidArgumentException('Password length is invalid.');
            }

            $customer_data = [
                'email' => $email,
            ];

            if ($this->customers_model->exists($customer_data)) {
                $customer_id = $this->customers_model->find_record_id($customer_data);
            } else {
                $customer_id = $this->customers_model->create_shell($customer_data);
            }

            $password_hash = password_hash($password, PASSWORD_DEFAULT);

            $this->customer_auth_model->save([
                'customer_id' => $customer_id,
                'email' => $email,
                'password_hash' => $password_hash,
                'status' => 'active',
                'password_updated_at' => date('Y-m-d H:i:s'),
            ]);

            $this->session->sess_regenerate();

            session([
                'customer_id' => $customer_id,
                'customer_email' => $email,
            ]);

            $this->audit_log->write('customer.register', [
                'customer_id' => (int) $customer_id,
            ]);

            $this->send_profile_completion_email((int) $customer_id, $email);

            $return_url = $this->resolve_login_redirect(true);
            session(['customer_return_url' => null]);

            redirect($return_url);
        } catch (Throwable $e) {
            $this->audit_log->write('customer.register.failed', [
                'reason' => $e->getMessage(),
            ]);

            session([
                'customer_auth_error' => $e->getMessage(),
                'customer_auth_mode' => 'register',
            ]);

            redirect('customer/login');
        }
    }

    /**
     * Log out a customer.
     */
    public function logout(): void
    {
        $this->session->unset_userdata(['customer_id', 'customer_email']);
        redirect('customer/login');
    }

    public function request_otp(): void
    {
        try {
            rate_limit($this->input->ip_address(), 10, 120);

            if (!filter_var(setting('customer_login_otp_notifications', '1'), FILTER_VALIDATE_BOOLEAN)) {
                throw new RuntimeException('Customer login email notifications are disabled.');
            }

            $login_mode = $this->get_login_mode();

            $email = trim((string) request('email'));
            $intent = request('intent', 'login');

            if (empty($email)) {
                throw new InvalidArgumentException('Email is required.');
            }

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw new InvalidArgumentException('Invalid email address provided.');
            }

            $auth = $this->customer_auth_model->find_by_email($email);
            $allow_otp = in_array($login_mode, ['otp', 'none'], true)
                || ($login_mode === 'password' && (!empty($auth) && empty($auth['password_hash'])));

            if (!$allow_otp) {
                throw new RuntimeException('Password login is required for this account.');
            }

            $code = $this->customer_otp_model->request_code($email);

            $company_color = setting('company_color');
            $settings = [
                'company_name' => setting('company_name'),
                'company_link' => setting('company_link'),
                'company_email' => setting('company_email'),
                'company_logo_email_png' => setting('company_logo_email_png'),
                'company_color' =>
                    !empty($company_color) && $company_color != DEFAULT_COMPANY_COLOR ? $company_color : null,
            ];

            $this->email_messages->send_customer_login_otp($code, $email, $settings);

            session([
                'customer_otp_pending' => true,
                'customer_otp_pending_email' => $email,
                'customer_otp_pending_intent' => $intent,
                'customer_auth_mode' => $intent === 'login' ? 'login' : 'register',
            ]);

            $this->audit_log->write('customer.otp.requested', [
                'intent' => $intent,
                'email' => $email,
            ]);

            redirect('customer/login');
        } catch (Throwable $e) {
            $this->audit_log->write('customer.otp.request_failed', [
                'reason' => $e->getMessage(),
            ]);

            session([
                'customer_auth_error' => $e->getMessage(),
                'customer_auth_mode' => request('intent', 'login') === 'login' ? 'login' : 'register',
            ]);

            redirect('customer/login');
        }
    }

    public function verify_otp(): void
    {
        try {
            rate_limit($this->input->ip_address(), 10, 120);

            $login_mode = $this->get_login_mode();

            $email = trim((string) request('email'));
            $code = trim((string) request('code'));

            if (empty($email) || empty($code)) {
                throw new InvalidArgumentException('Email and code are required.');
            }

            $auth = $this->customer_auth_model->find_by_email($email);
            $created_account = false;

            if ($login_mode === 'password' && !empty($auth) && !empty($auth['password_hash'])) {
                throw new RuntimeException('Password login is required for this account.');
            }

            $this->customer_otp_model->verify_code($email, $code);

            if (empty($auth)) {
                $customer_data = [
                    'email' => $email,
                ];

                if ($this->customers_model->exists($customer_data)) {
                    $customer_id = $this->customers_model->find_record_id($customer_data);
                } else {
                    $customer_id = $this->customers_model->create_shell($customer_data);
                }

                $this->customer_auth_model->save([
                    'customer_id' => $customer_id,
                    'email' => $email,
                    'password_hash' => '',
                    'status' => 'active',
                ]);

                $auth = $this->customer_auth_model->find_by_email($email);
                $created_account = true;
            }

            if (empty($auth) || $auth['status'] !== 'active') {
                throw new RuntimeException('Customer account is unavailable.');
            }

            $is_first_login = $created_account || empty($auth['last_login_at']);

            $this->session->sess_regenerate();

            session([
                'customer_id' => $auth['customer_id'],
                'customer_email' => $auth['email'],
                'customer_otp_pending' => null,
                'customer_otp_pending_email' => null,
                'customer_otp_pending_intent' => null,
            ]);

            $this->audit_log->write('customer.otp.verified', [
                'intent' => $login_mode,
                'customer_id' => (int) $auth['customer_id'],
            ]);

            $this->customer_auth_model->save([
                'id' => $auth['id'],
                'last_login_at' => date('Y-m-d H:i:s'),
            ]);

            if ($is_first_login) {
                $this->send_profile_completion_email((int) $auth['customer_id'], (string) $auth['email']);
            }

            if ($login_mode === 'password' && empty($auth['password_hash'])) {
                session(['customer_password_required' => true]);
                redirect('customer/create_password');
                return;
            }

            $return_url = $this->resolve_login_redirect($is_first_login);
            session(['customer_return_url' => null]);

            redirect($return_url);
        } catch (Throwable $e) {
            $this->audit_log->write('customer.otp.verify_failed', [
                'reason' => $e->getMessage(),
            ]);

            session([
                'customer_auth_error' => $e->getMessage(),
                'customer_auth_mode' => request('intent', 'login') === 'login' ? 'login' : 'register',
            ]);

            redirect('customer/login');
        }
    }

    public function create_password(): void
    {
        if (!customer_logged_in()) {
            session(['customer_return_url' => current_url()]);
            redirect('customer/login');
            return;
        }

        $auth = $this->customer_auth_model->find_by_customer_id(customer_id());

        if (!empty($auth) && !empty($auth['password_hash'])) {
            redirect(session('customer_return_url') ?: site_url('dashboard'));
            return;
        }

        $theme = request('theme', setting('theme', 'default'));

        if (empty($theme) || !file_exists(__DIR__ . '/../../assets/css/themes/' . $theme . '.min.css')) {
            $theme = 'default';
        }

        html_vars([
            'page_title' => 'Create Password',
            'theme' => $theme,
            'company_name' => setting('company_name'),
            'company_logo' => setting('company_logo'),
            'company_color' => setting('company_color'),
            'display_booking_header' => false,
            'auth_error' => session('customer_auth_error'),
        ]);

        session(['customer_auth_error' => null]);

        $this->load->view('pages/customer_create_password');
    }

    public function save_password(): void
    {
        try {
            if (!customer_logged_in()) {
                redirect('customer/login');
                return;
            }

            if ($this->get_login_mode() !== 'password') {
                throw new RuntimeException('Password creation is currently disabled.');
            }

            $customer = $this->customers_model->find(customer_id());

            if (empty($customer)) {
                $this->session->unset_userdata(['customer_id', 'customer_email']);
                redirect('customer/login');
                return;
            }

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

            $auth = $this->customer_auth_model->find_by_customer_id((int) $customer['id']);

            if (empty($auth)) {
                $this->customer_auth_model->save([
                    'customer_id' => $customer['id'],
                    'email' => $customer['email'],
                    'password_hash' => password_hash($new_password, PASSWORD_DEFAULT),
                    'status' => 'active',
                    'password_updated_at' => date('Y-m-d H:i:s'),
                ]);
            } else {
                $this->customer_auth_model->save([
                    'id' => $auth['id'],
                    'password_hash' => password_hash($new_password, PASSWORD_DEFAULT),
                    'password_updated_at' => date('Y-m-d H:i:s'),
                    'failed_attempts' => 0,
                    'locked_until' => null,
                ]);
            }

            session(['customer_password_required' => null]);

            $return_url = session('customer_return_url') ?: site_url('dashboard');
            session(['customer_return_url' => null]);

            redirect($return_url);
        } catch (Throwable $e) {
            session([
                'customer_auth_error' => $e->getMessage(),
            ]);

            redirect('customer/create_password');
        }
    }

    protected function get_login_mode(): string
    {
        $mode = setting('customer_login_mode', 'password');

        if (!in_array($mode, ['none', 'password', 'otp'], true)) {
            return 'password';
        }

        return $mode;
    }

    protected function resolve_login_redirect(bool $is_first_login): string
    {
        $return_url = session('customer_return_url');

        if (!empty($return_url)) {
            if (!$is_first_login || !$this->is_profile_redirect($return_url)) {
                return $return_url;
            }
        }

        if ($is_first_login) {
            return site_url('booking');
        }

        return site_url('dashboard');
    }

    protected function is_profile_redirect(string $url): bool
    {
        $path = parse_url($url, PHP_URL_PATH) ?: '';

        return str_contains($path, '/customer/account');
    }

    protected function send_profile_completion_email(int $customer_id, string $recipient_email): void
    {
        if (empty($recipient_email)) {
            return;
        }

        if (!filter_var(setting('customer_profile_completion_notifications', '1'), FILTER_VALIDATE_BOOLEAN)) {
            return;
        }

        $forms = $this->get_incomplete_forms($customer_id);

        $settings = [
            'company_name' => setting('company_name'),
            'company_link' => setting('company_link'),
            'company_email' => setting('company_email'),
            'company_logo_email_png' => setting('company_logo_email_png'),
            'company_color' => setting('company_color'),
        ];

        $account_url = site_url('customer/account?complete=1');

        $this->email_messages->send_customer_profile_completion($recipient_email, $settings, $account_url, $forms);
    }

    protected function get_incomplete_forms(int $customer_id): array
    {
        $assigned_rows = $this->form_assignments_model->find_for_role(DB_SLUG_CUSTOMER);

        if (empty($assigned_rows)) {
            return [];
        }

        $form_ids = array_map(fn ($row) => (int) $row['id_forms'], $assigned_rows);
        $forms = $this->forms_model->find_by_ids($form_ids, true);

        $incomplete = [];

        foreach ($forms as $form) {
            $submission = $this->form_submissions_model->find_for_user((int) $form['id'], $customer_id);

            if ($submission) {
                continue;
            }

            $slug = $form['slug'] ?? (string) $form['id'];
            $incomplete[] = [
                'id' => (int) $form['id'],
                'name' => $form['name'],
                'url' => site_url('customer/forms/' . $slug),
            ];
        }

        return $incomplete;
    }
}
