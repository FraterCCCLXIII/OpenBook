<?php extend('layouts/booking_layout'); ?>

<?php section('content'); ?>
<div class="wizard-frame">
    <div class="frame-container">
        <h2 class="frame-title booking-frame-title">Create Password</h2>

        <?php if (vars('auth_error')): ?>
            <div class="alert alert-danger mb-4">
                <?= e(vars('auth_error')) ?>
            </div>
        <?php endif; ?>

        <div class="frame-content">
            <form method="post" action="<?= site_url('customer/save_password') ?>">
                <input type="hidden" name="csrf_token" value="<?= e(vars('csrf_token')) ?>">
                <div class="mt-6 space-y-4">
                    <div>
                        <label for="customer-new-password" class="form-label"><?= lang('password') ?></label>
                        <input type="password" id="customer-new-password" name="new_password" class="booking-input" required>
                    </div>
                    <div>
                        <label for="customer-confirm-password" class="form-label">Confirm Password</label>
                        <input type="password"
                               id="customer-confirm-password"
                               name="confirm_password"
                               class="booking-input"
                               required>
                    </div>
                </div>
                <button type="submit" class="booking-button mt-4">
                    <?= lang('save') ?>
                </button>
            </form>
        </div>
    </div>
</div>
<?php end_section('content'); ?>
