<?php extend('layouts/booking_layout'); ?>

<?php section('content'); ?>
<div class="wizard-frame booking-section px-4 sm:px-5">
    <div class="frame-container">
        <h2 class="frame-title">My Account</h2>

        <?php
        $complete_profile = vars('complete_profile');
        $profile_incomplete = vars('profile_incomplete');
        $flash = vars('flash');
        $complete_message = 'Please complete your profile before booking.';
        $missing_message = 'Your profile is missing required information.';
        $flash_message = is_array($flash) ? ($flash['message'] ?? '') : '';
        $flash_is_duplicate = ($flash['type'] ?? '') === 'warning'
            && in_array($flash_message, [$complete_message, $missing_message], true);
        ?>

        <?php if ($complete_profile): ?>
            <div class="alert alert-warning mb-4">
                <?= $complete_message ?>
            </div>
        <?php elseif ($profile_incomplete): ?>
            <div class="alert alert-warning mb-4">
                <?= $missing_message ?>
            </div>
        <?php endif; ?>

        <?php if ($flash && !$flash_is_duplicate): ?>
            <div class="alert alert-<?= e($flash['type']) ?> mb-4">
                <?= e($flash['message']) ?>
            </div>
        <?php endif; ?>

        <div class="flex justify-center mt-6">
            <ul class="booking-tab-list" id="account-tabs" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="booking-tab active" id="profile-tab" data-bs-toggle="pill"
                            data-bs-target="#profile" type="button" role="tab">
                        Profile
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="booking-tab" id="security-tab" data-bs-toggle="pill" data-bs-target="#security"
                            type="button" role="tab">
                        Security
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="booking-tab" id="billing-tab" data-bs-toggle="pill" data-bs-target="#billing"
                            type="button" role="tab">
                        Billing
                    </button>
                </li>
            </ul>
        </div>

        <div class="tab-content mt-6" id="account-tabs-content">
            <div class="tab-pane fade show active" id="profile" role="tabpanel">
                <div class="row frame-content">
                    <div class="col-12 mx-auto px-0">
                        <h5 class="mb-3">Profile Details</h5>
                        <form method="post" action="<?= site_url('customer/account/update') ?>">
                            <input type="hidden" name="csrf_token" value="<?= e(vars('csrf_token')) ?>">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="customer-first-name" class="form-label">First Name</label>
                                    <input type="text" id="customer-first-name" name="customer[first_name]" class="form-control"
                                           value="<?= e(vars('customer')['first_name'] ?? '') ?>">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="customer-last-name" class="form-label">Last Name</label>
                                    <input type="text" id="customer-last-name" name="customer[last_name]" class="form-control"
                                           value="<?= e(vars('customer')['last_name'] ?? '') ?>">
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="customer-phone" class="form-label">Phone</label>
                                <input type="text" id="customer-phone" name="customer[phone_number]" class="form-control"
                                       value="<?= e(vars('customer')['phone_number'] ?? '') ?>">
                            </div>
                            <div class="mb-3">
                                <label for="customer-address" class="form-label">Address</label>
                                <input type="text" id="customer-address" name="customer[address]" class="form-control"
                                       value="<?= e(vars('customer')['address'] ?? '') ?>">
                            </div>
                            <div class="row">
                                <div class="col-md-4 mb-3">
                                    <label for="customer-city" class="form-label">City</label>
                                    <input type="text" id="customer-city" name="customer[city]" class="form-control"
                                           value="<?= e(vars('customer')['city'] ?? '') ?>">
                                </div>
                                <div class="col-md-4 mb-3">
                                    <label for="customer-state" class="form-label">State</label>
                                    <input type="text" id="customer-state" name="customer[state]" class="form-control"
                                           value="<?= e(vars('customer')['state'] ?? '') ?>">
                                </div>
                                <div class="col-md-4 mb-3">
                                    <label for="customer-zip" class="form-label">Zip</label>
                                    <input type="text" id="customer-zip" name="customer[zip_code]" class="form-control"
                                           value="<?= e(vars('customer')['zip_code'] ?? '') ?>">
                                </div>
                            </div>
                            <div class="mb-4">
                                <label for="customer-timezone" class="form-label">Timezone</label>
                                <select id="customer-timezone" name="customer[timezone]" class="form-select">
                                    <?php foreach (vars('grouped_timezones') as $group => $timezones): ?>
                                        <optgroup label="<?= e($group) ?>">
                                            <?php foreach ($timezones as $timezone): ?>
                                                <option value="<?= e($timezone) ?>"
                                                    <?= vars('customer')['timezone'] === $timezone ? 'selected' : '' ?>>
                                                    <?= e($timezone) ?>
                                                </option>
                                            <?php endforeach; ?>
                                        </optgroup>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                            <?php component('custom_fields', [
                                'fields' => vars('custom_fields') ?? [],
                                'values' => vars('custom_field_values') ?? [],
                                'name_prefix' => 'custom_fields',
                                'show_all' => false,
                            ]); ?>
                            <button type="submit" class="btn btn-primary w-100 py-3">
                                Save Profile
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <div class="tab-pane fade" id="security" role="tabpanel">
                <div class="row frame-content">
                    <div class="col-12 mx-auto px-0">
                        <h5 class="mb-3">Update Email</h5>
                        <form method="post" action="<?= site_url('customer/account/email') ?>" class="mb-5"
                              id="customer-email-form">
                            <input type="hidden" name="csrf_token" value="<?= e(vars('csrf_token')) ?>">
                            <div class="mb-3">
                                <label for="customer-email" class="form-label">Email</label>
                                <input type="email" id="customer-email" name="email" class="form-control"
                                       value="<?= e(vars('customer')['email'] ?? '') ?>" required>
                            </div>
                            <button type="submit" class="btn btn-outline-dark w-100 py-3"
                                    id="customer-email-update" disabled>
                                Update Email
                            </button>
                        </form>

                        <?php if (vars('customer_login_mode') !== 'otp'): ?>
                            <h5 class="mb-3">Update Password</h5>
                            <form method="post" action="<?= site_url('customer/account/password') ?>"
                                  id="customer-password-form">
                                <input type="hidden" name="csrf_token" value="<?= e(vars('csrf_token')) ?>">
                                <div class="mb-3">
                                    <label for="customer-new-password" class="form-label">New Password</label>
                                    <input type="password" id="customer-new-password" name="new_password"
                                           class="form-control" required>
                                </div>
                                <div class="mb-4">
                                    <label for="customer-confirm-password" class="form-label">Confirm New Password</label>
                                    <input type="password" id="customer-confirm-password" name="confirm_password"
                                           class="form-control" required>
                                </div>
                                <button type="submit" class="btn btn-outline-dark w-100 py-3"
                                        id="customer-password-update" disabled>
                                    Update Password
                                </button>
                            </form>
                        <?php endif; ?>
                    </div>
                </div>
            </div>

            <div class="tab-pane fade" id="billing" role="tabpanel">
                <div class="row frame-content">
                    <div class="col-12 mx-auto px-0">
                        <?php if (vars('stripe_enabled') && !empty(vars('customer')['stripe_customer_id'])): ?>
                            <div class="card mb-5 border">
                                <div class="card-body d-flex justify-content-between align-items-center py-4">
                                    <div>
                                        <h5 class="mb-1">Payment Methods</h5>
                                        <p class="text-muted mb-0 small">Manage your saved cards and billing info via Stripe.</p>
                                    </div>
                                    <a href="<?= site_url('customer/account/stripe_portal') ?>" class="btn btn-dark px-4">
                                        Open Stripe Portal
                                    </a>
                                </div>
                            </div>
                        <?php endif; ?>

                        <h5 class="mb-3">Billing History</h5>
                        <div class="card bg-white border">
                            <div class="card-body p-0 overflow-x-auto">
                                <table class="table table-hover mb-0" style="min-width:400px">
                                    <thead class="bg-light">
                                        <tr>
                                            <th class="ps-4">Date</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                            <th class="pe-4">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <?php if (empty(vars('appointments'))): ?>
                                            <tr>
                                                <td colspan="4" class="text-center py-4 text-muted">No billing history found.</td>
                                            </tr>
                                        <?php else: ?>
                                            <?php foreach (vars('appointments') as $appointment): ?>
                                                <tr>
                                                    <td class="ps-4"><?= date('Y-m-d H:i', strtotime($appointment['book_datetime'])) ?></td>
                                                    <td><?= number_format($appointment['payment_amount'], 2) ?></td>
                                                    <td>
                                                        <span class="badge bg-<?= $appointment['payment_status'] === 'paid' ? 'success' : 'warning' ?>">
                                                            <?= ucfirst($appointment['payment_status']) ?>
                                                        </span>
                                                    </td>
                                                    <td class="pe-4">
                                                        <?php
                                                        $remaining_amount = (float) ($appointment['remaining_amount'] ?? 0);
                                                        $is_outstanding = $remaining_amount > 0 &&
                                                            (($appointment['payment_stage'] ?? '') === 'final_charge_failed' ||
                                                                ($appointment['payment_status'] ?? '') !== 'paid');
                                                        ?>
                                                        <?php if ($is_outstanding): ?>
                                                            <a class="btn btn-outline-primary btn-sm"
                                                               href="<?= site_url('booking/retry_payment/' . $appointment['hash']) ?>">
                                                                Pay Now
                                                            </a>
                                                        <?php else: ?>
                                                            <span class="text-muted small">—</span>
                                                        <?php endif; ?>
                                                    </td>
                                                </tr>
                                            <?php endforeach; ?>
                                        <?php endif; ?>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="modal fade" id="customer-otp-modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="customer-otp-modal-title">Enter Verification Code</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <p class="text-muted" id="customer-otp-modal-message">
                    Enter the code sent to your email.
                </p>
                <div class="mb-3">
                    <label for="customer-otp-code" class="form-label">Verification Code</label>
                    <input type="text" id="customer-otp-code" class="form-control"
                           inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}">
                    <div class="form-text text-muted">Enter the 6-digit code from your email.</div>
                </div>
                <div id="customer-otp-error" class="form-text text-danger d-none"></div>
                <div class="text-sm text-slate-500">
                    <button type="button" class="booking-link" id="customer-otp-resend">Resend code</button>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" id="customer-otp-confirm">Confirm</button>
            </div>
        </div>
    </div>
</div>
<?php end_section('content'); ?>

<?php section('scripts'); ?>

<script>
    $(document).ready(() => {
        const $button = $('#add-custom-field');
        const $container = $('.custom-field-item');

        if (!$button.length || !$container.length) {
            return;
        }

        const updateButton = () => {
            const hasHidden = $('.custom-field-hidden').length > 0;
            $button.toggleClass('d-none', !hasHidden);
        };

        $button.on('click', () => {
            const $next = $('.custom-field-hidden').first();
            if ($next.length) {
                $next.removeClass('d-none custom-field-hidden');
                updateButton();
            }
        });

        updateButton();
    });
</script>

<script>
    $(document).ready(() => {
        const csrfToken = <?= json_encode(vars('csrf_token')) ?>;
        const originalEmail = <?= json_encode(vars('customer')['email'] ?? '') ?>;
        const $emailInput = $('#customer-email');
        const $emailButton = $('#customer-email-update');
        const $passwordButton = $('#customer-password-update');
        const $passwordInput = $('#customer-new-password');
        const $passwordConfirmInput = $('#customer-confirm-password');
        const otpModalEl = document.getElementById('customer-otp-modal');
        const otpModal = otpModalEl
            ? new bootstrap.Modal(otpModalEl, {backdrop: false})
            : null;
        const $otpCode = $('#customer-otp-code');
        const $otpError = $('#customer-otp-error');
        const $otpTitle = $('#customer-otp-modal-title');
        const $otpMessage = $('#customer-otp-modal-message');
        const $otpConfirm = $('#customer-otp-confirm');
        const $otpResend = $('#customer-otp-resend');
        let otpMode = null;
        let pendingEmail = '';
        let lockoutTimer = null;

        if (!$emailInput.length || !otpModal) {
            return;
        }

        function setOtpError(message) {
            if (!message) {
                $otpError.addClass('d-none').text('');
                return;
            }
            $otpError.removeClass('d-none').text(message);
        }

        function formatCountdown(seconds) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return minutes + ':' + remainingSeconds.toString().padStart(2, '0');
        }

        function startLockoutCountdown(seconds) {
            if (lockoutTimer) {
                clearInterval(lockoutTimer);
                lockoutTimer = null;
            }

            if (!seconds || seconds <= 0) {
                $otpConfirm.prop('disabled', false);
                $otpResend.prop('disabled', false);
                return;
            }

            $otpConfirm.prop('disabled', true);
            $otpResend.prop('disabled', true);

            let remaining = seconds;
            setOtpError('Too many attempts. Try again in ' + formatCountdown(remaining) + '.');

            lockoutTimer = setInterval(() => {
                remaining -= 1;

                if (remaining <= 0) {
                    clearInterval(lockoutTimer);
                    lockoutTimer = null;
                    setOtpError('');
                    $otpConfirm.prop('disabled', false);
                    $otpResend.prop('disabled', false);
                    return;
                }

                setOtpError('Too many attempts. Try again in ' + formatCountdown(remaining) + '.');
            }, 1000);
        }

        function removeAllBackdrops() {
            document.querySelectorAll('.modal-backdrop').forEach((backdrop) => backdrop.remove());
        }

        function ensureOtpBackdrop() {
            removeAllBackdrops();
            const backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop fade show ea-otp-backdrop';
            backdrop.style.zIndex = '1090';
            document.body.appendChild(backdrop);
        }

        function removeOtpBackdrop() {
            document.querySelectorAll('.ea-otp-backdrop').forEach((backdrop) => backdrop.remove());
        }

        function openOtpModal(mode) {
            otpMode = mode;
            $otpCode.val('');
            setOtpError('');
            startLockoutCountdown(0);
            ensureOtpBackdrop();
            if (mode === 'email') {
                $otpTitle.text('Confirm Email Change');
                $otpMessage.text('Enter the code sent to your new email address.');
            } else {
                $otpTitle.text('Confirm Password Change');
                $otpMessage.text('Enter the code sent to your email address.');
            }
            otpModal.show();
        }

        if (otpModalEl) {
            otpModalEl.addEventListener('shown.bs.modal', () => {
                ensureOtpBackdrop();
            });
            otpModalEl.addEventListener('hidden.bs.modal', () => {
                removeOtpBackdrop();
            });
        }

        function requestEmailOtp() {
            pendingEmail = $emailInput.val().trim();
            return $.post({
                url: <?= json_encode(site_url('customer/account/email/otp_request')) ?>,
                data: {
                    csrf_token: csrfToken,
                    email: pendingEmail,
                },
            });
        }

        function requestPasswordOtp() {
            return $.post({
                url: <?= json_encode(site_url('customer/account/password/otp_request')) ?>,
                data: {
                    csrf_token: csrfToken,
                    new_password: $passwordInput.val(),
                    confirm_password: $passwordConfirmInput.val(),
                },
            });
        }

        function confirmEmailOtp() {
            return $.post({
                url: <?= json_encode(site_url('customer/account/email/otp_confirm')) ?>,
                data: {
                    csrf_token: csrfToken,
                    code: $otpCode.val().trim(),
                },
            });
        }

        function confirmPasswordOtp() {
            return $.post({
                url: <?= json_encode(site_url('customer/account/password/otp_confirm')) ?>,
                data: {
                    csrf_token: csrfToken,
                    code: $otpCode.val().trim(),
                },
            });
        }

        $emailInput.on('input', () => {
            const currentValue = $emailInput.val().trim();
            $emailButton.prop('disabled', !currentValue || currentValue === originalEmail);
        });
        $emailInput.trigger('input');

        if ($passwordInput.length && $passwordConfirmInput.length && $passwordButton.length) {
            const updatePasswordButtonState = () => {
                const newPassword = $passwordInput.val();
                const confirmPassword = $passwordConfirmInput.val();
                const canSubmit = newPassword.length > 0 && confirmPassword.length > 0 && newPassword === confirmPassword;
                $passwordButton.prop('disabled', !canSubmit);
            };

            $passwordInput.on('input', updatePasswordButtonState);
            $passwordConfirmInput.on('input', updatePasswordButtonState);
            updatePasswordButtonState();
        }

        $emailButton.on('click', (event) => {
            event.preventDefault();
            requestEmailOtp()
                .done(() => {
                    openOtpModal('email');
                })
                .fail((xhr) => {
                    const message = xhr.responseJSON?.message || 'Unable to send verification code.';
                    openOtpModal('email');
                    const lockout = xhr.responseJSON?.lockout_remaining_seconds;
                    if (lockout) {
                        startLockoutCountdown(lockout);
                        return;
                    }
                    setOtpError(message);
                });
        });

        $passwordButton.on('click', (event) => {
            event.preventDefault();
            requestPasswordOtp()
                .done(() => {
                    openOtpModal('password');
                })
                .fail((xhr) => {
                    const message = xhr.responseJSON?.message || 'Unable to send verification code.';
                    openOtpModal('password');
                    const lockout = xhr.responseJSON?.lockout_remaining_seconds;
                    if (lockout) {
                        startLockoutCountdown(lockout);
                        return;
                    }
                    setOtpError(message);
                });
        });

        $('#customer-otp-confirm').on('click', () => {
            const action = otpMode === 'email' ? confirmEmailOtp : confirmPasswordOtp;
            action()
                .done(() => {
                    otpModal.hide();
                    window.location.reload();
                })
                .fail((xhr) => {
                    const message = xhr.responseJSON?.message || 'Verification failed.';
                    const lockout = xhr.responseJSON?.lockout_remaining_seconds;
                    if (lockout) {
                        startLockoutCountdown(lockout);
                        return;
                    }
                    setOtpError(message);
                });
        });

        $('#customer-otp-resend').on('click', () => {
            const action = otpMode === 'email' ? requestEmailOtp : requestPasswordOtp;
            action()
                .done(() => {
                    setOtpError('');
                })
                .fail((xhr) => {
                    const message = xhr.responseJSON?.message || 'Unable to resend verification code.';
                    const lockout = xhr.responseJSON?.lockout_remaining_seconds;
                    if (lockout) {
                        startLockoutCountdown(lockout);
                        return;
                    }
                    setOtpError(message);
                });
        });
    });
</script>

<?php end_section('scripts'); ?>
