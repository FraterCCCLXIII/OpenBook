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
 * Customer bookings controller.
 *
 * @package Controllers
 */
class Customer_bookings extends EA_Controller
{
    public function __construct()
    {
        parent::__construct();

        $this->load->model('appointments_model');
        $this->load->model('services_model');
        $this->load->model('providers_model');
        $this->load->model('customers_model');
        $this->load->model('customer_auth_model');
        $this->load->model('form_assignments_model');
        $this->load->model('forms_model');
    }

    public function index(): void
    {
        $customer = $this->require_customer();

        $theme = request('theme', setting('theme', 'default'));

        if (empty($theme) || !file_exists(__DIR__ . '/../../assets/css/themes/' . $theme . '.min.css')) {
            $theme = 'default';
        }

        $appointments = $this->appointments_model->get(
            ['id_users_customer' => $customer['id']],
            null,
            null,
            'start_datetime DESC',
        );

        $rows = [];

        foreach ($appointments as $appointment) {
            $service = $this->services_model->find($appointment['id_services']);
            $provider = $this->providers_model->find($appointment['id_users_provider']);

            $rows[] = [
                'appointment' => $appointment,
                'service' => $service,
                'provider' => $provider,
            ];
        }

        html_vars([
            'page_title' => 'My Bookings',
            'theme' => $theme,
            'company_name' => setting('company_name'),
            'company_logo' => setting('company_logo'),
            'company_color' => setting('company_color'),
            'display_booking_header' => false,
            'appointments' => $rows,
            'date_format' => setting('date_format'),
            'time_format' => setting('time_format'),
            'show_customer_forms_link' => $this->has_customer_forms(),
        ]);

        $this->load->view('pages/customer_bookings');
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
}
