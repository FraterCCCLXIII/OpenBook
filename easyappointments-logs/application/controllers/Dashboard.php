<?php defined('BASEPATH') or exit('No direct script access allowed');

class Dashboard extends EA_Controller
{
    public function __construct()
    {
        parent::__construct();
        $this->load->model('customers_model');
        $this->load->model('form_assignments_model');
        $this->load->model('forms_model');
        $this->load->model('form_submissions_model');
        $this->load->model('custom_fields_model');
        $this->load->model('customer_custom_field_values_model');
    }

    public function index(): void
    {
        if (!customer_logged_in()) {
            session(['customer_return_url' => current_url()]);
            redirect('customer/login');
            return;
        }

        $customer = $this->customers_model->find(customer_id());
        $custom_fields = $this->custom_fields_model->find_displayed();
        $custom_field_values = $this->customer_custom_field_values_model->find_for_user((int) $customer['id']);
        $onboarding_items = $this->build_onboarding_items($customer, $custom_fields, $custom_field_values);
        $has_incomplete = (bool) array_filter(
            $onboarding_items,
            fn (array $item) => empty($item['complete'])
        );

        html_vars([
            'page_title' => 'Dashboard',
            'company_name' => setting('company_name'),
            'company_logo' => setting('company_logo'),
            'company_color' => setting('company_color'),
            'customer' => $customer,
            'theme' => setting('theme', 'default'),
            'display_booking_header' => false,
            'onboarding_items' => $onboarding_items,
            'show_onboarding' => $has_incomplete,
        ]);

        $this->load->view('pages/dashboard');
    }

    protected function build_onboarding_items(
        array $customer,
        array $custom_fields,
        array $custom_field_values
    ): array
    {
        $items = [];
        $items[] = [
            'label' => 'Complete Profile',
            'complete' => $this->customers_model->is_profile_complete(
                $customer,
                $custom_fields,
                $custom_field_values
            ),
            'url' => site_url('customer/account?complete=1'),
            'type' => 'profile',
        ];

        $items = array_merge($items, $this->get_form_onboarding_items((int) ($customer['id'] ?? 0)));

        return $items;
    }

    protected function get_form_onboarding_items(int $customer_id): array
    {
        if (!$customer_id) {
            return [];
        }

        $assigned_rows = $this->form_assignments_model->find_for_role(DB_SLUG_CUSTOMER);
        if (!$assigned_rows) {
            return [];
        }

        $form_ids = array_map(fn ($row) => (int) $row['id_forms'], $assigned_rows);
        $forms = $this->forms_model->find_by_ids($form_ids, true);
        if (!$forms) {
            return [];
        }

        $items = [];
        foreach ($forms as $form) {
            $form_id = (int) ($form['id'] ?? 0);
            if (!$form_id) {
                continue;
            }

            $submission = $this->form_submissions_model->find_for_user($form_id, $customer_id);
            $slug = $form['slug'] ?? (string) $form_id;

            $items[] = [
                'label' => $form['name'] ?? 'Form',
                'complete' => (bool) $submission,
                'url' => site_url('customer/forms/' . $slug),
                'type' => 'form',
            ];
        }

        return $items;
    }
}
