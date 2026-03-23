<?php
/**
 * Local variables.
 *
 * @var bool $manage_mode
 * @var array $appointment_data
 * @var bool $display_delete_personal_information
 */
?>

<?php if ($manage_mode): ?>
    <div id="cancel-appointment-frame"
         class="booking-header-bar mb-4 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
        <small><?= lang('cancel_appointment_hint') ?></small>
        <form id="cancel-appointment-form" method="post"
              action="<?= site_url('booking_cancellation/of/' . $appointment_data['hash']) ?>">

            <input id="hidden-cancellation-reason" name="cancellation_reason" type="hidden">

            <button id="cancel-appointment"
                    class="inline-flex items-center justify-center rounded-xl bg-amber-500 px-3 py-2 text-sm font-medium text-white transition hover:brightness-110">
                <i class="fas fa-trash mr-2"></i>
                <?= lang('cancel') ?>
            </button>
        </form>
    </div>
    <?php if ($display_delete_personal_information): ?>
        <div
            class="booking-header-bar mb-4 flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 sm:flex-row sm:items-center sm:justify-between">
            <small><?= lang('delete_personal_information_hint') ?></small>
            <button id="delete-personal-information"
                    class="inline-flex items-center justify-center rounded-xl bg-rose-500 px-3 py-2 text-sm font-medium text-white transition hover:brightness-110">
                <i class="fas fa-trash mr-2"></i>
                <?= lang('delete') ?>
            </button>
        </div>
    <?php endif; ?>
<?php endif; ?>
