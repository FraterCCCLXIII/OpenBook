<?php extend('layouts/backend_layout'); ?>

<?php section('content'); ?>

<div id="forms-user-view-page" class="container backend-page">
    <div class="row settings-layout">
        <div class="col-sm-12 settings-content">
            <div class="d-flex justify-content-between align-items-center border-bottom mb-4 py-2">
                <h4 class="text-dark mb-0 fw-medium fs-3" id="forms-user-title">Form</h4>
                <a href="javascript:history.back()" class="btn btn-outline-secondary">
                    <i class="fas fa-arrow-left me-2"></i>
                    Back
                </a>
            </div>
            <div class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-4">
                <div id="forms-user-content" class="prose prose-sm max-w-none"></div>
                <div id="forms-user-fields" class="mt-4 d-flex flex-column gap-3"></div>
                <div class="mt-4 d-flex justify-content-end gap-2">
                    <button type="button" id="forms-user-reminder" class="btn btn-outline-primary d-none">
                        Send Reminder
                    </button>
                    <button type="button" id="forms-user-reset" class="btn btn-outline-danger d-none">
                        Reset Form
                    </button>
                </div>
                <div id="forms-user-status" class="mt-3 text-sm text-slate-500"></div>
            </div>
            <div id="forms-user-message" class="alert mt-3 d-none"></div>
        </div>
    </div>
</div>

<?php end_section('content'); ?>

<?php section('scripts'); ?>

<script src="<?= asset_url('assets/js/http/forms_http_client.js') ?>"></script>
<script src="<?= asset_url('assets/js/pages/forms_user_view.js') ?>"></script>

<?php end_section('scripts'); ?>
