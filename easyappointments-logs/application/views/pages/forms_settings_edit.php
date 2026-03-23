<?php extend('layouts/backend_layout'); ?>

<?php section('content'); ?>

<div id="forms-settings" class="container backend-page">
    <div class="row settings-layout">
        <div class="col-sm-3 settings-nav-panel ps-0">
            <?php component('settings_nav'); ?>
        </div>
        <div class="col-sm-9 settings-content">
            <div class="d-flex flex-wrap align-items-center justify-content-between mb-4 pb-2">
                <div class="d-flex align-items-center gap-2">
                    <a href="<?= site_url('forms_settings') ?>" class="btn btn-outline-secondary btn-sm">
                        <i class="fas fa-arrow-left"></i>
                    </a>
                    <h4 class="text-slate-900 mb-3 text-lg font-medium">Form Details</h4>
                </div>
                <div class="d-flex gap-2">
                    <button type="button" id="preview-form" class="btn btn-outline-secondary">
                        <i class="fas fa-eye me-2"></i>
                        Preview
                    </button>
                    <button type="button" id="save-form" class="btn btn-primary">
                        <i class="fas fa-check-square me-2"></i>
                        Save
                    </button>
                    <button type="button" id="delete-form" class="btn btn-outline-danger" disabled>
                        Delete Form
                    </button>
                </div>
            </div>
            <div class="modal fade" id="form-preview-modal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg modal-dialog-scrollable">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Form Preview</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"
                                    aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <h5 id="form-preview-title" class="mb-3"></h5>
                            <div id="form-preview-fields" class="mt-4 d-flex flex-column gap-3"></div>
                        </div>
                    </div>
                </div>
            </div>

            <section class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-5">
                <div class="mb-4 flex items-center justify-between">
                    <h3 class="text-lg font-medium text-slate-900">Form Details</h3>
                </div>
                <input type="hidden" id="form-id" value="<?= vars('form_id') ?>">
                <div class="mb-3">
                    <label class="form-label" for="form-name">Form name</label>
                    <input type="text" id="form-name" class="form-control required">
                </div>

                <div class="mb-3">
                    <label class="form-label">Assigned user types</label>
                    <div class="dropdown">
                        <button class="btn btn-outline-secondary dropdown-toggle w-100 text-start"
                                type="button" id="form-user-types-toggle" data-bs-toggle="dropdown"
                                aria-expanded="false">
                            Select user types
                        </button>
                        <div class="dropdown-menu w-100 p-3" aria-labelledby="form-user-types-toggle">
                            <div class="form-check">
                                <input class="form-check-input form-user-type" type="checkbox"
                                       id="form-user-type-customer" value="customer">
                                <label class="form-check-label" for="form-user-type-customer">Customer</label>
                            </div>
                            <div class="form-check mt-2">
                                <input class="form-check-input form-user-type" type="checkbox"
                                       id="form-user-type-provider" value="provider">
                                <label class="form-check-label" for="form-user-type-provider">Provider</label>
                            </div>
                            <div class="form-check mt-2">
                                <input class="form-check-input form-user-type" type="checkbox"
                                       id="form-user-type-secretary" value="secretary">
                                <label class="form-check-label" for="form-user-type-secretary">Secretary</label>
                            </div>
                            <div class="form-check mt-2">
                                <input class="form-check-input form-user-type" type="checkbox"
                                       id="form-user-type-admin" value="admin">
                                <label class="form-check-label" for="form-user-type-admin">Admin</label>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="mb-3">
                    <div class="d-flex align-items-center justify-content-between">
                        <label class="form-label mb-0">Custom fields</label>
                    </div>
                    <div id="form-fields" class="mt-3 d-flex flex-column gap-3">
                        <!-- JS -->
                    </div>
                    <div class="mt-3 d-flex flex-wrap gap-2">
                        <button type="button" id="add-form-text" class="btn btn-outline-secondary btn-sm">
                            <i class="fas fa-font me-2"></i>
                            Add text
                        </button>
                        <button type="button" id="add-form-input" class="btn btn-outline-secondary btn-sm">
                            <i class="fas fa-i-cursor me-2"></i>
                            Add input
                        </button>
                        <button type="button" id="add-form-dropdown" class="btn btn-outline-secondary btn-sm">
                            <i class="fas fa-caret-down me-2"></i>
                            Add dropdown
                        </button>
                        <button type="button" id="add-form-radio" class="btn btn-outline-secondary btn-sm">
                            <i class="far fa-dot-circle me-2"></i>
                            Add radio
                        </button>
                        <button type="button" id="add-form-checkboxes" class="btn btn-outline-secondary btn-sm">
                            <i class="far fa-check-square me-2"></i>
                            Add checkboxes
                        </button>
                        <button type="button" id="add-form-date" class="btn btn-outline-secondary btn-sm">
                            <i class="far fa-calendar-alt me-2"></i>
                            Add date
                        </button>
                    </div>
                </div>
            </section>
            <div id="forms-message" class="alert mt-3 d-none"></div>
        </div>
    </div>
</div>

<?php end_section('content'); ?>

<?php section('scripts'); ?>

<script src="<?= asset_url('assets/js/http/forms_http_client.js') ?>"></script>
<script src="<?= asset_url('assets/js/pages/forms_settings_edit.js') ?>"></script>

<?php end_section('scripts'); ?>
