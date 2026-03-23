<?php
/**
 * Local variables.
 *
 * @var array $grouped_timezones
 */
?>

<div id="wizard-frame-3" class="wizard-frame booking-section" style="display:none;">
    <div class="frame-container">

        <h2 class="frame-title booking-frame-title"><?= lang('appointment_date_and_time') ?></h2>

        <div class="frame-content mt-6">
            <div class="booking-frame-content">
                <div class="date-picker-container mb-6">
                    <div class="date-picker">
                        <div class="months-container" id="months-container"></div>
                        <div class="dates-container" id="dates-container"></div>
                    </div>
                </div>

                <div class="date-time-summary mb-4 mt-4 flex items-center justify-between gap-3">
                    <p id="selected-date" class="mb-0 text-sm font-medium text-slate-900">
                        <?= lang('select_time') ?>
                    </p>
                    <div id="select-time" class="flex flex-none items-center">
                        <?php component('timezone_dropdown', [
                            'attributes' => 'id="select-timezone" class="form-select" value="UTC"',
                            'grouped_timezones' => $grouped_timezones,
                        ]); ?>
                    </div>
                </div>

                <div class="d-none">
                    <div id="select-date"></div>
                </div>

                <?php slot('after_select_date'); ?>

                <div id="available-hours-container" class="mt-4">
                    <?php slot('after_select_timezone'); ?>

                    <div id="available-hours"></div>

                    <?php slot('after_available_hours'); ?>
                </div>
            </div>
        </div>
    </div>

    <div class="command-buttons mt-6">
        <div class="booking-frame-content">
            <button type="button" id="button-next-3" class="button-next booking-button" data-step_index="3">
                <?= lang('next') ?>
                <i class="fas fa-chevron-right ml-2"></i>
            </button>
        </div>
    </div>
</div>
