<?php extend('layouts/backend_layout'); ?>

<?php section('content'); ?>
<div id="billing-page" class="container backend-page">
    <div class="row mb-4">
        <div class="col-12 d-flex justify-content-between align-items-end gap-3 flex-wrap">
            <h2 class="backend-page-title mb-0">
                Billing
            </h2>
            <div class="btn-group" role="group" aria-label="Billing View Toggle">
                <button type="button" id="billing-view-appointments" class="btn btn-sm btn-primary">Appointments</button>
                <button type="button" id="billing-view-transactions" class="btn btn-sm btn-outline-primary">Transactions</button>
            </div>
        </div>
    </div>
    <div class="row">
        <div class="col-12" id="billing-appointments-view">
            <div class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white shadow-sm overflow-hidden">
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead class="bg-light">
                                <tr>
                                    <th class="ps-4">Date</th>
                                    <th>Customer</th>
                                    <th>Service</th>
                                    <th>Amount</th>
                                    <th>Activity</th>
                                    <th>Billing</th>
                                    <th>Payment</th>
                                    <th>Reference</th>
                                    <th class="pe-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if (empty($transactions)): ?>
                                    <tr>
                                        <td colspan="9" class="text-center py-4 text-muted">No appointments found.</td>
                                    </tr>
                                <?php else: ?>
                                    <?php foreach ($transactions as $transaction): ?>
                                        <?php
                                        $billing_status = $transaction['billing_status'] ?? 'unpaid';
                                        $payment_status = $transaction['payment_status'] ?? 'not-paid';
                                        ?>
                                        <tr
                                            data-appointment-id="<?= (int) $transaction['id'] ?>"
                                            data-payment-status="<?= e((string) ($transaction['payment_status'] ?? 'not-paid')) ?>"
                                            data-payment-stage="<?= e((string) ($transaction['payment_stage'] ?? 'not_paid')) ?>"
                                            data-total-amount="<?= e(number_format((float) ($transaction['total_amount'] ?? 0), 2, '.', '')) ?>"
                                            data-deposit-amount="<?= e(number_format((float) ($transaction['deposit_amount'] ?? 0), 2, '.', '')) ?>"
                                            data-remaining-amount="<?= e(number_format((float) ($transaction['remaining_amount'] ?? 0), 2, '.', '')) ?>">
                                            <td class="ps-4"><?= date('Y-m-d H:i', strtotime($transaction['book_datetime'])) ?></td>
                                            <td><?= e($transaction['first_name'] . ' ' . $transaction['last_name']) ?></td>
                                            <td><?= e($transaction['service_name']) ?></td>
                                            <td>
                                                <div class="billing-amount-main"><?= number_format((float) ($transaction['payment_amount'] ?? 0), 2) ?></div>
                                                <div class="billing-amount-meta text-muted small"></div>
                                            </td>
                                            <td>
                                                <button type="button" class="btn btn-outline-secondary btn-sm js-view-appointment-activity">
                                                    View Activity
                                                </button>
                                            </td>
                                            <td>
                                                <?php
                                                $billing_badge_class = in_array($billing_status, ['paid', 'paid_by_phone'], true)
                                                    ? 'success'
                                                    : ($billing_status === 'partially_refunded' ? 'info' : 'warning');
                                                ?>
                                                <span class="badge billing-status-badge bg-<?= $billing_badge_class ?>">
                                                    <?= e(ucwords(str_replace('_', ' ', $billing_status))) ?>
                                                </span>
                                                <select class="form-select form-select-sm mt-2 billing-status-select" aria-label="Billing Status">
                                                    <?php foreach (($billing_status_options ?? []) as $status_key => $status_label): ?>
                                                        <option value="<?= e($status_key) ?>" <?= $status_key === $billing_status ? 'selected' : '' ?>>
                                                            <?= e($status_label) ?>
                                                        </option>
                                                    <?php endforeach; ?>
                                                </select>
                                                <textarea
                                                    class="form-control form-control-sm mt-2 billing-notes-input"
                                                    rows="2"
                                                    placeholder="Billing notes"><?= e($transaction['billing_notes'] ?? '') ?></textarea>
                                            </td>
                                            <td>
                                                <span class="badge payment-status-badge bg-<?= $payment_status === 'paid' ? 'success' : ($payment_status === 'pending' ? 'info' : 'secondary') ?>">
                                                    <?= e(ucfirst($payment_status)) ?>
                                                </span>
                                            </td>
                                            <td>
                                                <input
                                                    type="text"
                                                    class="form-control form-control-sm billing-reference-input"
                                                    value="<?= e($transaction['billing_reference'] ?: $transaction['stripe_payment_intent_id']) ?>"
                                                    placeholder="Reference / Intent ID">
                                            </td>
                                            <td class="pe-4">
                                                <div class="dropdown">
                                                    <button
                                                        class="btn btn-outline-secondary btn-sm dropdown-toggle"
                                                        type="button"
                                                        data-bs-toggle="dropdown"
                                                        aria-expanded="false"
                                                        aria-label="Billing Actions">
                                                        Actions
                                                    </button>
                                                    <ul class="dropdown-menu dropdown-menu-end">
                                                        <li>
                                                            <button type="button" class="dropdown-item js-send-payment-link-email">
                                                                Send Payment Link
                                                            </button>
                                                        </li>
                                                        <li>
                                                            <button type="button" class="dropdown-item js-open-payment-link">
                                                                Open Link
                                                            </button>
                                                        </li>
                                                        <li>
                                                            <button type="button" class="dropdown-item js-copy-payment-link">
                                                                Copy Link
                                                            </button>
                                                        </li>
                                                        <li><hr class="dropdown-divider"></li>
                                                        <li>
                                                            <button type="button" class="dropdown-item js-save-billing-status">
                                                                Save Billing
                                                            </button>
                                                        </li>
                                                        <li>
                                                            <button type="button" class="dropdown-item js-retry-final-charge">
                                                                Retry Final Charge
                                                            </button>
                                                        </li>
                                                        <li>
                                                            <button type="button" class="dropdown-item text-danger js-refund">
                                                                Refund
                                                            </button>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="row mt-4 d-none" id="billing-transactions-view">
        <div class="col-12">
            <div class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white shadow-sm overflow-hidden">
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead class="bg-light">
                            <tr>
                                <th class="ps-4">Date</th>
                                <th>Appointment</th>
                                <th>Customer</th>
                                <th>Service</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Amount</th>
                                <th class="pe-4">Intent</th>
                            </tr>
                            </thead>
                            <tbody>
                            <?php if (empty($payment_transactions)): ?>
                                <tr>
                                    <td colspan="8" class="text-center py-4 text-muted">No payment transactions found.</td>
                                </tr>
                            <?php else: ?>
                                <?php foreach ($payment_transactions as $payment_transaction): ?>
                                    <tr>
                                        <td class="ps-4"><?= e(date('Y-m-d H:i', strtotime($payment_transaction['create_datetime'] ?? 'now'))) ?></td>
                                        <td>#<?= (int) ($payment_transaction['id_appointments'] ?? 0) ?></td>
                                        <td><?= e(($payment_transaction['first_name'] ?? '') . ' ' . ($payment_transaction['last_name'] ?? '')) ?></td>
                                        <td><?= e($payment_transaction['service_name'] ?? '') ?></td>
                                        <td><?= e(ucfirst((string) ($payment_transaction['kind'] ?? 'payment'))) ?></td>
                                        <td><?= e(ucfirst((string) ($payment_transaction['status'] ?? 'unknown'))) ?></td>
                                        <td><?= e(number_format((float) ($payment_transaction['amount'] ?? 0), 2)) ?></td>
                                        <td class="pe-4"><small><?= e((string) ($payment_transaction['stripe_payment_intent_id'] ?? '-')) ?></small></td>
                                    </tr>
                                <?php endforeach; ?>
                            <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="row mt-4">
        <div class="col-12">
            <div class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-4">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h3 class="h6 mb-0">Appointment Activity Timeline</h3>
                    <small id="billing-activity-meta" class="text-muted">Select an appointment to view activity.</small>
                </div>
                <div id="billing-activity-timeline" class="d-flex flex-column gap-2"></div>
            </div>
        </div>
    </div>
</div>
<?php end_section('content'); ?>

<?php section('scripts'); ?>
<script src="<?= asset_url('assets/js/components/activity_timeline.js') ?>"></script>
<script src="<?= asset_url('assets/js/pages/billing.js') ?>"></script>
<?php end_section('scripts'); ?>
