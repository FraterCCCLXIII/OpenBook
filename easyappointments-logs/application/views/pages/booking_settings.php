<?php extend('layouts/backend_layout'); ?>

<?php section('content'); ?>

<div id="booking-settings-page" class="container backend-page">
    <div id="booking-settings">
        <div class="row settings-layout">
            <div class="col-sm-3 settings-nav-panel ps-0">
                <?php component('settings_nav'); ?>
            </div>
            <div class="col-sm-9 settings-content">
                <form>
                    <fieldset>
                        <div class="d-flex justify-content-between align-items-center border-bottom mb-4 py-2">
                            <h4 class="text-slate-900 mb-3 text-lg font-medium"><?= lang('booking_settings') ?></h4>

                            <?php if (can('edit', PRIV_SYSTEM_SETTINGS)): ?>
                                <button type="button" id="save-settings" class="btn btn-primary">
                                    <i class="fas fa-check-square me-2"></i>
                                    <?= lang('save') ?>
                                </button>
                            <?php endif; ?>
                        </div>

                        <section class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-5">
                            <div class="mb-4 flex items-center justify-between">
                                <h3 class="text-lg font-medium text-slate-900"><?= lang('options') ?></h3>
                            </div>

                            <div class="row">
                                <div class="col-12">
                                    <div class="mb-3">
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox"
                                                   id="limit-provider-customer-access"
                                                   data-field="limit_provider_customer_access">
                                            <label class="form-check-label" for="limit-provider-customer-access">
                                                <?= lang('limit_provider_customer_access') ?>
                                            </label>
                                        </div>

                                        <div class="form-text text-muted">
                                            <small>
                                                <?= lang('limit_provider_customer_access_hint') ?>
                                            </small>
                                        </div>
                                    </div>

                                    <div class="mb-3">
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox"
                                                   id="limit-secretary-customer-access"
                                                   data-field="limit_secretary_customer_access">
                                            <label class="form-check-label" for="limit-secretary-customer-access">
                                                <?= lang('limit_secretary_customer_access') ?>
                                            </label>
                                        </div>

                                        <div class="form-text text-muted">
                                            <small>
                                                <?= lang('limit_secretary_customer_access_hint') ?>
                                            </small>
                                        </div>
                                    </div>

                                    <div class="mb-3">
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" id="require-captcha"
                                                   data-field="require_captcha">
                                            <label class="form-check-label" for="require-captcha">
                                                CAPTCHA
                                            </label>
                                        </div>

                                        <div class="form-text text-muted">
                                            <small>
                                                <?= lang('require_captcha_hint') ?>
                                            </small>
                                        </div>
                                    </div>

                                    <div class="mb-3">
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" id="display-any-provider"
                                                   data-field="display_any_provider">
                                            <label class="form-check-label" for="display-any-provider">
                                                <?= lang('any_provider') ?>
                                            </label>
                                        </div>

                                        <div class="form-text text-muted">
                                            <small>
                                                <?= lang('display_any_provider_hint') ?>
                                            </small>
                                        </div>
                                    </div>

                                    <div class="mb-3">
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" id="display-login-button"
                                                   data-field="display_login_button">
                                            <label class="form-check-label" for="display-login-button">
                                                <?= lang('login_button') ?>
                                            </label>
                                        </div>

                                        <div class="form-text text-muted">
                                            <small>
                                                <?= lang('display_login_button_hint') ?>
                                            </small>
                                        </div>
                                    </div>

                                    <div class="mb-3">
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" id="display-language-selector"
                                                   data-field="display_language_selector">
                                            <label class="form-check-label" for="display-language-selector">
                                                <?= lang('language_selector') ?>
                                            </label>
                                        </div>

                                        <div class="form-text text-muted">
                                            <small>
                                                <?= lang('display_language_selector_hint') ?>
                                            </small>
                                        </div>
                                    </div>

                                    <div class="mb-3">
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox"
                                                   id="display-delete-personal-information"
                                                   data-field="display_delete_personal_information">
                                            <label class="form-check-label" for="display-delete-personal-information">
                                                <?= lang('delete_personal_information') ?>
                                            </label>
                                        </div>

                                        <div class="form-text text-muted">
                                            <small>
                                                <?= lang('delete_personal_information_hint') ?>
                                            </small>
                                        </div>
                                    </div>

                                    <div>
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" id="disable-booking"
                                                   data-field="disable_booking">
                                            <label class="form-check-label" for="disable-booking">
                                                <?= lang('disable_booking') ?>
                                            </label>
                                        </div>

                                        <div class="form-text text-muted">
                                            <small>
                                                <?= lang('disable_booking_hint') ?>
                                            </small>
                                        </div>
                                    </div>

                                    <div class="form-group mb-3" hidden>
                                        <label class="form-label" for="disable-booking-message">
                                            <?= lang('display_message') ?>
                                        </label>
                                        <textarea id="disable-booking-message" cols="30" rows="10"
                                                  class="mb-3"></textarea>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <?php slot('after_primary_fields'); ?>
                    </fieldset>
                </form>
            </div>
        </div>
    </div>
</div>

<?php end_section('content'); ?>

<?php section('scripts'); ?>

<script src="<?= asset_url('assets/js/http/booking_settings_http_client.js') ?>"></script>
<script src="<?= asset_url('assets/js/pages/booking_settings.js') ?>?v=<?= time() ?>"></script>

<?php end_section('scripts'); ?>



