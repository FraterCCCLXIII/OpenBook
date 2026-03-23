<?php extend('layouts/backend_layout'); ?>

<?php section('content'); ?>

<div id="account-form-view-page" class="container backend-page">
    <div class="row settings-layout">
        <div class="col-sm-3 settings-nav-panel ps-0">
            <?php component('account_nav', [
                'active_nav' => 'account/forms',
                'show_forms_nav' => vars('show_forms_nav', false),
                'show_service_area_nav' => vars('show_service_area_nav', false),
                'show_availability_nav' => vars('show_availability_nav', false),
            ]); ?>
        </div>
        <div class="col-sm-9 settings-content">
            <div class="d-flex justify-content-between align-items-center border-bottom mb-4 py-2">
                <h4 class="text-dark mb-0 fw-medium fs-3" id="account-form-title">Form</h4>
                <a href="<?= site_url('account/forms') ?>" class="btn btn-outline-secondary">
                    <i class="fas fa-arrow-left me-2"></i>
                    Back to Forms
                </a>
            </div>
            <div class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-4">
                <div id="account-form-content" class="prose prose-sm max-w-none"></div>
                <div id="account-form-fields" class="mt-4 d-flex flex-column gap-3"></div>
                <div class="mt-4 d-flex justify-content-end">
                    <button type="button" id="account-form-submit" class="btn btn-primary">
                        Complete / Submit
                    </button>
                </div>
                <div id="account-form-status" class="mt-3 text-sm text-slate-500"></div>
            </div>
            <div id="account-form-message" class="alert mt-3 d-none"></div>
        </div>
    </div>
</div>

<?php end_section('content'); ?>

<?php section('scripts'); ?>

<script src="<?= asset_url('assets/js/http/forms_http_client.js') ?>"></script>
<script src="<?= asset_url('assets/js/pages/account_form_view.js') ?>"></script>

<?php end_section('scripts'); ?>
