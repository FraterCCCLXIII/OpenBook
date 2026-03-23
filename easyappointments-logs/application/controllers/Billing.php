<?php defined('BASEPATH') or exit('No direct script access allowed');

class Billing extends EA_Controller
{
    private const BILLING_STATUS_OPTIONS = [
        'unpaid' => 'Unpaid',
        'payment_link_sent' => 'Payment Link Sent',
        'paid' => 'Paid',
        'paid_by_phone' => 'Paid by Phone',
        'partially_refunded' => 'Partially Refunded',
        'refunded' => 'Refunded',
        'voided' => 'Voided',
    ];

    private const BILLING_STATUS_TRANSITIONS = [
        'unpaid' => ['payment_link_sent', 'paid', 'paid_by_phone', 'voided'],
        'payment_link_sent' => ['unpaid', 'paid', 'paid_by_phone', 'voided'],
        'paid' => ['partially_refunded', 'refunded', 'voided'],
        'paid_by_phone' => ['partially_refunded', 'refunded', 'voided'],
        'partially_refunded' => ['refunded'],
        'refunded' => [],
        'voided' => [],
    ];

    public function __construct()
    {
        parent::__construct();

        if (!can('view', PRIV_SYSTEM_SETTINGS)) {
            redirect('login');
        }

        $this->load->model('appointments_model');
        $this->load->model('appointment_payments_model');
        $this->load->model('customers_model');
        $this->load->model('services_model');

        $this->load->library('activity_audit');
        $this->load->library('stripe_gateway');
        $this->load->library('appointment_payments_service');
        $this->load->library('email_messages');
    }

    public function index()
    {
        $user_id = (int)session('user_id');
        $user_display_name = $this->accounts->get_user_display_name($user_id);

        $transactions = $this->db
            ->select('appointments.*, users.first_name, users.last_name, services.name as service_name')
            ->from('appointments')
            ->join('users', 'users.id = appointments.id_users_customer')
            ->join('services', 'services.id = appointments.id_services')
            ->order_by('appointments.book_datetime', 'DESC')
            ->get()
            ->result_array();

        $payment_transactions = $this->db
            ->select('appointment_payments.*, appointments.id_users_customer, appointments.book_datetime, users.first_name, users.last_name, services.name as service_name')
            ->from('appointment_payments')
            ->join('appointments', 'appointments.id = appointment_payments.id_appointments')
            ->join('users', 'users.id = appointments.id_users_customer')
            ->join('services', 'services.id = appointments.id_services')
            ->order_by('appointment_payments.create_datetime', 'DESC')
            ->get()
            ->result_array();

        html_vars([
            'page_title' => 'Billing',
            'active_menu' => 'billing',
            'transactions' => $transactions,
            'payment_transactions' => $payment_transactions,
            'billing_status_options' => self::BILLING_STATUS_OPTIONS,
            'user_display_name' => $user_display_name,
            'role_slug' => session('role_slug'),
        ]);

        script_vars([
            'billing_status_options' => self::BILLING_STATUS_OPTIONS,
        ]);

        $this->load->view('pages/billing', [
            'active_menu' => 'billing',
            'user_display_name' => $user_display_name,
            'transactions' => $transactions,
            'payment_transactions' => $payment_transactions,
            'billing_status_options' => self::BILLING_STATUS_OPTIONS,
        ]);
    }

    public function update_status(): void
    {
        try {
            if (cannot('edit', PRIV_SYSTEM_SETTINGS)) {
                abort(403, 'Forbidden');
            }

            $appointment_id = (int) request('appointment_id');
            $target_status = trim((string) request('billing_status', ''));
            $billing_reference = trim((string) request('billing_reference', ''));
            $billing_notes = trim((string) request('billing_notes', ''));

            if (!$appointment_id || $target_status === '') {
                abort(400, 'Bad Request');
            }

            $allowed_statuses = array_keys(self::BILLING_STATUS_TRANSITIONS);
            if (!in_array($target_status, $allowed_statuses, true)) {
                throw new InvalidArgumentException('Invalid billing status provided.');
            }

            $appointment = $this->appointments_model->find($appointment_id);
            $current_status = $appointment['billing_status'] ?? 'unpaid';
            $before = $appointment;

            if ($current_status !== $target_status) {
                $allowed_transitions = self::BILLING_STATUS_TRANSITIONS[$current_status] ?? [];
                if (!in_array($target_status, $allowed_transitions, true)) {
                    throw new InvalidArgumentException('The requested billing status transition is not allowed.');
                }
            }

            $appointment['billing_status'] = $target_status;
            $appointment['billing_reference'] = $billing_reference === '' ? null : $billing_reference;
            $appointment['billing_notes'] = $billing_notes === '' ? null : $billing_notes;
            $appointment['billing_updated_at'] = date('Y-m-d H:i:s');

            if (in_array($target_status, ['paid', 'paid_by_phone'], true)) {
                $appointment['payment_status'] = 'paid';
            } elseif ($target_status === 'partially_refunded') {
                $appointment['payment_status'] = 'partially-refunded';
            } elseif ($target_status === 'refunded') {
                $appointment['payment_status'] = 'refunded';
            } elseif (in_array($target_status, ['unpaid', 'payment_link_sent'], true)) {
                $appointment['payment_status'] = 'not-paid';
            }

            $this->appointments_model->save($appointment);

            $this->activity_audit->log('billing.status.updated', 'appointment', (string) $appointment_id, [
                'appointment_id' => (int) $appointment_id,
                'customer_id' => (int) ($appointment['id_users_customer'] ?? 0),
                'from_billing_status' => $current_status,
                'to_billing_status' => $target_status,
                'changes' => $this->activity_audit->build_field_changes($before, $appointment, ['update_datetime']),
            ]);

            json_response([
                'success' => true,
                'billing_status' => $appointment['billing_status'],
                'payment_status' => $appointment['payment_status'] ?? null,
                'payment_stage' => $appointment['payment_stage'] ?? null,
                'total_amount' => (float) ($appointment['total_amount'] ?? 0),
                'deposit_amount' => (float) ($appointment['deposit_amount'] ?? 0),
                'remaining_amount' => (float) ($appointment['remaining_amount'] ?? 0),
            ]);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    public function refund(): void
    {
        try {
            if (cannot('edit', PRIV_SYSTEM_SETTINGS)) {
                abort(403, 'Forbidden');
            }

            $appointment_id = (int) request('appointment_id');
            $refund_mode = trim((string) request('refund_mode', 'amount'));
            $refund_value = (float) request('refund_value', 0);
            $refund_reason = trim((string) request('refund_reason', ''));

            if (!$appointment_id || $refund_value <= 0) {
                abort(400, 'Bad Request');
            }

            if (!in_array($refund_mode, ['amount', 'percent'], true)) {
                throw new InvalidArgumentException('Invalid refund mode provided.');
            }

            if (!$this->stripe_gateway->is_enabled()) {
                throw new RuntimeException('Stripe payments are not enabled.');
            }

            $appointment = $this->appointments_model->find($appointment_id);
            $before = $appointment;

            if (!in_array($appointment['billing_status'] ?? '', ['paid', 'paid_by_phone', 'partially_refunded'], true)) {
                throw new RuntimeException('Only paid appointments can be refunded.');
            }

            if (empty($appointment['stripe_payment_intent_id'])) {
                throw new RuntimeException('No Stripe payment intent is available for this appointment.');
            }

            $max_amount_cents = (int) round((float) ($appointment['payment_amount'] ?? 0) * 100);
            if ($max_amount_cents <= 0) {
                throw new RuntimeException('The appointment does not have a refundable payment amount.');
            }

            if ($refund_mode === 'percent') {
                if ($refund_value > 100) {
                    throw new InvalidArgumentException('Refund percent cannot exceed 100.');
                }
                $refund_amount_cents = (int) round(($max_amount_cents * $refund_value) / 100);
            } else {
                $refund_amount_cents = (int) round($refund_value * 100);
            }

            if ($refund_amount_cents <= 0 || $refund_amount_cents > $max_amount_cents) {
                throw new InvalidArgumentException('Refund amount is out of allowed range.');
            }

            $refund = $this->stripe_gateway->create_refund(
                (string) $appointment['stripe_payment_intent_id'],
                $refund_amount_cents,
                $refund_reason !== '' ? $refund_reason : null,
            );

            $is_full_refund = $refund_amount_cents === $max_amount_cents;
            $appointment['billing_status'] = $is_full_refund ? 'refunded' : 'partially_refunded';
            $appointment['payment_status'] = $is_full_refund ? 'refunded' : 'partially-refunded';
            $appointment['billing_reference'] = $refund->id ?? $appointment['billing_reference'];
            $appointment['billing_notes'] = $this->append_refund_note(
                (string) ($appointment['billing_notes'] ?? ''),
                $refund_amount_cents,
                $max_amount_cents,
                $refund_reason,
                (string) ($refund->id ?? ''),
            );
            $appointment['billing_updated_at'] = date('Y-m-d H:i:s');
            $this->appointments_model->save($appointment);

            $this->activity_audit->log('billing.refund.created', 'appointment', (string) $appointment_id, [
                'appointment_id' => (int) $appointment_id,
                'customer_id' => (int) ($appointment['id_users_customer'] ?? 0),
                'refund_amount_cents' => $refund_amount_cents,
                'refund_percent' => round(($refund_amount_cents / max($max_amount_cents, 1)) * 100, 2),
                'stripe_refund_id' => (string) ($refund->id ?? ''),
                'changes' => $this->activity_audit->build_field_changes($before, $appointment, ['update_datetime']),
            ]);

            json_response([
                'success' => true,
                'billing_status' => $appointment['billing_status'],
                'payment_status' => $appointment['payment_status'],
                'payment_stage' => $appointment['payment_stage'] ?? null,
                'total_amount' => (float) ($appointment['total_amount'] ?? 0),
                'deposit_amount' => (float) ($appointment['deposit_amount'] ?? 0),
                'remaining_amount' => (float) ($appointment['remaining_amount'] ?? 0),
                'refund_reference' => $appointment['billing_reference'],
                'refund_amount' => number_format($refund_amount_cents / 100, 2, '.', ''),
            ]);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    public function create_payment_link(): void
    {
        try {
            if (cannot('edit', PRIV_SYSTEM_SETTINGS)) {
                abort(403, 'Forbidden');
            }

            $appointment_id = (int) request('appointment_id');
            $payload = $this->prepare_payment_link($appointment_id);
            $this->activity_audit->log('billing.payment_link.created', 'appointment', (string) $appointment_id, [
                'appointment_id' => (int) $appointment_id,
                'customer_id' => (int) ($payload['appointment']['id_users_customer'] ?? 0),
            ]);
            json_response([
                'success' => true,
                'payment_link' => $payload['payment_link'],
                'appointment' => [
                    'payment_status' => $payload['appointment']['payment_status'] ?? null,
                    'payment_stage' => $payload['appointment']['payment_stage'] ?? null,
                    'total_amount' => (float) ($payload['appointment']['total_amount'] ?? 0),
                    'deposit_amount' => (float) ($payload['appointment']['deposit_amount'] ?? 0),
                    'remaining_amount' => (float) ($payload['appointment']['remaining_amount'] ?? 0),
                ],
            ]);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    public function send_payment_link_email(): void
    {
        try {
            if (cannot('edit', PRIV_SYSTEM_SETTINGS)) {
                abort(403, 'Forbidden');
            }

            $appointment_id = (int) request('appointment_id');
            $payload = $this->prepare_payment_link($appointment_id);

            $settings = [
                'company_name' => setting('company_name'),
                'company_link' => setting('company_link'),
                'company_email' => setting('company_email'),
                'company_logo_email_png' => setting('company_logo_email_png'),
                'company_color' => setting('company_color'),
                'date_format' => setting('date_format'),
                'time_format' => setting('time_format'),
            ];

            $this->email_messages->send_payment_link(
                $payload['appointment'],
                $payload['service'],
                $payload['customer'],
                $settings,
                $payload['customer']['email'],
                $payload['payment_link'],
            );

            $this->activity_audit->log('billing.payment_link.emailed', 'appointment', (string) $appointment_id, [
                'appointment_id' => (int) $appointment_id,
                'customer_id' => (int) ($payload['appointment']['id_users_customer'] ?? 0),
            ]);

            json_response([
                'success' => true,
                'payment_link' => $payload['payment_link'],
                'appointment' => [
                    'payment_status' => $payload['appointment']['payment_status'] ?? null,
                    'payment_stage' => $payload['appointment']['payment_stage'] ?? null,
                    'total_amount' => (float) ($payload['appointment']['total_amount'] ?? 0),
                    'deposit_amount' => (float) ($payload['appointment']['deposit_amount'] ?? 0),
                    'remaining_amount' => (float) ($payload['appointment']['remaining_amount'] ?? 0),
                ],
            ]);
        } catch (Throwable $e) {
            json_exception($e);
        }
    }

    public function retry_final_charge(): void
    {
        try {
            if (cannot('edit', PRIV_SYSTEM_SETTINGS)) {
                abort(403, 'Forbidden');
            }

            $appointment_id = (int) request('appointment_id');
            if (!$appointment_id) {
                abort(400, 'Bad Request');
            }

            $before = $this->appointments_model->find($appointment_id);
            log_message('debug', 'Billing retry_final_charge requested: ' . json_encode([
                'appointment_id' => $appointment_id,
                'payment_stage' => $before['payment_stage'] ?? null,
                'payment_status' => $before['payment_status'] ?? null,
                'remaining_amount' => (float) ($before['remaining_amount'] ?? 0),
                'has_payment_method' => !empty($before['stripe_payment_method_id']),
            ]));

            $appointment = $this->appointment_payments_service->attempt_final_charge($appointment_id, 'admin_retry');

            $this->activity_audit->log('billing.final_charge.retry', 'appointment', (string) $appointment_id, [
                'appointment_id' => (int) $appointment_id,
                'customer_id' => (int) ($appointment['id_users_customer'] ?? 0),
                'payment_stage' => (string) ($appointment['payment_stage'] ?? ''),
                'payment_status' => (string) ($appointment['payment_status'] ?? ''),
                'remaining_amount' => (float) ($appointment['remaining_amount'] ?? 0),
            ]);

            json_response([
                'success' => true,
                'billing_status' => $appointment['billing_status'] ?? 'unpaid',
                'payment_status' => $appointment['payment_status'] ?? 'not-paid',
                'payment_stage' => $appointment['payment_stage'] ?? 'not_paid',
                'total_amount' => (float) ($appointment['total_amount'] ?? 0),
                'deposit_amount' => (float) ($appointment['deposit_amount'] ?? 0),
                'remaining_amount' => (float) ($appointment['remaining_amount'] ?? 0),
                'final_charge_error_code' => $appointment['final_charge_error_code'] ?? null,
                'final_charge_error_message' => $appointment['final_charge_error_message'] ?? null,
                'debug' => [
                    'appointment_id' => (int) ($appointment['id'] ?? $appointment_id),
                    'has_payment_method' => !empty($appointment['stripe_payment_method_id']),
                    'payment_intent_id' => $appointment['stripe_final_payment_intent_id'] ?? null,
                ],
            ]);
        } catch (Throwable $e) {
            log_message('error', 'Billing retry_final_charge failed: ' . json_encode([
                'appointment_id' => (int) request('appointment_id'),
                'error' => $e->getMessage(),
            ]));
            json_exception($e);
        }
    }

    private function prepare_payment_link(int $appointment_id): array
    {
        if (!$appointment_id) {
            abort(400, 'Bad Request');
        }

        if (!$this->stripe_gateway->is_enabled()) {
            throw new RuntimeException('Stripe payments are not enabled.');
        }

        return $this->appointment_payments_service->prepare_remaining_payment_link($appointment_id);
    }

    private function append_refund_note(
        string $existing_notes,
        int $refund_amount_cents,
        int $max_amount_cents,
        string $refund_reason,
        string $refund_reference,
    ): string {
        $notes = trim($existing_notes);
        $percent = round(($refund_amount_cents / $max_amount_cents) * 100, 2);
        $parts = [
            sprintf(
                '[%s] Refund processed: %s (%s%%)',
                date('Y-m-d H:i:s'),
                number_format($refund_amount_cents / 100, 2, '.', ''),
                rtrim(rtrim((string) $percent, '0'), '.'),
            ),
        ];

        if ($refund_reference !== '') {
            $parts[] = 'ref=' . $refund_reference;
        }

        if ($refund_reason !== '') {
            $parts[] = 'reason=' . $refund_reason;
        }

        $line = implode(' | ', $parts);

        return $notes === '' ? $line : $notes . PHP_EOL . $line;
    }
}
