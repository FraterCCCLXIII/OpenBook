<?php extend('layouts/backend_layout'); ?>

<?php section('content'); ?>
<div id="stripe-settings-page" class="container backend-page">
    <div id="stripe-settings">
        <div class="row settings-layout">
            <div class="col-sm-3 settings-nav-panel ps-0">
                <?php component('settings_nav', ['active_menu' => 'stripe']); ?>
            </div>
            <div class="col-sm-9 settings-content">
                <form id="stripe-settings-form">
                    <fieldset>
                        <div class="d-flex justify-content-between align-items-center border-bottom mb-4 py-2">
                        <h4 class="text-slate-900 mb-3 text-lg font-medium"><?= ucfirst(lang('stripe')) ?></h4>

                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-check-square me-2"></i>
                                <?= lang('save') ?>
                            </button>
                        </div>

                        <section class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-5">
                            <div class="form-check form-switch mb-4">
                                <input class="form-check-input" type="checkbox" id="stripe_enabled" 
                                       <?= $stripe_enabled ? 'checked' : '' ?>>
                                <label class="form-check-label" for="stripe_enabled">
                                    <?= lang('enable_stripe') ?>
                                </label>
                            </div>

                            <div class="mb-3">
                                <label for="stripe_publishable_key" class="form-label">Publishable Key</label>
                                <input type="text" class="form-control" id="stripe_publishable_key" 
                                       value="<?= e($stripe_publishable_key) ?>">
                            </div>

                            <div class="mb-3">
                                <label for="stripe_secret_key" class="form-label">Secret Key</label>
                                <input type="password" class="form-control" id="stripe_secret_key" 
                                       value="<?= e($stripe_secret_key) ?>">
                            </div>

                            <div class="mb-3">
                                <label for="stripe_webhook_secret" class="form-label">Webhook Secret</label>
                                <input type="password" class="form-control" id="stripe_webhook_secret" 
                                       value="<?= e($stripe_webhook_secret) ?>">
                            </div>

                            <div class="mb-4">
                                <label for="stripe_currency" class="form-label">Currency (ISO 4217)</label>
                                <input type="text" class="form-control" id="stripe_currency" 
                                       value="<?= e($stripe_currency) ?>" placeholder="USD">
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
<script>
    $(document).ready(function() {
        $('#stripe-settings-form').on('submit', function(e) {
            e.preventDefault();
            
            const data = {
                csrf_token: vars('csrf_token'),
                stripe_enabled: $('#stripe_enabled').is(':checked') ? '1' : '0',
                stripe_publishable_key: $('#stripe_publishable_key').val(),
                stripe_secret_key: $('#stripe_secret_key').val(),
                stripe_webhook_secret: $('#stripe_webhook_secret').val(),
                stripe_currency: $('#stripe_currency').val()
            };

            $.post(App.Utils.Url.siteUrl('stripe_settings/save'), data, function(response) {
                if (response.success) {
                    App.Layouts.Backend.displayNotification('Stripe settings saved successfully!');
                } else {
                    App.Layouts.Backend.displayNotification('Error saving settings: ' + response.message);
                }
            }, 'json').fail(function(xhr, status, error) {
                App.Layouts.Backend.displayNotification('Critical error while saving settings.');
            });
        });
    });
</script>
<?php end_section('scripts'); ?>
