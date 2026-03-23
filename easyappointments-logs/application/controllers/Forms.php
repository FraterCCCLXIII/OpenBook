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
 * Forms controller.
 *
 * Handles forms management and submissions.
 *
 * @package Controllers
 */
class Forms extends EA_Controller
{
    protected array $user_type_map = [
        'customer' => DB_SLUG_CUSTOMER,
        'admin' => DB_SLUG_ADMIN,
        'provider' => DB_SLUG_PROVIDER,
        'secretary' => DB_SLUG_SECRETARY,
    ];

    public function __construct()
    {
        parent::__construct();

        $this->load->model('forms_model');
        $this->load->model('form_fields_model');
        $this->load->model('form_assignments_model');
        $this->load->model('form_submissions_model');
        $this->load->model('form_submission_fields_model');
        $this->load->model('roles_model');
        $this->load->model('users_model');
        $this->load->model('customers_model');
        $this->load->library('permissions');
        $this->load->library('email_messages');
    }

    public function list(): void
    {
        try {
            if (cannot('view', PRIV_SYSTEM_SETTINGS)) {
                abort(403, 'Forbidden');
            }

            json_response($this->forms_model->find_all());
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    public function find(): void
    {
        try {
            if (cannot('view', PRIV_SYSTEM_SETTINGS)) {
                abort(403, 'Forbidden');
            }

            $form_id = (int) request('form_id');
            $form = $this->forms_model->find($form_id);
            $fields = $this->form_fields_model->find_for_form($form_id);
            $assignments = $this->form_assignments_model->find_for_form($form_id);
            $assigned_roles = array_map(fn ($assignment) => $assignment['role_slug'], $assignments);

            $form['fields'] = $fields;
            $form['assigned_user_types'] = $assigned_roles;

            json_response($form);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    public function save(): void
    {
        try {
            if (cannot('edit', PRIV_SYSTEM_SETTINGS)) {
                throw new RuntimeException('You do not have the required permissions for this task.');
            }

            $form = request('form', []);
            $fields = $form['fields'] ?? [];
            $assigned = $form['assigned_user_types'] ?? [];

            $this->db->trans_start();

            $form_id = $this->forms_model->save([
                'id' => $form['id'] ?? null,
                'name' => $form['name'] ?? '',
                'content' => $form['content'] ?? '',
                'is_active' => 1,
            ]);

            $this->form_fields_model->sync_fields($form_id, $fields);
            $this->form_assignments_model->sync_assignments($form_id, $assigned);

            $this->db->trans_complete();

            json_response(['id' => $form_id]);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    public function delete(): void
    {
        try {
            if (cannot('edit', PRIV_SYSTEM_SETTINGS)) {
                throw new RuntimeException('You do not have the required permissions for this task.');
            }

            $form_id = (int) request('form_id');

            $this->db->trans_start();
            $this->db->delete('form_assignments', ['id_forms' => $form_id]);
            $this->forms_model->delete($form_id);

            $this->db->trans_complete();

            json_response(['status' => 'success']);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    public function list_for_user(): void
    {
        try {
            if (cannot('view', PRIV_USER_SETTINGS)) {
                abort(403, 'Forbidden');
            }

            $role_slug = (string) session('role_slug');
            $user_id = (int) session('user_id');

            $assigned_rows = $this->form_assignments_model->find_for_role($role_slug);
            $form_ids = array_map(fn ($row) => $row['id_forms'], $assigned_rows);
            $forms = $this->forms_model->find_by_ids($form_ids, true);

            $results = [];
            $indexed = [];

            foreach ($forms as $form) {
                $submission = $this->form_submissions_model->find_for_user((int) $form['id'], $user_id);
                $item = [
                    'id' => $form['id'],
                    'name' => $form['name'],
                    'status' => $submission ? 'complete' : 'incomplete',
                    'submitted_at' => $submission['submitted_at'] ?? null,
                ];
                $indexed[$form['id']] = $item;
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
                    'status' => 'complete',
                    'submitted_at' => $row['submitted_at'] ?? null,
                ];
            }

            $results = array_values($indexed);

            json_response($results);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    public function find_for_user(): void
    {
        try {
            if (cannot('view', PRIV_USER_SETTINGS)) {
                abort(403, 'Forbidden');
            }

            $form_id = (int) request('form_id');
            $role_slug = (string) session('role_slug');
            $user_id = (int) session('user_id');

            $submission = $this->form_submissions_model->find_for_user($form_id, $user_id);
            if (!$this->form_assignments_model->is_assigned($form_id, $role_slug) && !$submission) {
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
                    if (!empty($form['content'])) {
                        array_unshift($fields, [
                            'id' => null,
                            'label' => $form['content'],
                            'field_type' => 'text',
                            'is_required' => 0,
                            'sort_order' => -1,
                        ]);
                    }
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
                if (!empty($form['content'])) {
                    array_unshift($fields, [
                        'id' => null,
                        'label' => $form['content'],
                        'field_type' => 'text',
                        'is_required' => 0,
                        'sort_order' => -1,
                    ]);
                }
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
            if (cannot('view', PRIV_USER_SETTINGS)) {
                abort(403, 'Forbidden');
            }

            $form_id = (int) request('form_id');
            $responses = request('responses', []);
            $role_slug = (string) session('role_slug');
            $user_id = (int) session('user_id');

            if (!$this->form_assignments_model->is_assigned($form_id, $role_slug)) {
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

    public function list_for_record(): void
    {
        try {
            $user_id = (int) request('user_id');
            $user_type = (string) request('user_type');

            $role_slug = $this->authorize_record_access($user_id, $user_type, false);

            $assigned_rows = $this->form_assignments_model->find_for_role($role_slug);
            $form_ids = array_map(fn ($row) => $row['id_forms'], $assigned_rows);
            $forms = $this->forms_model->find_by_ids($form_ids, true);

            $indexed = [];

            foreach ($forms as $form) {
                $submission = $this->form_submissions_model->find_for_user((int) $form['id'], $user_id);
                $indexed[$form['id']] = [
                    'id' => $form['id'],
                    'name' => $form['name'],
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
                    'status' => 'complete',
                    'submitted_at' => $row['submitted_at'] ?? null,
                ];
            }

            json_response(array_values($indexed));
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    public function find_for_record(): void
    {
        try {
            $user_id = (int) request('user_id');
            $user_type = (string) request('user_type');
            $form_id = (int) request('form_id');

            $role_slug = $this->authorize_record_access($user_id, $user_type, false);

            $submission = $this->form_submissions_model->find_for_user($form_id, $user_id);
            if (!$this->form_assignments_model->is_assigned($form_id, $role_slug) && !$submission) {
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
                    if (!empty($form['content'])) {
                        array_unshift($fields, [
                            'id' => null,
                            'label' => $form['content'],
                            'field_type' => 'text',
                            'is_required' => 0,
                            'sort_order' => -1,
                        ]);
                    }
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
                if (!empty($form['content'])) {
                    array_unshift($fields, [
                        'id' => null,
                        'label' => $form['content'],
                        'field_type' => 'text',
                        'is_required' => 0,
                        'sort_order' => -1,
                    ]);
                }
                $form['status'] = 'incomplete';
                $form['fields'] = $fields;
            }

            json_response($form);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    public function view_user(string $user_type, int $user_id, int $form_id): void
    {
        $role_slug = $this->authorize_record_access($user_id, $user_type, false);

        if (!$this->form_assignments_model->is_assigned($form_id, $role_slug)) {
            abort(403, 'Forbidden');
        }

        $form = $this->forms_model->find($form_id);
        $submission = $this->form_submissions_model->find_for_user($form_id, $user_id);
        $can_reset = $user_type === 'customer'
            ? can('edit', PRIV_CUSTOMERS)
            : can('edit', PRIV_USERS);

        script_vars([
            'form_id' => $form_id,
            'user_id' => $user_id,
            'user_type' => $user_type,
            'can_reset_form' => $can_reset ? 1 : 0,
        ]);

        html_vars([
            'page_title' => $form['name'],
            'active_menu' => $user_type === 'customer' ? PRIV_CUSTOMERS : PRIV_USERS,
        ]);

        $this->load->view('pages/forms_user_view');
    }

    public function reset_submission(): void
    {
        try {
            $user_id = (int) request('user_id');
            $user_type = (string) request('user_type');
            $form_id = (int) request('form_id');

            $this->authorize_record_access($user_id, $user_type, false);

            $submission = $this->form_submissions_model->find_for_user($form_id, $user_id);
            if (!$submission) {
                json_response(['status' => 'success']);
                return;
            }

            $this->db->trans_start();
            $this->db->delete('form_submission_fields', ['id_form_submissions' => $submission['id']]);
            $this->db->delete('form_submissions', ['id' => $submission['id']]);
            $this->db->trans_complete();

            json_response(['status' => 'success']);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    public function send_reminder(): void
    {
        try {
            $user_id = (int) request('user_id');
            $user_type = (string) request('user_type');

            $this->authorize_record_access($user_id, $user_type, true);

            if ($user_type !== 'customer') {
                throw new InvalidArgumentException('Reminders are only available for customers.');
            }

            $customer = $this->customers_model->find($user_id);
            if (!$customer) {
                throw new RuntimeException('Customer not found.');
            }

            $recipient_email = $customer['email'] ?? '';

            $this->send_profile_completion_email($user_id, $recipient_email);

            json_response(['status' => 'success']);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    protected function authorize_record_access(int $user_id, string $user_type, bool $requires_edit): string
    {
        if (!array_key_exists($user_type, $this->user_type_map)) {
            throw new InvalidArgumentException('Invalid user type provided.');
        }

        $role_id = $this->users_model->value($user_id, 'id_roles');
        $role_slug = $this->roles_model->value($role_id, 'slug');

        if ($role_slug !== $this->user_type_map[$user_type]) {
            throw new InvalidArgumentException('User type mismatch.');
        }

        if ($user_type === 'customer') {
            if (cannot('view', PRIV_CUSTOMERS)) {
                abort(403, 'Forbidden');
            }

            $current_user_id = (int) session('user_id');

            if (!$this->permissions->has_customer_access($current_user_id, $user_id)) {
                abort(403, 'Forbidden');
            }

            if ($requires_edit && cannot('edit', PRIV_CUSTOMERS)) {
                abort(403, 'Forbidden');
            }

            return $role_slug;
        }

        if (cannot('view', PRIV_USERS)) {
            abort(403, 'Forbidden');
        }

        if ($requires_edit && cannot('edit', PRIV_USERS)) {
            abort(403, 'Forbidden');
        }

        return $role_slug;
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
