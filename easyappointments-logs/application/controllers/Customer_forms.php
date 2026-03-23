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
 * Customer forms controller.
 *
 * Handles customer form viewing and submissions.
 *
 * @package Controllers
 */
class Customer_forms extends EA_Controller
{
    public function __construct()
    {
        parent::__construct();

        $this->load->model('customers_model');
        $this->load->model('customer_auth_model');
        $this->load->model('form_assignments_model');
        $this->load->model('forms_model');
        $this->load->model('form_fields_model');
        $this->load->model('form_submissions_model');
        $this->load->model('form_submission_fields_model');
    }

    public function index(): void
    {
        $this->require_customer();

        $theme = request('theme', setting('theme', 'default'));

        if (empty($theme) || !file_exists(__DIR__ . '/../../assets/css/themes/' . $theme . '.min.css')) {
            $theme = 'default';
        }

        html_vars([
            'page_title' => 'My Forms',
            'theme' => $theme,
            'company_name' => setting('company_name'),
            'company_logo' => setting('company_logo'),
            'company_color' => setting('company_color'),
            'display_booking_header' => false,
            'show_customer_forms_link' => $this->has_customer_forms(),
        ]);

        $this->load->view('pages/customer_forms');
    }

    public function view(string $form_key): void
    {
        $this->require_customer();

        $theme = request('theme', setting('theme', 'default'));

        if (empty($theme) || !file_exists(__DIR__ . '/../../assets/css/themes/' . $theme . '.min.css')) {
            $theme = 'default';
        }

        $form = $this->resolve_form($form_key);

        if (!$form) {
            abort(404, 'Form not found.');
        }

        script_vars([
            'form_id' => (int) $form['id'],
        ]);

        html_vars([
            'page_title' => 'My Forms',
            'theme' => $theme,
            'company_name' => setting('company_name'),
            'company_logo' => setting('company_logo'),
            'company_color' => setting('company_color'),
            'display_booking_header' => false,
            'show_customer_forms_link' => $this->has_customer_forms(),
        ]);

        $this->load->view('pages/customer_form_view');
    }

    public function list(): void
    {
        try {
            $this->require_customer();
            $user_id = customer_id();

            $assigned_rows = $this->form_assignments_model->find_for_role(DB_SLUG_CUSTOMER);
            $form_ids = array_map(fn ($row) => $row['id_forms'], $assigned_rows);
            $forms = $this->forms_model->find_by_ids($form_ids, true);

            $indexed = [];

            foreach ($forms as $form) {
                $submission = $this->form_submissions_model->find_for_user((int) $form['id'], $user_id);
                $indexed[$form['id']] = [
                    'id' => $form['id'],
                    'name' => $form['name'],
                    'slug' => $form['slug'] ?? null,
                    'status' => $submission ? 'complete' : 'incomplete',
                    'submitted_at' => $submission['submitted_at'] ?? null,
                ];
            }

            $completed = $this->db
                ->select('form_submissions.id_forms, form_submissions.submitted_at, forms.name')
                ->from('form_submissions')
                ->join('forms', 'forms.id = form_submissions.id_forms', 'left')
                ->where('form_submissions.id_users', $user_id)
                ->get()
                ->result_array();

            foreach ($completed as $row) {
                $form_id = (int) $row['id_forms'];
                $indexed[$form_id] = [
                    'id' => $form_id,
                    'name' => $row['name'] ?? 'Form',
                    'slug' => $indexed[$form_id]['slug'] ?? null,
                    'status' => 'complete',
                    'submitted_at' => $row['submitted_at'] ?? null,
                ];
            }

            json_response(array_values($indexed));
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    public function find(): void
    {
        try {
            $this->require_customer();
            $user_id = customer_id();
            $form_id = (int) request('form_id');

            $submission = $this->form_submissions_model->find_for_user($form_id, $user_id);
            if (!$this->form_assignments_model->is_assigned($form_id, DB_SLUG_CUSTOMER) && !$submission) {
                abort(403, 'Forbidden');
            }

            $form = $this->forms_model->find($form_id);
            $fields = $this->form_fields_model->find_for_form($form_id, true);

            if ($submission) {
                $snapshot_fields = [];
                if (!empty($submission['fields_snapshot'])) {
                    $decoded = json_decode($submission['fields_snapshot'], true);
                    if (is_array($decoded)) {
                        $snapshot_fields = $decoded;
                    }
                }

                if (!$snapshot_fields) {
                    $snapshot_fields = $fields;
                }

                $responses = $this->form_submission_fields_model->find_for_submission((int) $submission['id']);
                $responses_by_field = [];
                foreach ($responses as $response) {
                    $responses_by_field[(int) $response['id_form_fields']] = $response['value'];
                }
                foreach ($snapshot_fields as &$field) {
                    $field_id = isset($field['id']) ? (int) $field['id'] : null;
                    $field['value'] = $field_id ? ($responses_by_field[$field_id] ?? '') : '';
                }
                $form['status'] = 'complete';
                $form['submitted_at'] = $submission['submitted_at'];
                $form['fields'] = $snapshot_fields;
            } else {
                $form['status'] = 'incomplete';
                $form['fields'] = $fields;
            }

            json_response($form);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    public function submit(): void
    {
        try {
            $this->require_customer();
            $user_id = customer_id();
            $form_id = (int) request('form_id');
            $responses = request('responses', []);

            if (!$this->form_assignments_model->is_assigned($form_id, DB_SLUG_CUSTOMER)) {
                abort(403, 'Forbidden');
            }

            $existing = $this->form_submissions_model->find_for_user($form_id, $user_id);
            if ($existing) {
                throw new RuntimeException('Form already completed.');
            }

            $form = $this->forms_model->find($form_id);
            $fields = $this->form_fields_model->find_for_form($form_id, true);
            if (!empty($form['content'])) {
                array_unshift($fields, [
                    'id' => null,
                    'label' => $form['content'],
                    'field_type' => 'text',
                    'is_required' => 0,
                    'sort_order' => -1,
                ]);
            }
            $input_fields = array_values(array_filter($fields, function ($field) {
                return $this->is_response_field($field);
            }));
            $responses_by_field = [];
            $fields_by_id = [];
            foreach ($input_fields as $field) {
                if (!empty($field['id'])) {
                    $fields_by_id[(int) $field['id']] = $field;
                }
            }

            foreach ($responses as $response) {
                $field_id = (int) ($response['field_id'] ?? 0);
                if (!$field_id || !isset($fields_by_id[$field_id])) {
                    continue;
                }
                $responses_by_field[$field_id] = $response['value'] ?? null;
            }

            foreach ($input_fields as $field) {
                $field_id = (int) $field['id'];
                [$normalized, $is_empty] = $this->normalize_response_value(
                    $responses_by_field[$field_id] ?? null,
                    (string) ($field['field_type'] ?? 'input')
                );
                $responses_by_field[$field_id] = $normalized;

                if ($field['is_required'] && $is_empty) {
                    throw new InvalidArgumentException('All required fields must be completed.');
                }
            }

            $this->db->trans_start();
            $snapshot_fields = array_map(function ($field) {
                return [
                    'id' => $field['id'] ?? null,
                    'label' => $field['label'] ?? '',
                    'field_type' => $field['field_type'] ?? 'input',
                    'is_required' => (int) ($field['is_required'] ?? 0),
                    'sort_order' => (int) ($field['sort_order'] ?? 0),
                    'options' => $field['options'] ?? [],
                ];
            }, $fields);

            $submission_id = $this->form_submissions_model->create(
                $form_id,
                $user_id,
                json_encode($snapshot_fields, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
            );

            $response_rows = [];
            foreach ($input_fields as $field) {
                $value = $responses_by_field[(int) $field['id']] ?? '';
                $response_rows[] = [
                    'field_id' => (int) $field['id'],
                    'value' => $value,
                ];
            }

            $this->form_submission_fields_model->insert_batch($submission_id, $response_rows);
            $this->db->trans_complete();

            json_response(['status' => 'success']);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    private function is_response_field(array $field): bool
    {
        return ($field['field_type'] ?? 'input') !== 'text';
    }

    private function normalize_response_value($value, string $field_type): array
    {
        if ($field_type === 'checkboxes') {
            $values = is_array($value) ? $value : [$value];
            $normalized = array_values(array_filter(array_map(
                fn ($item) => trim((string) $item),
                $values
            ), fn ($item) => $item !== ''));

            if (!$normalized) {
                return ['', true];
            }

            return [
                json_encode($normalized, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                false,
            ];
        }

        $string_value = is_string($value) ? trim($value) : '';

        return [$string_value, $string_value === ''];
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

    protected function resolve_form(string $form_key): ?array
    {
        if (ctype_digit($form_key)) {
            try {
                return $this->forms_model->find((int) $form_key);
            } catch (Throwable) {
                return null;
            }
        }

        return $this->forms_model->find_by_slug($form_key);
    }
}
