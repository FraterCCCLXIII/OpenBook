<?php extend('layouts/backend_layout'); ?>

<?php section('content'); ?>

<div id="account-service-areas-page" class="container backend-page">
    <div class="row settings-layout">
        <div class="col-sm-3 settings-nav-panel ps-0">
            <?php component('account_nav', [
                'active_nav' => 'account/service_areas',
                'show_forms_nav' => vars('show_forms_nav', false),
                'show_service_area_nav' => vars('show_service_area_nav', false),
                'show_availability_nav' => vars('show_availability_nav', false),
            ]); ?>
        </div>
        <div class="col-sm-9 settings-content">
            <div id="account-service-areas">
                <form>
                    <fieldset>
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <h4 class="text-dark mb-0 fw-medium fs-3">
                                <?= lang('service_area_preferences') ?>
                            </h4>

                            <?php if (can('edit', PRIV_USER_SETTINGS)): ?>
                                <button type="button" id="save-service-areas" class="btn btn-primary">
                                    <i class="fas fa-check-square me-2"></i>
                                    <?= lang('save') ?>
                                </button>
                            <?php endif; ?>
                        </div>

                        <div class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-4 mb-5">
                            <h6 class="mb-3 fw-medium text-muted text-uppercase small">
                                <?= lang('service_area_provider_zip_list') ?>
                            </h6>

                            <div class="mb-3">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="account-service-area-all">
                                    <label class="form-check-label" for="account-service-area-all">
                                        <?= lang('service_area_provider_all') ?>
                                    </label>
                                </div>
                            </div>

                            <div id="account-service-area-zips" class="d-flex flex-column gap-2" aria-live="polite">
                                <!-- JS -->
                            </div>

                            <div class="form-text text-muted">
                                <small><?= lang('service_area_provider_zip_list_hint') ?></small>
                            </div>
                        </div>
                    </fieldset>
                </form>
            </div>
        </div>
    </div>
</div>

<?php end_section('content'); ?>

<?php section('scripts'); ?>

<script src="<?= asset_url('assets/js/http/account_http_client.js') ?>&v=<?= time() ?>"></script>
<script src="<?= asset_url('assets/js/pages/account_service_areas.js') ?>&v=<?= time() ?>"></script>

<?php end_section('scripts'); ?>
