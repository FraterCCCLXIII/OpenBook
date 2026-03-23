<?php extend('layouts/backend_layout'); ?>

<?php section('content'); ?>

<div class="container-fluid backend-page" id="provider-bookings-page">
    <div class="row">
        <div class="col-12 col-lg-6">
            <?php component('provider_upcoming_bookings'); ?>
        </div>
    </div>
</div>

<?php end_section('content'); ?>
