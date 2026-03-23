<?php extend('layouts/backend_layout'); ?>

<?php section('content'); ?>

<div id="legal-settings-page" class="container backend-page">
    <div id="legal-contents">
        <div class="row settings-layout">
            <div class="col-sm-3 settings-nav-panel ps-0">
                <?php component('settings_nav'); ?>
            </div>
            <div class="col-sm-9 settings-content">
                <form>
                    <fieldset>
                        <div class="d-flex justify-content-between align-items-center border-bottom mb-4 py-2">
                            <h4 class="text-slate-900 mb-3 text-lg font-medium"><?= lang('legal_contents') ?></h4>

                            <?php if (can('edit', PRIV_SYSTEM_SETTINGS)): ?>
                                <button type="button" id="save-settings" class="btn btn-primary">
                                    <i class="fas fa-check-square me-2"></i>
                                    <?= lang('save') ?>
                                </button>
                            <?php endif; ?>
                        </div>

                        <div class="row">
                            <div class="col-12">
                                <section class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-5 mb-5">
                                    <div class="mb-4 flex items-center justify-between">
                                        <h3 class="text-lg font-medium text-slate-900"><?= lang('cookie_notice') ?></h3>
                                    </div>

                                    <div class="form-check form-switch mb-3">
                                        <input class="form-check-input display-switch" type="checkbox"
                                               id="display-cookie-notice">
                                        <label class="form-check-label" for="display-cookie-notice">
                                            <?= lang('display_cookie_notice') ?>
                                        </label>
                                    </div>

                                    <div class="mb-5">
                                        <label class="form-label"
                                               for="cookie-notice-content"><?= lang('cookie_notice_content') ?></label>
                                        <textarea id="cookie-notice-content" cols="30" rows="10" class="mb-3"></textarea>
                                    </div>
                                </section>

                                <section class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-5 mb-5">
                                    <div class="mb-4 flex items-center justify-between">
                                        <h3 class="text-lg font-medium text-slate-900"><?= lang('terms_and_conditions') ?></h3>
                                    </div>

                                    <div class="form-check form-switch mb-3">
                                        <input class="form-check-input display-switch" type="checkbox"
                                               id="display-terms-and-conditions">
                                        <label class="form-check-label" for="display-terms-and-conditions">
                                            <?= lang('display_terms_and_conditions') ?>
                                        </label>
                                    </div>

                                    <div class="mb-5">
                                        <label class="form-label"
                                               for="terms-and-conditions-content"><?= lang(
                                                   'terms_and_conditions_content',
                                               ) ?></label>
                                        <textarea id="terms-and-conditions-content" cols="30" rows="10"
                                                  class="mb-3"></textarea>
                                    </div>
                                </section>

                                <section class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-5">
                                    <div class="mb-4 flex items-center justify-between">
                                        <h3 class="text-lg font-medium text-slate-900"><?= lang('privacy_policy') ?></h3>
                                    </div>

                                    <div class="form-check form-switch mb-3">
                                        <input class="form-check-input display-switch" type="checkbox"
                                               id="display-privacy-policy">
                                        <label class="form-check-label" for="display-privacy-policy">
                                            <?= lang('display_privacy_policy') ?>
                                        </label>
                                    </div>

                                    <div class="mb-3">
                                        <label class="form-label"
                                               for="privacy-policy-content"><?= lang('privacy_policy_content') ?></label>
                                        <textarea id="privacy-policy-content" cols="30" rows="10" class="mb-3"></textarea>
                                    </div>
                                </section>
                            </div>
                        </div>

                        <?php slot('after_primary_fields'); ?>
                    </fieldset>
                </form>
            </div>
        </div>
    </div>
</div>

<?php end_section('content'); ?>

<?php section('scripts'); ?>

<script src="<?= asset_url('assets/js/utils/ui.js') ?>"></script>
<script src="<?= asset_url('assets/js/http/legal_settings_http_client.js') ?>"></script>
<script src="<?= asset_url('assets/js/pages/legal_settings.js') ?>"></script>


<?php end_section('scripts'); ?>
