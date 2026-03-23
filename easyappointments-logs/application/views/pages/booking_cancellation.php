<?php extend('layouts/message_layout'); ?>

<?php section('content'); ?>

<div class="flex justify-center">
    <img id="success-icon" class="mb-6 h-16 w-16" src="<?= base_url('assets/img/success.png') ?>" alt="success"/>
</div>

<div class="text-center">
    <h4 class="frame-title booking-frame-title"><?= lang('appointment_cancelled_title') ?></h4>

    <p class="text-slate-700">
        <?= lang('appointment_cancelled') ?>
    </p>

    <div class="mt-6 flex justify-center">
        <a href="<?= site_url() ?>" class="booking-button sm:w-auto sm:px-6">
            <i class="fas fa-calendar-alt mr-2"></i>
            <?= lang('go_to_booking_page') ?>
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

