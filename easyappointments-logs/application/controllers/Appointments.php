<?php defined('BASEPATH') or exit('No direct script access allowed');

/* ----------------------------------------------------------------------------
 * Easy!Appointments - Online Appointment Scheduler
 *
 * @package     EasyAppointments
 * @author      A.Tselegidis <alextselegidis@gmail.com>
 * @copyright   Copyright (c) Alex Tselegidis
 * @license     https://opensource.org/licenses/GPL-3.0 - GPLv3
 * @link        https://easyappointments.org
 * @since       v1.0.0
 * ---------------------------------------------------------------------------- */

/**
 * Appointments controller.
 *
 * Handles the appointments related operations.
 *
 * Notice: This file used to have the booking page related code which since v1.5 has now moved to the Booking.php
 * controller for improved consistency.
 *
 * @package Controllers
 */
class Appointments extends EA_Controller
{
    public array $allowed_appointment_fields = [
        'id',
        'start_datetime',
        'end_datetime',
        'location',
        'notes',
        'color',
        'status',
        'is_unavailability',
        'id_users_provider',
        'id_users_customer',
        'id_services',
    ];

    public array $optional_appointment_fields = [
        //
    ];

    /**
     * Appointments constructor.
     */
    public function __construct()
    {
        parent::__construct();

        $this->load->model('appointments_model');
        $this->load->model('appointment_notes_model');
        $this->load->model('roles_model');
        $this->load->model('secretaries_model');

        $this->load->library('accounts');
        $this->load->library('activity_audit');
        $this->load->library('appointment_payments_service');
        $this->load->library('timezones');
        $this->load->library('webhooks_client');
    }

    /**
     * Support backwards compatibility for appointment links that still point to this URL.
     *
     * @param string $appointment_hash
     *
     * @deprecated Since 1.5
     */
    public function index(string $appointment_hash = ''): void
    {
        redirect('booking/' . $appointment_hash);
    }

    /**
     * Filter appointments by the provided keyword.
     */
    public function search(): void
    {
        try {
            if (cannot('view', PRIV_APPOINTMENTS)) {
                abort(403, 'Forbidden');
            }

            $keyword = request('keyword', '');

            $order_by = request('order_by', 'update_datetime DESC');

            $limit = request('limit', 1000);

            $offset = (int) request('offset', '0');

            $appointments = $this->appointments_model->search($keyword, $limit, $offset, $order_by);

            $user_id = session('user_id');
            $role_slug = session('role_slug');

            // If the current user is a provider he must only see his own appointments.
            if ($role_slug === DB_SLUG_PROVIDER) {
                foreach ($appointments as $index => $appointment) {
                    if ((int) $appointment['id_users_provider'] !== (int) $user_id) {
                        unset($appointments[$index]);
                    }
                }

                $appointments = array_values($appointments);
            }

            // If the current user is a secretary he must only see the appointments of his providers.
            if ($role_slug === DB_SLUG_SECRETARY) {
                $provider_ids = $this->secretaries_model->find($user_id)['providers'];

                foreach ($appointments as $index => $appointment) {
                    if (!in_array((int) $appointment['id_users_provider'], $provider_ids)) {
                        unset($appointments[$index]);
                    }
                }

                $appointments = array_values($appointments);
            }

            json_response($appointments);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    /**
     * Store a new appointment.
     */
    public function store(): void
    {
        try {
            if (cannot('add', PRIV_APPOINTMENTS)) {
                abort(403, 'Forbidden');
            }

            $appointment = json_decode(request('appointment'), true);
            $appointment_before = !empty($appointment['id'])
                ? $this->appointments_model->find((int) $appointment['id'])
                : null;

            $this->appointments_model->only($appointment, $this->allowed_appointment_fields);

            $this->appointments_model->optional($appointment, $this->optional_appointment_fields);

            $appointment_id = $this->appointments_model->save($appointment);

            $appointment = $this->appointments_model->find($appointment_id);

            $this->webhooks_client->trigger(WEBHOOK_APPOINTMENT_SAVE, $appointment);

            $is_create = empty($appointment_before);
            $this->activity_audit->log(
                $is_create ? 'appointment.created' : 'appointment.saved',
                'appointment',
                (string) $appointment_id,
                [
                    'appointment_id' => (int) $appointment_id,
                    'customer_id' => (int) ($appointment['id_users_customer'] ?? 0),
                    'provider_id' => (int) ($appointment['id_users_provider'] ?? 0),
                    'changes' => $appointment_before
                        ? $this->activity_audit->build_field_changes($appointment_before, $appointment, ['update_datetime'])
                        : ['created' => true],
                ],
            );

            json_response([
                'success' => true,
                'id' => $appointment_id,
            ]);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    /**
     * Find an appointment.
     */
    public function find(): void
    {
        try {
            if (cannot('view', PRIV_APPOINTMENTS)) {
                abort(403, 'Forbidden');
            }

            $appointment_id = request('appointment_id');

            $appointment = $this->appointments_model->find($appointment_id);

            json_response($appointment);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    /**
     * Update a appointment.
     */
    public function update(): void
    {
        try {
            if (cannot('edit', PRIV_APPOINTMENTS)) {
                abort(403, 'Forbidden');
            }

            $appointment = json_decode(request('appointment'), true);
            $appointment_before = !empty($appointment['id'])
                ? $this->appointments_model->find((int) $appointment['id'])
                : null;

            $this->appointments_model->only($appointment, $this->allowed_appointment_fields);

            $this->appointments_model->optional($appointment, $this->optional_appointment_fields);

            $appointment_id = $this->appointments_model->save($appointment);

            if ($appointment_before) {
                $appointment_after = $this->appointments_model->find($appointment_id);
                $this->appointment_payments_service->maybe_charge_remaining_on_completed(
                    $appointment_before,
                    $appointment_after,
                );

                $this->activity_audit->log('appointment.updated', 'appointment', (string) $appointment_id, [
                    'appointment_id' => (int) $appointment_id,
                    'customer_id' => (int) ($appointment_after['id_users_customer'] ?? 0),
                    'provider_id' => (int) ($appointment_after['id_users_provider'] ?? 0),
                    'changes' => $this->activity_audit->build_field_changes($appointment_before, $appointment_after, ['update_datetime']),
                ]);
            }

            json_response([
                'success' => true,
                'id' => $appointment_id,
            ]);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    /**
     * Remove a appointment.
     */
    public function destroy(): void
    {
        try {
            if (cannot('delete', PRIV_APPOINTMENTS)) {
                abort(403, 'Forbidden');
            }

            $appointment_id = request('appointment_id');

            $appointment = $this->appointments_model->find($appointment_id);

            $this->appointments_model->delete($appointment_id);

            $this->webhooks_client->trigger(WEBHOOK_APPOINTMENT_DELETE, $appointment);

            $this->activity_audit->log('appointment.deleted', 'appointment', (string) $appointment_id, [
                'appointment_id' => (int) $appointment_id,
                'customer_id' => (int) ($appointment['id_users_customer'] ?? 0),
                'provider_id' => (int) ($appointment['id_users_provider'] ?? 0),
            ]);

            json_response([
                'success' => true,
            ]);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    /**
     * Get appointment visit notes.
     */
    public function notes(): void
    {
        try {
            if (cannot('view', PRIV_APPOINTMENTS)) {
                abort(403, 'Forbidden');
            }

            $appointment_id = (int) request('appointment_id');

            if (!$appointment_id) {
                abort(400, 'Bad Request');
            }

            $appointment = $this->appointments_model->find($appointment_id);
            $this->ensure_appointment_access($appointment);

            $notes = $this->appointment_notes_model->get_by_appointment($appointment_id);

            json_response($notes);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    /**
     * Store a new appointment visit note.
     */
    public function store_note(): void
    {
        try {
            if (cannot('view', PRIV_APPOINTMENTS)) {
                abort(403, 'Forbidden');
            }

            $note = request('note');

            if (!$note || empty($note['id_appointments'])) {
                abort(400, 'Bad Request');
            }

            $appointment_id = (int) $note['id_appointments'];
            $appointment = $this->appointments_model->find($appointment_id);
            $this->ensure_appointment_access($appointment);

            $note_payload = [
                'id_appointments' => $appointment_id,
                'id_users_author' => session('user_id'),
                'note' => $note['note'] ?? '',
            ];

            $note_id = $this->appointment_notes_model->save($note_payload);
            $note_response = $this->appointment_notes_model->find_with_author($note_id);

            $this->activity_audit->log('appointment.note.created', 'appointment_note', (string) $note_id, [
                'appointment_id' => (int) $appointment_id,
                'customer_id' => (int) ($appointment['id_users_customer'] ?? 0),
                'id_users_author' => (int) session('user_id'),
            ]);

            json_response($note_response);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    /**
     * Ensure appointment access for providers/secretaries.
     *
     * @param array $appointment
     */
    private function ensure_appointment_access(array $appointment): void
    {
        $user_id = session('user_id');
        $role_slug = session('role_slug');

        if ($role_slug === DB_SLUG_PROVIDER && (int) $appointment['id_users_provider'] !== (int) $user_id) {
            abort(403, 'Forbidden');
        }

        if ($role_slug === DB_SLUG_SECRETARY) {
            $provider_ids = $this->secretaries_model->find($user_id)['providers'];

            if (!in_array((int) $appointment['id_users_provider'], $provider_ids, true)) {
                abort(403, 'Forbidden');
            }
        }
    }
}
