<?php extend('layouts/message_layout'); ?>

<?php section('content'); ?>

<div class="flex justify-center">
    <img id="message-icon" class="mb-6 h-16 w-16" src="<?= vars('message_icon') ?>" alt="warning">
</div>

<div class="text-center">
    <h4 class="frame-title booking-frame-title"><?= vars('message_title') ?></h4>

    <p class="text-slate-700"><?= vars('message_text') ?></p>
</div>

<?php end_section('content'); ?>

<?php section('scripts'); ?>

<?php component('google_analytics_script', ['google_analytics_code' => vars('google_analytics_code')]); ?>
<?php component('matomo_analytics_script', [
    'matomo_analytics_url' => vars('matomo_analytics_url'),
    'matomo_analytics_site_id' => vars('matomo_analytics_site_id'),
]); ?>

<?php end_section('scripts'); ?>

