<?php extend('layouts/booking_layout'); ?>

<?php section('content'); ?>

<div class="wizard-frame booking-section px-4 sm:px-5">
    <div class="frame-container">
        <div class="d-flex justify-content-between align-items-center border-bottom mb-4 py-2">
            <h2 class="frame-title" id="customer-form-title">Form</h2>
            <a href="<?= site_url('customer/forms') ?>" class="btn btn-outline-secondary">
                <i class="fas fa-arrow-left me-2"></i>
                Back to Forms
            </a>
        </div>

        <div class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-4">
            <div id="customer-form-content" class="prose prose-sm max-w-none"></div>
            <div id="customer-form-fields" class="mt-4 d-flex flex-column gap-3"></div>
            <div class="mt-4">
                <button type="button" id="customer-form-submit" class="btn btn-primary w-100 py-3">
                    Complete
                </button>
            </div>
            <div id="customer-form-status" class="mt-3 text-sm text-slate-500"></div>
        </div>
        <div id="customer-form-message" class="alert mt-3 d-none"></div>
    </div>
</div>

<?php end_section('content'); ?>

<?php section('scripts'); ?>

<script src="<?= asset_url('assets/js/http/customer_forms_http_client.js') ?>"></script>
<script src="<?= asset_url('assets/js/pages/customer_form_view.js') ?>"></script>

<?php end_section('scripts'); ?>
