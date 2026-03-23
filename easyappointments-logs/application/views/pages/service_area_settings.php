<?php extend('layouts/backend_layout'); ?>

<?php section('content'); ?>

<div id="service-area-settings-page" class="container backend-page">
    <div id="service-area-settings">
        <div class="row settings-layout">
            <div class="col-sm-3 settings-nav-panel ps-0">
                <?php component('settings_nav'); ?>
            </div>
            <div class="col-sm-9 settings-content">
                <form>
                    <fieldset>
                        <div class="d-flex justify-content-between align-items-center border-bottom mb-4 py-2">
                            <h4 class="text-slate-900 mb-3 text-lg font-medium"><?= lang('service_area_settings') ?></h4>

                            <?php if (can('edit', PRIV_SYSTEM_SETTINGS)): ?>
                                <button type="button" id="save-settings" class="btn btn-primary">
                                    <i class="fas fa-check-square me-2"></i>
                                    <?= lang('save') ?>
                                </button>
                            <?php endif; ?>
                        </div>

                        <section class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-5">
                            <div class="mb-4 flex items-center justify-between">
                                <h3 class="text-lg font-medium text-slate-900"><?= lang('service_area_settings') ?></h3>
                            </div>

                            <div class="mb-4">
                                <label class="form-label" for="default-service-area-country">
                                    <?= lang('default_service_area_country') ?>
                                </label>
                                <input id="default-service-area-country" class="form-control" maxlength="2"
                                       data-field="default_service_area_country">
                                <div class="form-text text-muted">
                                    <small><?= lang('default_service_area_country_hint') ?></small>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label" for="service-area-zips">
                                    <?= lang('service_area_zip_list') ?>
                                </label>
                                <textarea id="service-area-zips" rows="12" class="form-control"
                                          data-field="service_area_zip_lines"></textarea>
                                <div class="form-text text-muted">
                                    <small><?= lang('service_area_zip_list_hint') ?></small>
                                </div>
                            </div>
                        </section>
                    </fieldset>
                </form>
            </div>
        </div>
    </div>
</div>

<?php end_section('content'); ?>

<?php section('scripts'); ?>

<script src="<?= asset_url('assets/js/http/service_area_settings_http_client.js') ?>"></script>
<script src="<?= asset_url('assets/js/pages/service_area_settings.js') ?>?v=<?= time() ?>"></script>

<?php end_section('scripts'); ?>
