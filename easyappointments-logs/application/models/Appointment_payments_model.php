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

class Appointment_payments_model extends EA_Model
{
    protected array $casts = [
        'id' => 'integer',
        'id_appointments' => 'integer',
        'amount' => 'float',
    ];

    public function save(array $payment): int
    {
        $payment['update_datetime'] = date('Y-m-d H:i:s');

        if (empty($payment['id'])) {
            $payment['create_datetime'] = date('Y-m-d H:i:s');

            if (!$this->db->insert('appointment_payments', $payment)) {
                throw new RuntimeException('Could not insert appointment payment.');
            }

            return (int) $this->db->insert_id();
        }

        if (!$this->db->update('appointment_payments', $payment, ['id' => $payment['id']])) {
            throw new RuntimeException('Could not update appointment payment.');
        }

        return (int) $payment['id'];
    }

    public function find_by_event_id(string $event_id): ?array
    {
        if ($event_id === '') {
            return null;
        }

        $row = $this->db->get_where('appointment_payments', ['stripe_event_id' => $event_id])->row_array();

        if (!$row) {
            return null;
        }

        $this->cast($row);

        return $row;
    }

    public function find_by_intent_id(string $intent_id): ?array
    {
        if ($intent_id === '') {
            return null;
        }

        $row = $this->db
            ->order_by('id', 'DESC')
            ->get_where('appointment_payments', ['stripe_payment_intent_id' => $intent_id], 1)
            ->row_array();

        if (!$row) {
            return null;
        }

        $this->cast($row);

        return $row;
    }

    public function find_latest_intent_for_appointment(int $appointment_id): ?string
    {
        if ($appointment_id <= 0) {
            return null;
        }

        $row = $this->db
            ->select('stripe_payment_intent_id')
            ->from('appointment_payments')
            ->where('id_appointments', $appointment_id)
            ->where('status', 'succeeded')
            ->where('stripe_payment_intent_id IS NOT NULL', null, false)
            ->where('stripe_payment_intent_id !=', '')
            ->order_by('id', 'DESC')
            ->limit(1)
            ->get()
            ->row_array();

        if (!$row || empty($row['stripe_payment_intent_id'])) {
            return null;
        }

        return (string) $row['stripe_payment_intent_id'];
    }
}
