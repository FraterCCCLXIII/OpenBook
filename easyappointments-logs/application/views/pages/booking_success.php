<?php extend('layouts/message_layout'); ?>

<?php section('content'); ?>

<div class="flex justify-center mt-4">
    <i id="success-icon" class="fas fa-circle-check mb-6"
       style="width: 96px; height: 96px; font-size: 96px; display: inline-flex; align-items: center; justify-content: center; color: <?= e(vars('company_color') ?: '#439a82') ?>;"></i>
</div>

<div class="text-center">
    <h4 class="frame-title booking-frame-title"><?= lang('appointment_registered') ?></h4>

    <p class="text-slate-700">
        Payment successful. <?= lang('appointment_details_was_sent_to_you') ?>
    </p>

    <p class="mt-4 text-sm text-slate-500">
        <?= lang('check_spam_folder') ?>
    </p>

    <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <a href="<?= site_url('dashboard') ?>" class="booking-button sm:w-auto sm:px-6">
            <i class="fas fa-arrow-left mr-2"></i>
            Return to Dashboard
        </a>
        <a href="<?= site_url() ?>" class="booking-button sm:w-auto sm:px-6">
            <i class="fas fa-calendar-alt mr-2"></i>
            <?= lang('go_to_booking_page') ?>
        </a>

        <a href="<?= vars('add_to_google_url') ?>" id="add-to-google-calendar"
           class="booking-button sm:w-auto sm:px-6" target="_blank">
            <i class="fas fa-plus mr-2"></i>
            <?= lang('add_to_google_calendar') ?>
        </a>
    </div>
</div>

<?php end_section('content'); ?>

<?php section('scripts'); ?>

<?php component('google_analytics_script', ['google_analytics_code' => vars('google_analytics_code')]); ?>
<?php component('matomo_analytics_script', [
    'matomo_analytics_url' => vars('matomo_analytics_url'),
    'matomo_analytics_site_id' => vars('matomo_analytics_site_id'),
]); ?>

<?php end_section('scripts'); ?>
