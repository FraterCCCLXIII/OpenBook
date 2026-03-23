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
 * User files controller.
 *
 * Handles file uploads for users (customers, admins, providers, secretaries).
 *
 * @package Controllers
 */
class User_files extends EA_Controller
{
    /**
     * @var array<string, string>
     */
    protected array $user_type_map = [
        'customer' => DB_SLUG_CUSTOMER,
        'admin' => DB_SLUG_ADMIN,
        'provider' => DB_SLUG_PROVIDER,
        'secretary' => DB_SLUG_SECRETARY,
    ];

    /**
     * User_files constructor.
     */
    public function __construct()
    {
        parent::__construct();

        $this->load->model('roles_model');
        $this->load->model('user_files_model');
        $this->load->model('users_model');
        $this->load->library('audit_log');
        $this->load->library('permissions');
        $this->load->library('phi_crypto');
    }

    /**
     * List files for a user.
     */
    public function list_files(): void
    {
        try {
            $user_id = (int) request('user_id');
            $user_type = (string) request('user_type');

            $this->authorize_user_files($user_id, $user_type, false);

            $files = $this->user_files_model->find_for_user($user_id);

            $this->audit_log->write('user_files.list', [
                'user_id' => $user_id,
                'user_type' => $user_type,
                'count' => count($files),
            ]);

            json_response($files);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    /**
     * Upload a file for a user.
     */
    public function upload(): void
    {
        try {
            $user_id = (int) request('user_id');
            $user_type = (string) request('user_type');

            $this->authorize_user_files($user_id, $user_type, true);

            if (empty($_FILES['file']) || !is_uploaded_file($_FILES['file']['tmp_name'])) {
                throw new InvalidArgumentException('No file was uploaded.');
            }

            $upload_dir = storage_path('uploads/user_files');

            if (!is_dir($upload_dir) && !mkdir($upload_dir, 0755, true) && !is_dir($upload_dir)) {
                throw new RuntimeException('Failed to create upload directory.');
            }

            $original_name = basename((string) $_FILES['file']['name']);
            $extension = strtolower((string) pathinfo($original_name, PATHINFO_EXTENSION));
            $unique = bin2hex(random_bytes(8));
            $stored_name = $extension ? "{$user_id}_{$unique}.{$extension}" : "{$user_id}_{$unique}";
            $relative_path = 'uploads/user_files/' . $stored_name;

            $temp_path = storage_path('uploads/user_files/tmp_' . $unique);

            if (!move_uploaded_file($_FILES['file']['tmp_name'], $temp_path)) {
                throw new RuntimeException('Failed to store the uploaded file.');
            }

            $file_size = (int) $_FILES['file']['size'];
            $file_type = $this->detect_file_type($temp_path) ?: (string) $_FILES['file']['type'];

            $this->validate_upload($extension, $file_type);
            $this->scan_uploaded_file($temp_path);

            $stored_relative_path = $relative_path;
            $destination = storage_path($stored_relative_path);

            if ($this->phi_crypto->enabled()) {
                $stored_relative_path .= '.enc';
                $destination = storage_path($stored_relative_path);
            }

            $this->phi_crypto->encrypt_file($temp_path, $destination);
            unlink($temp_path);

            $file = [
                'id_users' => $user_id,
                'file_name' => $original_name,
                'file_size' => $file_size,
                'file_type' => $file_type,
                'file_path' => $stored_relative_path,
            ];

            $file_id = $this->user_files_model->insert($file);

            $file['id'] = $file_id;
            $file['create_datetime'] = date('Y-m-d H:i:s');

            $this->audit_log->write('user_files.upload', [
                'user_id' => $user_id,
                'user_type' => $user_type,
                'file_id' => (int) $file_id,
            ]);

            json_response($file);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    /**
     * Delete a file.
     */
    public function delete(): void
    {
        try {
            $file_id = (int) request('file_id');
            $file = $this->user_files_model->find($file_id);

            $user_type = $this->get_user_type_by_id((int) $file['id_users']);

            $this->authorize_user_files((int) $file['id_users'], $user_type, true);

            $path = storage_path($file['file_path']);

            if (is_file($path)) {
                unlink($path);
            }

            $this->user_files_model->delete($file_id);

            $this->audit_log->write('user_files.delete', [
                'file_id' => (int) $file_id,
                'user_id' => (int) $file['id_users'],
            ]);

            json_response(['status' => 'success']);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    /**
     * Download a file.
     *
     * @param int $file_id
     */
    public function download(int $file_id): void
    {
        $file = $this->user_files_model->find($file_id);
        $user_type = $this->get_user_type_by_id((int) $file['id_users']);

        $this->authorize_user_files((int) $file['id_users'], $user_type, false);

        $path = storage_path($file['file_path']);

        if (!is_file($path)) {
            abort(404, 'File not found.');
        }

        $this->audit_log->write('user_files.download', [
            'file_id' => (int) $file_id,
            'user_id' => (int) $file['id_users'],
        ]);

        $this->output->set_content_type($file['file_type']);
        $this->output->set_header('Content-Disposition: attachment; filename="' . addslashes($file['file_name']) . '"');
        if ($this->phi_crypto->enabled()) {
            $contents = $this->phi_crypto->decrypt_file_to_string($path);
            $this->output->set_header('Content-Length: ' . strlen($contents));
            $this->output->set_output($contents);
            return;
        }

        $this->output->set_header('Content-Length: ' . filesize($path));
        $this->output->set_output(file_get_contents($path));
    }

    /**
     * View a file inline (PDF only).
     *
     * @param int $file_id
     */
    public function view(int $file_id): void
    {
        $file = $this->user_files_model->find($file_id);
        $user_type = $this->get_user_type_by_id((int) $file['id_users']);

        $this->authorize_user_files((int) $file['id_users'], $user_type, false);

        if (!$this->is_pdf($file)) {
            abort(415, 'Unsupported Media Type.');
        }

        $path = storage_path($file['file_path']);

        if (!is_file($path)) {
            abort(404, 'File not found.');
        }

        $this->audit_log->write('user_files.view', [
            'file_id' => (int) $file_id,
            'user_id' => (int) $file['id_users'],
        ]);

        $this->output->set_content_type('application/pdf');
        $this->output->set_header('Content-Disposition: inline; filename="' . addslashes($file['file_name']) . '"');
        if ($this->phi_crypto->enabled()) {
            $contents = $this->phi_crypto->decrypt_file_to_string($path);
            $this->output->set_header('Content-Length: ' . strlen($contents));
            $this->output->set_output($contents);
            return;
        }

        $this->output->set_header('Content-Length: ' . filesize($path));
        $this->output->set_output(file_get_contents($path));
    }

    /**
     * Check file authorization for a user.
     *
     * @param int $user_id
     * @param string $user_type
     * @param bool $requires_edit
     */
    protected function authorize_user_files(int $user_id, string $user_type, bool $requires_edit): void
    {
        $this->assert_user_type($user_id, $user_type);

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

            return;
        }

        if (cannot('view', PRIV_USERS)) {
            abort(403, 'Forbidden');
        }

        if ($requires_edit && cannot('edit', PRIV_USERS)) {
            abort(403, 'Forbidden');
        }
    }

    /**
     * Validate the uploaded file's extension and MIME type.
     *
     * @param string $extension
     * @param string $mime_type
     */
    protected function validate_upload(string $extension, string $mime_type): void
    {
        $allowed_extensions = config('user_file_allowed_extensions', []);
        $allowed_mime_types = config('user_file_allowed_mime_types', []);

        if (!empty($allowed_extensions) && !in_array($extension, $allowed_extensions, true)) {
            throw new InvalidArgumentException('Unsupported file type.');
        }

        if (!empty($allowed_mime_types) && !in_array($mime_type, $allowed_mime_types, true)) {
            throw new InvalidArgumentException('Unsupported file type.');
        }
    }

    /**
     * Run an optional malware scan on the uploaded file.
     *
     * @param string $path
     */
    protected function scan_uploaded_file(string $path): void
    {
        $command_template = config('user_file_av_scan_command', '');

        if (empty($command_template)) {
            return;
        }

        $command = str_replace('%s', escapeshellarg($path), $command_template);
        $exit_code = 0;
        exec($command, $output, $exit_code);

        if ($exit_code !== 0) {
            throw new RuntimeException('Uploaded file failed malware scan.');
        }
    }

    /**
     * Ensure the user matches the expected type.
     *
     * @param int $user_id
     * @param string $user_type
     */
    protected function assert_user_type(int $user_id, string $user_type): void
    {
        if (!array_key_exists($user_type, $this->user_type_map)) {
            throw new InvalidArgumentException('Invalid user type provided.');
        }

        $role_id = $this->users_model->value($user_id, 'id_roles');
        $role_slug = $this->roles_model->value($role_id, 'slug');

        if ($role_slug !== $this->user_type_map[$user_type]) {
            throw new InvalidArgumentException('User type mismatch.');
        }
    }

    /**
     * Get user type string from user id.
     *
     * @param int $user_id
     *
     * @return string
     */
    protected function get_user_type_by_id(int $user_id): string
    {
        $role_id = $this->users_model->value($user_id, 'id_roles');
        $role_slug = $this->roles_model->value($role_id, 'slug');

        $type = array_search($role_slug, $this->user_type_map, true);

        if (!$type) {
            throw new InvalidArgumentException('Invalid user type.');
        }

        return $type;
    }

    /**
     * Detect file MIME type.
     *
     * @param string $path
     *
     * @return string|null
     */
    protected function detect_file_type(string $path): ?string
    {
        if (!function_exists('finfo_open')) {
            return null;
        }

        $finfo = finfo_open(FILEINFO_MIME_TYPE);

        if (!$finfo) {
            return null;
        }

        $type = finfo_file($finfo, $path);
        finfo_close($finfo);

        return $type ?: null;
    }

    /**
     * Check whether a file is a PDF.
     *
     * @param array $file
     *
     * @return bool
     */
    protected function is_pdf(array $file): bool
    {
        $extension = strtolower((string) pathinfo($file['file_name'], PATHINFO_EXTENSION));

        if ($extension === 'pdf') {
            return true;
        }

        return (string) ($file['file_type'] ?? '') === 'application/pdf';
    }
}
