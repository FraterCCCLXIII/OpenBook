<?php extend('layouts/backend_layout'); ?>

<?php section('content'); ?>

<div id="customer-login-settings-page" class="container backend-page">
    <div id="customer-login-settings">
        <div class="row settings-layout">
            <div class="col-sm-3 settings-nav-panel ps-0">
                <?php component('settings_nav'); ?>
            </div>
            <div class="col-sm-9 settings-content">
                <form>
                    <fieldset>
                        <div class="d-flex justify-content-between align-items-center border-bottom mb-4 py-2">
                            <h4 class="text-slate-900 mb-3 text-lg font-medium"><?= lang('customer_login_settings') ?></h4>

                            <?php if (can('edit', PRIV_SYSTEM_SETTINGS)): ?>
                                <button type="button" id="save-settings" class="btn btn-primary">
                                    <i class="fas fa-check-square me-2"></i>
                                    <?= lang('save') ?>
                                </button>
                            <?php endif; ?>
                        </div>

                        <section class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-5 mb-5">
                            <div class="mb-4 flex items-center justify-between">
                                <h3 class="text-lg font-medium text-slate-900"><?= lang('customer_login_mode') ?></h3>
                            </div>

                            <div class="form-text text-muted mb-4">
                                <small><?= lang('customer_login_mode_hint') ?></small>
                            </div>

                            <div class="d-flex flex-column gap-3">
                                <div class="form-check">
                                    <input class="form-check-input"
                                           type="radio"
                                           name="customer_login_mode"
                                           id="customer-login-mode-none"
                                           data-field="customer_login_mode"
                                           value="none">
                                    <label class="form-check-label" for="customer-login-mode-none">
                                        <?= lang('customer_login_mode_none') ?>
                                    </label>
                                    <div class="form-text text-muted">
                                        <small><?= lang('customer_login_mode_none_hint') ?></small>
                                    </div>
                                </div>

                                <div class="form-check">
                                    <input class="form-check-input"
                                           type="radio"
                                           name="customer_login_mode"
                                           id="customer-login-mode-password"
                                           data-field="customer_login_mode"
                                           value="password">
                                    <label class="form-check-label" for="customer-login-mode-password">
                                        <?= lang('customer_login_mode_password') ?>
                                    </label>
                                    <div class="form-text text-muted">
                                        <small><?= lang('customer_login_mode_password_hint') ?></small>
                                    </div>
                                </div>

                                <div class="form-check">
                                    <input class="form-check-input"
                                           type="radio"
                                           name="customer_login_mode"
                                           id="customer-login-mode-otp"
                                           data-field="customer_login_mode"
                                           value="otp">
                                    <label class="form-check-label" for="customer-login-mode-otp">
                                        <?= lang('customer_login_mode_otp') ?>
                                    </label>
                                    <div class="form-text text-muted">
                                        <small><?= lang('customer_login_mode_otp_hint') ?></small>
                                    </div>
                                </div>
                            </div>

                            <div class="mt-4 rounded-lg border border-[var(--bs-border-color,#e2e8f0)] bg-slate-50 p-4 text-sm text-slate-600">
                                <div class="fw-semibold text-slate-900 mb-2">
                                    <?= lang('customer_login_rules_title') ?>
                                </div>
                                <ul class="mb-0">
                                    <li><?= lang('customer_login_rules_otp_length') ?></li>
                                    <li><?= lang('customer_login_rules_otp_expiry') ?></li>
                                    <li><?= lang('customer_login_rules_otp_attempts') ?></li>
                                    <li><?= lang('customer_login_rules_otp_lockout') ?></li>
                                    <li><?= lang('customer_login_rules_otp_resend') ?></li>
                                </ul>
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

<script src="<?= asset_url('assets/js/http/customer_login_settings_http_client.js') ?>"></script>
<script src="<?= asset_url('assets/js/pages/customer_login_settings.js') ?>"></script>

<?php end_section('scripts'); ?>
