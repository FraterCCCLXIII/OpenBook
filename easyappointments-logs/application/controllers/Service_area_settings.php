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
 * Service area settings controller.
 *
 * @package Controllers
 */
class Service_area_settings extends EA_Controller
{
    public function __construct()
    {
        parent::__construct();

        $this->load->model('settings_model');
        $this->load->model('service_area_zips_model');
        $this->load->model('geonames_postal_codes_model');
        $this->load->library('accounts');
    }

    public function index(): void
    {
        session(['dest_url' => site_url('service_area_settings')]);

        $user_id = session('user_id');

        if (cannot('view', PRIV_SYSTEM_SETTINGS)) {
            if ($user_id) {
                abort(403, 'Forbidden');
            }

            redirect('login');

            return;
        }

        $service_area_lines = [];
        $rows = $this->service_area_zips_model->get_with_labels();
        foreach ($rows as $row) {
            $zip = $row['postal_code'] ?? '';
            $label = trim((string) ($row['display_label'] ?? ''));
            if ($label !== '') {
                $service_area_lines[] = $zip . ' | ' . $label;
            } else {
                $service_area_lines[] = $zip;
            }
        }

        script_vars([
            'user_id' => $user_id,
            'service_area_zip_lines' => $service_area_lines,
            'default_service_area_country' => setting('default_service_area_country', 'US'),
        ]);

        html_vars([
            'page_title' => lang('settings'),
            'active_menu' => PRIV_SYSTEM_SETTINGS,
            'user_display_name' => $this->accounts->get_user_display_name($user_id),
        ]);

        $this->load->view('pages/service_area_settings');
    }

    public function save(): void
    {
        try {
            if (cannot('edit', PRIV_SYSTEM_SETTINGS)) {
                throw new RuntimeException('You do not have the required permissions for this task.');
            }

            $zip_lines = request('service_area_zip_lines', []);
            $default_country = strtoupper((string) request('default_service_area_country', 'US'));

            if (!$default_country) {
                $default_country = 'US';
            }

            if (!is_array($zip_lines)) {
                $zip_lines = preg_split('/\r?\n/', (string) $zip_lines);
            }

            $entries = $this->parse_zip_lines($zip_lines, $default_country);

            $this->sync_service_area_zips($entries);

            $setting = $this->settings_model
                ->query()
                ->where('name', 'default_service_area_country')
                ->get()
                ->row_array();

            $setting = $setting ?: ['name' => 'default_service_area_country'];
            $setting['value'] = $default_country;
            $this->settings_model->save($setting);

            response();
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    protected function parse_zip_lines(array $lines, string $default_country): array
    {
        $entries = [];

        foreach ($lines as $line) {
            $line = trim((string) $line);
            if ($line === '') {
                continue;
            }

            $parts = array_map('trim', explode('|', $line));
            $postal_code = strtoupper(array_shift($parts));
            if ($postal_code === '') {
                continue;
            }

            $custom_label = trim(implode('|', $parts));
            $entries[] = [
                'country_code' => $default_country,
                'postal_code' => $postal_code,
                'custom_label' => $custom_label ?: null,
            ];
        }

        return $entries;
    }

    protected function sync_service_area_zips(array $entries): void
    {
        $existing = $this->service_area_zips_model->get();
        $existing_map = [];
        foreach ($existing as $row) {
            $key = strtoupper($row['country_code']) . '|' . strtoupper($row['postal_code']);
            $existing_map[$key] = $row;
        }

        $now = date('Y-m-d H:i:s');
        $incoming_keys = [];

        foreach ($entries as $entry) {
            $country_code = strtoupper($entry['country_code']);
            $postal_code = strtoupper($entry['postal_code']);
            $custom_label = $entry['custom_label'];
            $key = $country_code . '|' . $postal_code;
            $incoming_keys[] = $key;

            $geonames = $this->geonames_postal_codes_model->find_by_postal_code($country_code, $postal_code);
            $auto_label = '';
            if ($geonames) {
                $label_parts = array_filter([
                    $geonames['place_name'] ?? null,
                    $geonames['admin_name1'] ?? null,
                    $geonames['country_code'] ?? null,
                ]);
                $auto_label = implode(', ', $label_parts);
            }

            if ($custom_label && $auto_label && $custom_label === $auto_label) {
                $custom_label = null;
            }

            if (isset($existing_map[$key])) {
                $row = $existing_map[$key];
                $row['update_datetime'] = $now;
                $row['custom_label'] = $custom_label;
                $this->service_area_zips_model->save($row);
                continue;
            }

            $this->service_area_zips_model->save([
                'create_datetime' => $now,
                'update_datetime' => $now,
                'country_code' => $country_code,
                'postal_code' => $postal_code,
                'custom_label' => $custom_label,
            ]);
        }

        foreach ($existing_map as $key => $row) {
            if (!in_array($key, $incoming_keys, true)) {
                $this->service_area_zips_model->delete((int) $row['id']);
            }
        }
    }
}
