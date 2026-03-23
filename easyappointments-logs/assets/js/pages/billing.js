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

App.Pages.Billing = (function () {
    const $billingPage = $('#billing-page');
    const $appointmentsView = $('#billing-appointments-view');
    const $transactionsView = $('#billing-transactions-view');
    const $timeline = $('#billing-activity-timeline');
    const $timelineMeta = $('#billing-activity-meta');
    const RETRY_DEBUG_PREFIX = '[Billing][RetryFinalCharge]';

    function notify(message) {
        if (App.Layouts?.Backend?.displayNotification) {
            App.Layouts.Backend.displayNotification(message);
            return;
        }

        window.alert(message);
    }

    function parseHttpError(error) {
        const details = {
            status: error?.status,
            message: error?.message || 'Unknown error',
            payload: null,
            raw: error,
        };

        if (typeof details.message === 'string') {
            try {
                const payload = JSON.parse(details.message);
                details.payload = payload;
                if (payload?.message) {
                    details.message = payload.message;
                }
            } catch (jsonParseError) {
                // Keep original message when it is not JSON.
            }
        }

        return details;
    }

    function setBusy($row, busy) {
        $row.find('button, input, textarea, select').prop('disabled', busy);
    }

    function parseAmount(value) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    function formatAmount(value) {
        return parseAmount(value).toFixed(2);
    }

    function getRowPaymentMeta($row) {
        return {
            paymentStatus: String($row.attr('data-payment-status') || 'not-paid').toLowerCase(),
            paymentStage: String($row.attr('data-payment-stage') || 'not_paid').toLowerCase(),
            totalAmount: parseAmount($row.attr('data-total-amount')),
            depositAmount: parseAmount($row.attr('data-deposit-amount')),
            remainingAmount: parseAmount($row.attr('data-remaining-amount')),
        };
    }

    function setRowPaymentMeta($row, updates) {
        if (Object.prototype.hasOwnProperty.call(updates, 'paymentStatus')) {
            $row.attr('data-payment-status', String(updates.paymentStatus || 'not-paid').toLowerCase());
        }

        if (Object.prototype.hasOwnProperty.call(updates, 'paymentStage')) {
            $row.attr('data-payment-stage', String(updates.paymentStage || 'not_paid').toLowerCase());
        }

        if (Object.prototype.hasOwnProperty.call(updates, 'totalAmount')) {
            $row.attr('data-total-amount', formatAmount(updates.totalAmount));
        }

        if (Object.prototype.hasOwnProperty.call(updates, 'depositAmount')) {
            $row.attr('data-deposit-amount', formatAmount(updates.depositAmount));
        }

        if (Object.prototype.hasOwnProperty.call(updates, 'remainingAmount')) {
            $row.attr('data-remaining-amount', formatAmount(updates.remainingAmount));
        }
    }

    function getPaymentLabel(meta) {
        if (meta.depositAmount > 0 && meta.remainingAmount > 0) {
            if (meta.paymentStage === 'deposit_paid') {
                return `Deposit paid • Remaining ${formatAmount(meta.remainingAmount)}`;
            }

            if (meta.paymentStage === 'deposit_pending') {
                return `Deposit pending • Remaining ${formatAmount(meta.remainingAmount)}`;
            }

            if (meta.paymentStage === 'final_charge_pending') {
                return `Final charge pending • Remaining ${formatAmount(meta.remainingAmount)}`;
            }

            if (meta.paymentStage === 'final_charge_failed') {
                return `Final charge failed • Remaining ${formatAmount(meta.remainingAmount)}`;
            }

            return `Partially paid • Remaining ${formatAmount(meta.remainingAmount)}`;
        }

        if (meta.paymentStage === 'fully_paid' || (meta.paymentStatus === 'paid' && meta.remainingAmount <= 0)) {
            return 'Paid in full';
        }

        if (meta.paymentStatus === 'pending') {
            return 'Payment pending';
        }

        if (meta.paymentStatus === 'not-paid') {
            return 'Not paid';
        }

        if (meta.paymentStatus === 'partially-refunded') {
            return 'Partially refunded';
        }

        return meta.paymentStatus.replace(/_/g, ' ');
    }

    function getPaymentBadgeClass(meta) {
        if (meta.paymentStage === 'final_charge_failed') {
            return 'bg-danger';
        }

        if (meta.paymentStage === 'final_charge_pending' || meta.paymentStatus === 'pending') {
            return 'bg-info';
        }

        if (meta.paymentStatus === 'paid' || meta.paymentStage === 'fully_paid') {
            return 'bg-success';
        }

        if (meta.paymentStatus === 'partially-refunded') {
            return 'bg-secondary';
        }

        return 'bg-secondary';
    }

    function updateAmountBreakdown($row, meta) {
        const $meta = $row.find('.billing-amount-meta');
        if (!$meta.length) {
            return;
        }

        if (meta.depositAmount > 0 && meta.remainingAmount > 0) {
            $meta.text(
                `Deposit ${formatAmount(meta.depositAmount)} • Remaining ${formatAmount(meta.remainingAmount)} • Total ${formatAmount(meta.totalAmount)}`,
            );
            return;
        }

        if (meta.totalAmount > 0) {
            $meta.text(`Total ${formatAmount(meta.totalAmount)}`);
            return;
        }

        $meta.text('');
    }

    function refreshPaymentDisplay($row) {
        const meta = getRowPaymentMeta($row);
        const paymentClass = getPaymentBadgeClass(meta);
        const paymentLabel = getPaymentLabel(meta);

        $row.find('.payment-status-badge')
            .removeClass('bg-success bg-info bg-secondary bg-danger')
            .addClass(paymentClass)
            .text(paymentLabel);

        updateAmountBreakdown($row, meta);
    }

    function updateStatusBadges($row, billingStatus, paymentUpdates = {}) {
        const billingClass = ['paid', 'paid_by_phone'].includes(billingStatus)
            ? 'bg-success'
            : billingStatus === 'partially_refunded'
              ? 'bg-info'
              : 'bg-warning';
        $row.find('.billing-status-badge')
            .removeClass('bg-success bg-warning bg-secondary bg-info')
            .addClass(billingClass)
            .text(billingStatus.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()));
        setRowPaymentMeta($row, paymentUpdates);
        refreshPaymentDisplay($row);
    }

    async function refundAppointment($row, refundMode, refundValue, refundReason) {
        const appointmentId = Number($row.data('appointment-id'));
        setBusy($row, true);

        try {
            const response = await App.Utils.Http.request('POST', 'billing/refund', {
                appointment_id: appointmentId,
                refund_mode: refundMode,
                refund_value: refundValue,
                refund_reason: refundReason || '',
            });

            updateStatusBadges($row, response.billing_status, {
                paymentStatus: response.payment_status || 'refunded',
                paymentStage: response.payment_stage,
                totalAmount: response.total_amount,
                depositAmount: response.deposit_amount,
                remainingAmount: response.remaining_amount,
            });
            $row.find('.billing-status-select').val(response.billing_status);

            if (response.refund_reference) {
                $row.find('.billing-reference-input').val(response.refund_reference);
            }

            notify(`Refund processed: ${response.refund_amount}`);
        } catch (error) {
            notify(error.message || 'Could not process refund.');
        } finally {
            setBusy($row, false);
        }
    }

    function showRefundDialog($row) {
        const paidAmount = ($row.find('td').eq(3).text() || '').trim();

        const content = `
            <div class="d-grid gap-3">
                <div>
                    <label for="refund-mode" class="form-label">Refund Type</label>
                    <select id="refund-mode" class="form-select form-select-sm">
                        <option value="amount">Amount</option>
                        <option value="percent">Percent</option>
                    </select>
                </div>
                <div>
                    <label for="refund-value" class="form-label">Value</label>
                    <input id="refund-value" type="number" min="0.01" step="0.01" class="form-control form-control-sm" />
                    <div class="form-text">Paid amount: ${paidAmount}</div>
                </div>
                <div>
                    <label for="refund-reason" class="form-label">Reason (optional)</label>
                    <textarea id="refund-reason" class="form-control form-control-sm" rows="2"></textarea>
                </div>
            </div>
        `;

        App.Utils.Message.show('Refund Payment', content, [
            {
                text: 'Cancel',
                className: 'btn btn-outline-secondary',
                click: (event, messageModal) => messageModal.hide(),
            },
            {
                text: 'Refund',
                className: 'btn btn-danger',
                click: async (event, messageModal) => {
                    const refundMode = $('#refund-mode').val();
                    const refundValue = Number($('#refund-value').val());
                    const refundReason = String($('#refund-reason').val() || '');

                    if (!refundValue || refundValue <= 0) {
                        notify('Please provide a valid refund value.');
                        return;
                    }

                    if (refundMode === 'percent' && refundValue > 100) {
                        notify('Percent refund cannot exceed 100.');
                        return;
                    }

                    messageModal.hide();
                    await refundAppointment($row, refundMode, refundValue, refundReason);
                },
            },
        ]);
    }

    async function createPaymentLink(appointmentId) {
        return App.Utils.Http.request('POST', 'billing/create_payment_link', {
            appointment_id: appointmentId,
        });
    }

    async function saveBillingStatus($row, billingStatusOverride = null) {
        const appointmentId = Number($row.data('appointment-id'));
        const billingStatus = billingStatusOverride || $row.find('.billing-status-select').val();
        const billingReference = $row.find('.billing-reference-input').val();
        const billingNotes = $row.find('.billing-notes-input').val();

        setBusy($row, true);

        try {
            const response = await App.Utils.Http.request('POST', 'billing/update_status', {
                appointment_id: appointmentId,
                billing_status: billingStatus,
                billing_reference: billingReference,
                billing_notes: billingNotes,
            });

            updateStatusBadges($row, response.billing_status, {
                paymentStatus: response.payment_status || 'not-paid',
                paymentStage: response.payment_stage,
                totalAmount: response.total_amount,
                depositAmount: response.deposit_amount,
                remainingAmount: response.remaining_amount,
            });
            notify('Billing status updated.');
        } catch (error) {
            notify(error.message || 'Could not update billing status.');
        } finally {
            setBusy($row, false);
        }
    }

    function addEventListeners() {
        $billingPage.on('click', '#billing-view-appointments', () => {
            $appointmentsView.removeClass('d-none');
            $transactionsView.addClass('d-none');
            $('#billing-view-appointments').removeClass('btn-outline-primary').addClass('btn-primary');
            $('#billing-view-transactions').removeClass('btn-primary').addClass('btn-outline-primary');
        });

        $billingPage.on('click', '#billing-view-transactions', () => {
            $transactionsView.removeClass('d-none');
            $appointmentsView.addClass('d-none');
            $('#billing-view-transactions').removeClass('btn-outline-primary').addClass('btn-primary');
            $('#billing-view-appointments').removeClass('btn-primary').addClass('btn-outline-primary');
        });

        $billingPage.on('click', '.js-save-billing-status', async (event) => {
            const $row = $(event.currentTarget).closest('tr');
            await saveBillingStatus($row);
        });

        $billingPage.on('click', '.js-view-appointment-activity', async (event) => {
            const $row = $(event.currentTarget).closest('tr');
            const appointmentId = Number($row.data('appointment-id'));
            await loadAppointmentActivity(appointmentId);
        });

        $billingPage.on('click', '.js-open-payment-link', async (event) => {
            const $row = $(event.currentTarget).closest('tr');
            const appointmentId = Number($row.data('appointment-id'));
            setBusy($row, true);
            try {
                const response = await createPaymentLink(appointmentId);
                window.open(response.payment_link, '_blank', 'noopener,noreferrer');
                updateStatusBadges($row, 'payment_link_sent', {
                    paymentStatus: 'pending',
                    paymentStage: response.appointment?.payment_stage || 'final_charge_pending',
                    totalAmount: response.appointment?.total_amount,
                    depositAmount: response.appointment?.deposit_amount,
                    remainingAmount: response.appointment?.remaining_amount,
                });
                $row.find('.billing-status-select').val('payment_link_sent');
                notify('Payment link opened.');
            } catch (error) {
                notify(error.message || 'Could not open payment link.');
            } finally {
                setBusy($row, false);
            }
        });

        $billingPage.on('click', '.js-copy-payment-link', async (event) => {
            const $row = $(event.currentTarget).closest('tr');
            const appointmentId = Number($row.data('appointment-id'));
            setBusy($row, true);
            try {
                const response = await createPaymentLink(appointmentId);
                if (navigator.clipboard?.writeText) {
                    await navigator.clipboard.writeText(response.payment_link);
                } else {
                    window.prompt('Copy payment link:', response.payment_link);
                }
                updateStatusBadges($row, 'payment_link_sent', {
                    paymentStatus: 'pending',
                    paymentStage: response.appointment?.payment_stage || 'final_charge_pending',
                    totalAmount: response.appointment?.total_amount,
                    depositAmount: response.appointment?.deposit_amount,
                    remainingAmount: response.appointment?.remaining_amount,
                });
                $row.find('.billing-status-select').val('payment_link_sent');
                notify('Payment link copied.');
            } catch (error) {
                notify(error.message || 'Could not copy payment link.');
            } finally {
                setBusy($row, false);
            }
        });

        $billingPage.on('click', '.js-send-payment-link-email', async (event) => {
            const $row = $(event.currentTarget).closest('tr');
            const appointmentId = Number($row.data('appointment-id'));
            setBusy($row, true);
            try {
                const response = await App.Utils.Http.request('POST', 'billing/send_payment_link_email', {
                    appointment_id: appointmentId,
                });
                updateStatusBadges($row, 'payment_link_sent', {
                    paymentStatus: 'pending',
                    paymentStage: response.appointment?.payment_stage || 'final_charge_pending',
                    totalAmount: response.appointment?.total_amount,
                    depositAmount: response.appointment?.deposit_amount,
                    remainingAmount: response.appointment?.remaining_amount,
                });
                $row.find('.billing-status-select').val('payment_link_sent');
                notify('Payment link email sent.');
            } catch (error) {
                notify(error.message || 'Could not send payment link email.');
            } finally {
                setBusy($row, false);
            }
        });

        $billingPage.on('click', '.js-refund', (event) => {
            const $row = $(event.currentTarget).closest('tr');
            showRefundDialog($row);
        });

        $billingPage.on('click', '.js-retry-final-charge', async (event) => {
            const $row = $(event.currentTarget).closest('tr');
            const appointmentId = Number($row.data('appointment-id'));
            const beforeMeta = getRowPaymentMeta($row);
            console.debug(`${RETRY_DEBUG_PREFIX} Starting retry`, {
                appointmentId,
                beforeMeta,
            });
            setBusy($row, true);
            try {
                const response = await App.Utils.Http.request('POST', 'billing/retry_final_charge', {
                    appointment_id: appointmentId,
                });
                console.debug(`${RETRY_DEBUG_PREFIX} Retry response`, {
                    appointmentId,
                    response,
                });
                updateStatusBadges($row, response.billing_status || 'unpaid', {
                    paymentStatus: response.payment_status || 'not-paid',
                    paymentStage: response.payment_stage,
                    totalAmount: response.total_amount,
                    depositAmount: response.deposit_amount,
                    remainingAmount: response.remaining_amount,
                });
                if (response.payment_stage === 'final_charge_failed' || response.remaining_amount > 0) {
                    console.warn(`${RETRY_DEBUG_PREFIX} Retry did not settle full balance`, {
                        appointmentId,
                        paymentStage: response.payment_stage,
                        remainingAmount: response.remaining_amount,
                        finalChargeErrorCode: response.final_charge_error_code,
                        finalChargeErrorMessage: response.final_charge_error_message,
                        debug: response.debug,
                    });
                }
                notify(response.remaining_amount > 0 ? 'Retry attempted but balance remains.' : 'Final charge succeeded.');
            } catch (error) {
                const parsedError = parseHttpError(error);
                console.error(`${RETRY_DEBUG_PREFIX} Retry request failed`, parsedError);
                notify(parsedError.message || 'Could not retry final charge.');
            } finally {
                setBusy($row, false);
            }
        });
    }

    function initialize() {
        $billingPage.find('tbody tr[data-appointment-id]').each((index, row) => {
            refreshPaymentDisplay($(row));
        });
        App.Components.ActivityTimeline.render($timeline, []);
        addEventListeners();
    }

    async function loadAppointmentActivity(appointmentId) {
        if (!appointmentId) {
            return;
        }

        $timelineMeta.text(`Loading activity for appointment #${appointmentId}...`);
        try {
            const response = await App.Utils.Http.request('POST', 'logs/events', {
                appointment_id: appointmentId,
                limit: 100,
                offset: 0,
            });
            const items = response.items || [];
            App.Components.ActivityTimeline.render($timeline, items);
            $timelineMeta.text(
                items.length
                    ? `Showing ${items.length} entries for appointment #${appointmentId}.`
                    : `No activity found for appointment #${appointmentId}.`,
            );
        } catch (error) {
            $timelineMeta.text(`Could not load activity for appointment #${appointmentId}.`);
        }
    }

    return {
        initialize,
    };
})();

window.addEventListener('DOMContentLoaded', () => {
    App.Pages.Billing.initialize();
});
