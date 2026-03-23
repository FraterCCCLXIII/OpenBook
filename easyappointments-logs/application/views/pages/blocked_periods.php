<?php extend('layouts/backend_layout'); ?>

<?php section('content'); ?>

<div class="container-fluid backend-page" id="blocked-periods-page">

    <div class="row" id="blocked-periods">
        <div id="filter-blocked-periods" class="filter-records column col-12 col-md-5 backend-sticky-panel">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2 class="backend-page-title mb-0">
                    <?= lang('blocked_periods') ?>
                </h2>

                <div class="ea-button-group">
                    <button id="add-blocked-period" class="btn btn-primary btn-sm">
                        <i class="fas fa-plus-square me-2"></i>
                        <?= lang('add') ?>
                    </button>
                </div>
            </div>

            <form class="input-append mb-4">
                <div class="input-group">
                    <input type="text" class="key form-control" aria-label="keyword">

                    <button class="filter btn btn-outline-secondary" type="submit"
                            data-tippy-content="<?= lang('filter') ?>">
                        <i class="fas fa-search"></i>
                    </button>
                </div>
            </form>

            <div class="results">
                <!-- JS -->
            </div>
        </div>

        <div class="record-details col-12 col-md-5">
            <div class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-4 mb-4">
                <div class="d-flex w-100 justify-content-between gap-3 mb-3">
                    <h4 class="text-dark fw-medium fs-4 mb-0">
                        <?= lang('details') ?>
                    </h4>
                    <div id="blocked-period-actions-group" class="d-flex align-items-start">
                        <div class="dropdown">
                            <button class="btn btn-outline-secondary btn-sm"
                                    type="button"
                                    id="blocked-period-actions-menu"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                    aria-label="<?= lang('actions') ?>">
                                <i class="fas fa-ellipsis-vertical"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end mt-0" style="top: calc(100% - 6px);">
                                <li>
                                    <button id="edit-blocked-period"
                                            class="dropdown-item"
                                            type="button"
                                            disabled="disabled">
                                        <i class="fas fa-edit me-2"></i>
                                        <?= lang('edit') ?>
                                    </button>
                                </li>
                                <li>
                                    <button id="delete-blocked-period"
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

                    <div id="blocked-period-save-cancel-group" class="d-none align-items-start gap-2">
                        <button id="save-blocked-period" class="btn btn-primary btn-sm">
                            <i class="fas fa-check-square me-2"></i>
                            <?= lang('save') ?>
                        </button>
                        <button id="cancel-blocked-period" class="btn btn-outline-secondary btn-sm">
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
                    <input id="name" class="form-control required" disabled>
                </div>

                <div class="mb-3">
                    <label class="form-label" for="start-date-time">
                        <?= lang('start') ?>
                        <span class="text-danger" hidden>*</span>
                    </label>
                    <input id="start-date-time" class="form-control required" disabled>
                </div>

                <div class="mb-3">
                    <label class="form-label" for="end-date-time">
                        <?= lang('end') ?>
                        <span class="text-danger" hidden>*</span>
                    </label>
                    <input id="end-date-time" class="form-control required" disabled>
                </div>

                <div class="mb-3">
                    <label class="form-label" for="notes">
                        <?= lang('notes') ?>
                    </label>
                    <textarea id="notes" rows="4" class="form-control" disabled></textarea>
                </div>

                <?php slot('after_primary_fields'); ?>
            </div>
        </div>
    </div>

</div>

<?php end_section('content'); ?>

<?php section('scripts'); ?>

<script src="<?= asset_url('assets/js/utils/ui.js') ?>"></script>
<script src="<?= asset_url('assets/js/http/blocked_periods_http_client.js') ?>"></script>
<script src="<?= asset_url('assets/js/pages/blocked_periods.js') ?>"></script>

<?php end_section('scripts'); ?>
