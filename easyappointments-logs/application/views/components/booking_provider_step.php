<?php
/**
 * Local variables.
 */
?>

<div id="wizard-frame-2" class="wizard-frame booking-section" style="display:none;">
    <div class="frame-container">
        <h2 class="frame-title booking-frame-title"><?= lang('select_provider') ?></h2>

        <div class="frame-content mt-6">
            <div class="booking-frame-content">
                <div id="provider-card-container" class="mb-6 hidden" aria-hidden="true">
                    <div id="provider-card-list-label" class="mb-2 text-sm font-medium text-slate-700">
                        <strong><?= lang('select_provider') ?></strong>
                    </div>
                    <div id="provider-card-list"
                         class="grid gap-2"
                         role="radiogroup"
                         aria-labelledby="provider-card-list-label"
                         aria-describedby="provider-card-list-label">
                        <!-- JS -->
                    </div>
                    <div id="service-area-zip-required"
                         class="mt-2 hidden rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700"
                         aria-live="polite">
                        <div class="fw-medium mb-1"><?= lang('service_area_zip_required_title') ?></div>
                        <div class="mb-2"><?= lang('service_area_zip_required_body') ?></div>
                        <button type="button" id="service-area-add-zip" class="btn btn-outline-secondary btn-sm">
                            <?= lang('service_area_zip_required_action') ?>
                        </button>
                    </div>

                    <div id="service-area-no-providers"
                         class="mt-2 hidden rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                         aria-live="polite">
                        <div class="fw-medium mb-1"><?= lang('service_area_no_providers_title') ?></div>
                        <div class="mb-2"><?= lang('service_area_no_providers_body') ?></div>
                        <?php if (vars('customer_logged_in')): ?>
                            <a class="btn btn-outline-secondary btn-sm" href="<?= site_url('customer/account') ?>">
                                <?= lang('service_area_no_providers_action') ?>
                            </a>
                        <?php else: ?>
                            <button type="button" id="service-area-update-address" class="btn btn-outline-secondary btn-sm">
                                <?= lang('service_area_no_providers_action') ?>
                            </button>
                        <?php endif; ?>
                    </div>

                    <select id="select-provider" class="sr-only" aria-hidden="true" tabindex="-1">
                        <option value="">
                            <?= lang('please_select') ?>
                        </option>
                    </select>
                </div>

                <?php slot('after_select_provider'); ?>
            </div>
        </div>
    </div>

    <div class="command-buttons mt-6">
        <div class="booking-frame-content">
            <button type="button" id="button-next-2" class="button-next booking-button" data-step_index="2">
                <?= lang('next') ?>
                <i class="fas fa-chevron-right ml-2"></i>
            </button>
        </div>
    </div>
</div>
