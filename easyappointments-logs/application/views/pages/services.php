<?php extend('layouts/backend_layout'); ?>

<?php section('content'); ?>

<div class="backend-page services-page-fullbleed" id="services-page">
    <div class="row g-0" id="services">
        <?php component('backend_filter_panel', [
            'filter_id' => 'filter-services',
            'title' => lang('services'),
            'add_button_id' => 'add-service',
        ]); ?>

        <div class="record-details column col-12 col-md-5">
            <div class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-4">
                <div class="d-flex w-100 justify-content-between gap-3 mb-3">
                    <h4 class="text-dark fw-medium fs-4 mb-0" id="service-details-title">
                        <?= lang('details') ?>
                    </h4>
                    <div id="service-actions-group" class="d-flex align-items-start">
                        <div class="dropdown">
                            <button class="btn btn-outline-secondary btn-sm"
                                    type="button"
                                    id="service-actions-menu"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                    aria-label="<?= lang('actions') ?>">
                                <i class="fas fa-ellipsis-vertical"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end mt-0" style="top: calc(100% - 6px);">
                                <li>
                                    <button id="edit-service"
                                            class="dropdown-item"
                                            type="button"
                                            disabled="disabled">
                                        <i class="fas fa-edit me-2"></i>
                                        <?= lang('edit') ?>
                                    </button>
                                </li>
                                <li>
                                    <button id="delete-service"
                                            class="dropdown-item"
                                            type="button"
                                            disabled="disabled">
                                        <i class="fas fa-trash-alt me-2"></i>
                                        <?= lang('delete') ?>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div id="service-save-cancel-group" class="d-none align-items-start gap-2">
                        <button id="save-service" class="btn btn-primary btn-sm">
                            <i class="fas fa-check-square me-2"></i>
                            <?= lang('save') ?>
                        </button>
                        <button id="cancel-service" class="btn btn-outline-secondary btn-sm">
                            <?= lang('cancel') ?>
                        </button>
                    </div>
                </div>

                <div class="form-message alert" style="display:none;"></div>

                <input type="hidden" id="id">

                <div class="mb-3">
                    <label class="form-label" for="name">
                        <?= lang('name') ?>
                        <span class="text-danger" hidden>*</span>
                    </label>
                    <input id="name" class="form-control required" maxlength="128" disabled>
                </div>

                <div class="mb-3">
                    <label class="form-label" for="duration">
                        <?= lang('duration_minutes') ?>
                        <span class="text-danger" hidden>*</span>
                    </label>
                    <input id="duration" class="form-control required" type="number" min="<?= EVENT_MINIMUM_DURATION ?>"
                           disabled>
                </div>

                <div class="mb-3">
                    <label class="form-label" for="price">
                        <?= lang('price') ?>
                        <span class="text-danger" hidden>*</span>
                    </label>
                    <input id="price" class="form-control required" disabled>
                </div>

                <div class="mb-3">
                    <label class="form-label" for="down-payment-type">
                        Down Payment Type
                    </label>
                    <select id="down-payment-type" class="form-select" disabled>
                        <option value="none">None</option>
                        <option value="fixed">Fixed Amount</option>
                        <option value="percent">Percent</option>
                    </select>
                </div>

                <div class="mb-3">
                    <label class="form-label" for="down-payment-value">
                        Down Payment Value
                    </label>
                    <input id="down-payment-value" class="form-control" type="number" min="0" step="0.01" disabled>
                    <div class="form-text text-muted">
                        Use amount for fixed and percentage points for percent (0-100).
                    </div>
                </div>

                <div class="mb-3">
                    <label class="form-label" for="currency">
                        <?= lang('currency') ?>

                    </label>
                    <input id="currency" class="form-control" maxlength="32" disabled>
                </div>

                <div class="mb-3">
                    <label class="form-label" for="service-category-id">
                        <?= lang('category') ?>
                    </label>
                    <select id="service-category-id" class="form-select" disabled></select>
                </div>

                <div class="mb-3">
                    <label class="form-label" for="availabilities-type">
                        <?= lang('availabilities_type') ?>

                    </label>
                    <select id="availabilities-type" class="form-select" disabled>
                        <option value="<?= AVAILABILITIES_TYPE_FLEXIBLE ?>">
                            <?= lang('flexible') ?>
                        </option>
                        <option value="<?= AVAILABILITIES_TYPE_FIXED ?>">
                            <?= lang('fixed') ?>
                        </option>
                    </select>
                </div>

                <div class="mb-3">
                    <label class="form-label" for="attendants-number" disabled>
                        <?= lang('attendants_number') ?>
                        <span class="text-danger" hidden>*</span>
                    </label>
                    <input id="attendants-number" class="form-control required" type="number" min="1">
                </div>

                <div class="mb-3">
                    <label class="form-label" for="location">
                        <?= lang('location') ?>
                    </label>
                    <input id="location" class="form-control" disabled>
                </div>

                <div class="mb-3">
                    <?php component('color_selection', ['attributes' => 'id="color"']); ?>
                </div>

                <div>
                    <label class="form-label mb-3">
                        <?= lang('options') ?>
                    </label>
                </div>

                <div class="border rounded mb-3 p-3">
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="is-private">

                        <label class="form-check-label" for="is-private">
                            <?= lang('hide_from_public') ?>
                        </label>
                    </div>

                    <div class="form-text text-muted">
                        <small>
                            <?= lang('private_hint') ?>
                        </small>
                    </div>
                </div>

                <div class="border rounded mb-3 p-3">
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="service-area-only">

                        <label class="form-check-label" for="service-area-only">
                            <?= lang('service_area_only') ?>
                        </label>
                    </div>

                    <div class="form-text text-muted">
                        <small>
                            <?= lang('service_area_only_hint') ?>
                        </small>
                    </div>
                </div>

                <div class="mb-3">
                    <label class="form-label" for="description">
                        <?= lang('description') ?>
                    </label>
                    <textarea id="description" rows="4" class="form-control" disabled></textarea>
                </div>

                <?php slot('after_primary_fields'); ?>
            </div>
        </div>
    </div>
</div>

<?php end_section('content'); ?>

<?php section('scripts'); ?>

<script src="<?= asset_url('assets/js/http/services_http_client.js') ?>"></script>
<script src="<?= asset_url('assets/js/http/service_categories_http_client.js') ?>"></script>
<script src="<?= asset_url('assets/js/pages/services.js') ?>"></script>

<?php end_section('scripts'); ?>
