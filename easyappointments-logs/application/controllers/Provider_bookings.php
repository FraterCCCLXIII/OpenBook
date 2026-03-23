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
 * Provider bookings controller.
 *
 * @package Controllers
 */
class Provider_bookings extends EA_Controller
{
    /**
     * Provider bookings constructor.
     */
    public function __construct()
    {
        parent::__construct();

        $this->load->model('appointments_model');
        $this->load->model('customers_model');
        $this->load->model('providers_model');
        $this->load->model('services_model');
        $this->load->model('unavailabilities_model');
        $this->load->model('roles_model');
        $this->load->library('accounts');
    }

    public function index(): void
    {
        session(['dest_url' => site_url('provider/bookings')]);

        $user_id = session('user_id');
        $role_slug = session('role_slug');

        if (!$user_id) {
            redirect('login');
            return;
        }

        if ($role_slug !== DB_SLUG_PROVIDER) {
            abort(403, 'Forbidden');
        }

        $upcoming_groups = $this->build_upcoming_groups($user_id);

        html_vars([
            'page_title' => 'Bookings',
            'active_menu' => 'provider_bookings',
            'user_display_name' => $this->accounts->get_user_display_name($user_id),
            'privileges' => $this->roles_model->get_permissions_by_slug($role_slug),
            'role_slug' => $role_slug,
            'upcoming_groups' => $upcoming_groups,
        ]);

        $this->load->view('pages/provider_bookings');
    }

    public function view(int $appointment_id): void
    {
        session(['dest_url' => site_url('provider/bookings')]);

        $user_id = session('user_id');
        $role_slug = session('role_slug');

        if (!$user_id) {
            redirect('login');
            return;
        }

        if ($role_slug !== DB_SLUG_PROVIDER) {
            abort(403, 'Forbidden');
        }

        $appointment = $this->appointments_model->find($appointment_id);

        if ((int) $appointment['id_users_provider'] !== (int) $user_id) {
            abort(403, 'Forbidden');
        }

        $service = $this->services_model->find($appointment['id_services']);
        $customer = $this->customers_model->find($appointment['id_users_customer']);
        $provider = $this->providers_model->find($appointment['id_users_provider']);

        $duration_minutes = $this->get_duration_minutes($appointment['start_datetime'], $appointment['end_datetime']);
        $address = $this->format_address($customer);
        $status_label = $appointment['status'] ?: 'Booked';
        $status_class = 'bg-emerald-50 text-emerald-700';

        html_vars([
            'page_title' => 'Appointment',
            'active_menu' => 'provider_bookings',
            'user_display_name' => $this->accounts->get_user_display_name($user_id),
            'privileges' => $this->roles_model->get_permissions_by_slug($role_slug),
            'appointment' => $appointment,
            'service' => $service,
            'customer' => $customer,
            'provider' => $provider,
            'duration_minutes' => $duration_minutes,
            'address' => $address,
            'status_label' => $status_label,
            'status_class' => $status_class,
        ]);

        $this->load->view('pages/provider_booking_details');
    }

    protected function build_upcoming_groups(int $provider_id): array
    {
        $now = new DateTime();
        $day_start = new DateTime('today');
        $day_start_value = $day_start->format('Y-m-d H:i:s');

        $appointments = $this->appointments_model->get(
            [
                'id_users_provider' => $provider_id,
                'end_datetime >=' => $day_start_value,
            ],
            200,
            null,
            'start_datetime ASC',
        );

        $unavailabilities = $this->unavailabilities_model->get(
            [
                'id_users_provider' => $provider_id,
                'end_datetime >=' => $day_start_value,
            ],
            200,
            null,
            'start_datetime ASC',
        );

        $items = [];

        foreach ($appointments as $appointment) {
            $end_datetime = new DateTime($appointment['end_datetime']);
            if ($end_datetime < $day_start) {
                continue;
            }

            $service = null;
            $customer = null;

            try {
                $service = $this->services_model->find($appointment['id_services']);
            } catch (Throwable $e) {
                $service = null;
            }

            try {
                $customer = $this->customers_model->find($appointment['id_users_customer']);
            } catch (Throwable $e) {
                $customer = null;
            }

            $customer_name = trim(($customer['first_name'] ?? '') . ' ' . ($customer['last_name'] ?? ''));

            $items[] = [
                'type' => 'appointment',
                'id' => (int) $appointment['id'],
                'title' => $service['name'] ?? 'Appointment',
                'start_datetime' => $appointment['start_datetime'],
                'end_datetime' => $appointment['end_datetime'],
                'customer_name' => $customer_name ?: null,
            ];
        }

        foreach ($unavailabilities as $unavailability) {
            $end_datetime = new DateTime($unavailability['end_datetime']);
            if ($end_datetime < $day_start) {
                continue;
            }

            $title = trim((string) ($unavailability['notes'] ?? ''));

            $items[] = [
                'type' => 'unavailability',
                'title' => $title ?: lang('unavailability'),
                'start_datetime' => $unavailability['start_datetime'],
                'end_datetime' => $unavailability['end_datetime'],
                'customer_name' => null,
            ];
        }

        usort($items, function (array $left, array $right) {
            return strtotime($left['start_datetime']) <=> strtotime($right['start_datetime']);
        });

        $groups = [];
        $today = new DateTime('today');
        $tomorrow = new DateTime('tomorrow');

        foreach ($items as $item) {
            $item_date = new DateTime($item['start_datetime']);
            $group_key = $item_date->format('Y-m-d');

            if (!isset($groups[$group_key])) {
                $label = $item_date->format('l, M j');

                if ($item_date->format('Y-m-d') === $today->format('Y-m-d')) {
                    $label = 'Today';
                } elseif ($item_date->format('Y-m-d') === $tomorrow->format('Y-m-d')) {
                    $label = 'Tomorrow';
                }

                $groups[$group_key] = [
                    'label' => $label,
                    'items' => [],
                ];
            }

            $groups[$group_key]['items'][] = $item;
        }

        return array_values($groups);
    }

    protected function get_duration_minutes(string $start_datetime, string $end_datetime): int
    {
        $start = new DateTime($start_datetime);
        $end = new DateTime($end_datetime);

        $diff_seconds = $end->getTimestamp() - $start->getTimestamp();

        return (int) max(0, round($diff_seconds / 60));
    }

    protected function format_address(array $customer): string
    {
        $parts = array_filter([
            $customer['address'] ?? null,
            $customer['city'] ?? null,
            $customer['state'] ?? null,
            $customer['zip_code'] ?? null,
        ]);

        return implode(', ', $parts);
    }
}
