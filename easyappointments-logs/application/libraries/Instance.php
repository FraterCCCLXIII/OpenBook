<?php defined('BASEPATH') or exit('No direct script access allowed');

/* ----------------------------------------------------------------------------
 * Easy!Appointments - Online Appointment Scheduler
 *
 * @package     EasyAppointments
 * @author      A.Tselegidis <alextselegidis@gmail.com>
 * @copyright   Copyright (c) Alex Tselegidis
 * @license     https://opensource.org/licenses/GPL-3.0 - GPLv3
 * @link        https://easyappointments.org
 * @since       v1.4.0
 * ---------------------------------------------------------------------------- */

require_once __DIR__ . '/../core/EA_Migration.php';

/**
 * Instance library.
 *
 * Handles all Easy!Appointments instance related functionality.
 *
 * @package Libraries
 */
class Instance
{
    /**
     * @var EA_Controller|CI_Controller
     */
    protected EA_Controller|CI_Controller $CI;

    /**
     * Installation constructor.
     */
    public function __construct()
    {
        $this->CI = &get_instance();

        $this->CI->load->model('admins_model');
        $this->CI->load->model('services_model');
        $this->CI->load->model('providers_model');
        $this->CI->load->model('customers_model');

        $this->CI->load->library('timezones');
        $this->CI->load->library('migration');
    }

    /**
     * Migrate the database to the latest state.
     *
     * @param string $type Provide "fresh" to revert previous migrations and start from the beginning or "up"/"down" to step.
     */
    public function migrate(string $type = ''): void
    {
        $current_version = $this->CI->migration->current_version();

        if ($type === 'up') {
            if (!$this->CI->migration->version($current_version + 1)) {
                show_error($this->CI->migration->error_string());
            }

            return;
        }

        if ($type === 'down') {
            if (!$this->CI->migration->version($current_version - 1)) {
                show_error($this->CI->migration->error_string());
            }

            return;
        }

        if ($type === 'fresh' && !$this->CI->migration->version(0)) {
            show_error($this->CI->migration->error_string());
        }

        if ($this->CI->migration->latest() === false) {
            show_error($this->CI->migration->error_string());
        }
    }

    /**
     * Seed the database with test data.
     *
     * @return string Return's the administrator user password.
     *
     * @throws Exception
     */
    public function seed(): string
    {
        // Settings

        setting([
            'company_name' => 'Company Name',
            'company_email' => 'info@example.org',
            'company_link' => 'https://example.org',
        ]);

        // Admin

        $password = 'administrator';

        $this->CI->admins_model->save([
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@example.org',
            'phone_number' => '+10000000000',
            'settings' => [
                'username' => 'administrator',
                'password' => $password,
                'notifications' => true,
                'calendar_view' => CALENDAR_VIEW_DEFAULT,
            ],
        ]);

        // Service

        $service_id = $this->CI->services_model->save([
            'name' => 'Service',
            'duration' => '30',
            'price' => '0',
            'currency' => '',
            'availabilities_type' => 'flexible',
            'attendants_number' => '1',
        ]);

        // Provider

        $this->CI->providers_model->save([
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'email' => 'jane@example.org',
            'phone_number' => '+10000000000',
            'services' => [$service_id],
            'settings' => [
                'username' => 'janedoe',
                'password' => random_string(),
                'working_plan' => setting('company_working_plan'),
                'working_plan_exceptions' => '{}',
                'notifications' => true,
                'google_sync' => false,
                'sync_past_days' => 30,
                'sync_future_days' => 90,
                'calendar_view' => CALENDAR_VIEW_DEFAULT,
            ],
        ]);

        // Customer

        $this->CI->customers_model->save([
            'first_name' => 'James',
            'last_name' => 'Doe',
            'email' => 'james@example.org',
            'phone_number' => '+10000000000',
        ]);

        return $password;
    }

    /**
     * Create a database backup file.
     *
     * @param string|null $path Override the default backup path (storage/backups/*).
     *
     * @throws Exception
     */
    public function backup(?string $path = null): void
    {
        $path = $path ?? APPPATH . '/../storage/backups';

        if (!file_exists($path)) {
            throw new InvalidArgumentException('The backup path does not exist: ' . $path);
        }

        if (!is_writable($path)) {
            throw new RuntimeException('The backup path is not writable: ' . $path);
        }

        $contents = $this->CI->dbutil->backup();

        $encrypt_backups = (bool) config('backup_encryption_enabled', false);

        if ($encrypt_backups) {
            $this->CI->load->library('phi_crypto');
            $contents = $this->CI->phi_crypto->encrypt_string($contents);
        }

        $filename = 'easyappointments-backup-' . date('Y-m-d-His') . '.gz';

        if ($encrypt_backups) {
            $filename .= '.enc';
        }

        write_file(rtrim($path, '/') . '/' . $filename, $contents);

        $this->prune_old_backups($path);
    }

    /**
     * Remove backups older than retention window.
     *
     * @param string $path
     */
    protected function prune_old_backups(string $path): void
    {
        $retention_days = (int) config('backup_retention_days', 30);

        if ($retention_days <= 0) {
            return;
        }

        $threshold = strtotime('-' . $retention_days . ' days');
        $files = glob(rtrim($path, '/') . '/easyappointments-backup-*.gz*') ?: [];

        foreach ($files as $file) {
            if (filemtime($file) < $threshold) {
                @unlink($file);
            }
        }
    }
}
