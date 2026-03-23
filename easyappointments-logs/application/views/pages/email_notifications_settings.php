<?php extend('layouts/backend_layout'); ?>

<?php section('content'); ?>

<div id="email-notifications-settings-page" class="container backend-page">
    <div id="email-notifications-settings">
        <div class="row settings-layout">
            <div class="col-sm-3 settings-nav-panel ps-0">
                <?php component('settings_nav'); ?>
            </div>
            <div class="col-sm-9 settings-content">
                <form>
                    <fieldset>
                        <div class="d-flex justify-content-between align-items-center border-bottom mb-4 py-2">
                            <h4 class="text-slate-900 mb-3 text-lg font-medium"><?= lang('email_notifications') ?></h4>

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
                                            <input class="form-check-input" type="checkbox" id="customer-notifications"
                                                   data-field="customer_notifications"
                                                   <?= filter_var(setting('customer_notifications', '1'), FILTER_VALIDATE_BOOLEAN) ? 'checked' : '' ?>>
                                            <label class="form-check-label" for="customer-notifications">
                                                <?= lang('appointment_change_notifications') ?>
                                            </label>
                                        </div>

                                        <div class="form-text text-muted">
                                            <small>
                                                <?= lang('appointment_change_notifications_hint') ?>
                                            </small>
                                        </div>
                                    </div>

                                    <div class="mb-4 ms-4">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox"
                                                   id="appointment-change-notify-customer"
                                                   data-field="appointment_change_notify_customer"
                                                   <?= filter_var(setting('appointment_change_notify_customer', '1'), FILTER_VALIDATE_BOOLEAN) ? 'checked' : '' ?>>
                                            <label class="form-check-label" for="appointment-change-notify-customer">
                                                <?= lang('appointment_change_notify_customer') ?>
                                            </label>
                                        </div>
                                        <div class="form-check mt-2">
                                            <input class="form-check-input" type="checkbox"
                                                   id="appointment-change-notify-provider"
                                                   data-field="appointment_change_notify_provider"
                                                   <?= filter_var(setting('appointment_change_notify_provider', '1'), FILTER_VALIDATE_BOOLEAN) ? 'checked' : '' ?>>
                                            <label class="form-check-label" for="appointment-change-notify-provider">
                                                <?= lang('appointment_change_notify_provider') ?>
                                            </label>
                                        </div>
                                        <div class="form-check mt-2">
                                            <input class="form-check-input" type="checkbox"
                                                   id="appointment-change-notify-admin"
                                                   data-field="appointment_change_notify_admin"
                                                   <?= filter_var(setting('appointment_change_notify_admin', '0'), FILTER_VALIDATE_BOOLEAN) ? 'checked' : '' ?>>
                                            <label class="form-check-label" for="appointment-change-notify-admin">
                                                <?= lang('appointment_change_notify_admin') ?>
                                            </label>
                                        </div>
                                        <div class="form-check mt-2">
                                            <input class="form-check-input" type="checkbox"
                                                   id="appointment-change-notify-staff"
                                                   data-field="appointment_change_notify_staff"
                                                   <?= filter_var(setting('appointment_change_notify_staff', '0'), FILTER_VALIDATE_BOOLEAN) ? 'checked' : '' ?>>
                                            <label class="form-check-label" for="appointment-change-notify-staff">
                                                <?= lang('appointment_change_notify_staff') ?>
                                            </label>
                                        </div>
                                    </div>

                                    <div class="mb-3">
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox"
                                                   id="customer-profile-completion-notifications"
                                                   data-field="customer_profile_completion_notifications"
                                                   <?= filter_var(setting('customer_profile_completion_notifications', '1'), FILTER_VALIDATE_BOOLEAN) ? 'checked' : '' ?>>
                                            <label class="form-check-label" for="customer-profile-completion-notifications">
                                                <?= lang('customer_profile_completion_notifications') ?>
                                            </label>
                                        </div>

                                        <div class="form-text text-muted">
                                            <small>
                                                <?= lang('customer_profile_completion_notifications_hint') ?>
                                            </small>
                                        </div>
                                    </div>

                                    <div class="mb-3">
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox"
                                                   id="customer-login-otp-notifications"
                                                   data-field="customer_login_otp_notifications"
                                                   <?= filter_var(setting('customer_login_otp_notifications', '1'), FILTER_VALIDATE_BOOLEAN) ? 'checked' : '' ?>>
                                            <label class="form-check-label" for="customer-login-otp-notifications">
                                                <?= lang('customer_login_otp_notifications') ?>
                                            </label>
                                        </div>

                                        <div class="form-text text-muted">
                                            <small>
                                                <?= lang('customer_login_otp_notifications_hint') ?>
                                            </small>
                                        </div>
                                    </div>

                                    <div>
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox"
                                                   id="account-recovery-notifications"
                                                   data-field="account_recovery_notifications"
                                                   <?= filter_var(setting('account_recovery_notifications', '1'), FILTER_VALIDATE_BOOLEAN) ? 'checked' : '' ?>>
                                            <label class="form-check-label" for="account-recovery-notifications">
                                                <?= lang('account_recovery_notifications') ?>
                                            </label>
                                        </div>

                                        <div class="form-text text-muted">
                                            <small>
                                                <?= lang('account_recovery_notifications_hint') ?>
                                            </small>
                                        </div>
                                    </div>
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

<script src="<?= asset_url('assets/js/http/email_notifications_settings_http_client.js') ?>"></script>
<script src="<?= asset_url('assets/js/pages/email_notifications_settings.js') ?>?v=<?= time() ?>"></script>

<?php end_section('scripts'); ?>
