<?php extend('layouts/booking_layout'); ?>

<?php section('content'); ?>
<?php
$login_mode = vars('login_mode') ?? 'password';
$otp_pending = (bool) vars('otp_pending');
$otp_pending_email = vars('otp_pending_email');
$otp_pending_intent = vars('otp_pending_intent');
$show_login = ($otp_pending && $otp_pending_intent === 'login') || vars('auth_mode') === 'login';
?>
<div class="wizard-frame">
    <div class="frame-container">
        <h2 id="customer-auth-title" class="frame-title booking-frame-title">
            <?php if ($login_mode === 'otp'): ?>
                <?= $otp_pending ? 'Verify your address' : 'Start your booking' ?>
            <?php else: ?>
                <?= $show_login ? lang('login') : 'Create an Account' ?>
            <?php endif; ?>
        </h2>

        <?php if (vars('auth_error')): ?>
            <div class="alert alert-danger mb-4">
                <?= e(vars('auth_error')) ?>
            </div>
        <?php endif; ?>

        <div class="frame-content" data-login-mode="<?= e($login_mode) ?>">
            <?php if ($login_mode === 'password'): ?>
                <div id="customer-auth-register" class="<?= $show_login ? 'hidden' : '' ?>">
                <div class="text-center text-sm text-slate-500">
                    Already have an account?
                    <a href="#" id="customer-auth-show-login" class="booking-link">
                        Login
                    </a>
                </div>
                <form method="post" action="<?= site_url('customer/register') ?>">
                    <input type="hidden" name="csrf_token" value="<?= e(vars('csrf_token')) ?>">
                    <div class="mt-6 space-y-4">
                        <div>
                            <label for="customer-register-email" class="form-label"><?= lang('email') ?></label>
                            <input type="email" id="customer-register-email" name="email" class="booking-input" required>
                        </div>
                        <div>
                            <label for="customer-register-password" class="form-label"><?= lang('password') ?></label>
                            <input type="password" id="customer-register-password" name="password" class="booking-input" required>
                        </div>
                        <div>
                            <label for="customer-register-password-confirm" class="form-label">Confirm Password</label>
                            <input type="password" id="customer-register-password-confirm" name="password_confirm" class="booking-input" required>
                        </div>
                    </div>
                    <p class="mt-4 text-sm text-slate-500">
                        You will complete your profile after creating your account.
                    </p>
                    <button type="submit" class="booking-button mt-4">
                        Create Account
                    </button>
                </form>
                </div>

                <div id="customer-auth-login" class="<?= $show_login ? '' : 'hidden' ?>">
                <div class="text-center text-sm text-slate-500">
                    Need to create an account?
                    <a href="#" id="customer-auth-show-register" class="booking-link">
                        Create Account
                    </a>
                </div>
                <form method="post" action="<?= site_url('customer/authenticate') ?>">
                    <input type="hidden" name="csrf_token" value="<?= e(vars('csrf_token')) ?>">
                    <div class="mt-6 space-y-4">
                        <div>
                            <label for="customer-login-email" class="form-label"><?= lang('email') ?></label>
                            <input type="email" id="customer-login-email" name="email" class="booking-input" required>
                        </div>
                        <div>
                            <label for="customer-login-password" class="form-label"><?= lang('password') ?></label>
                            <input type="password" id="customer-login-password" name="password" class="booking-input" required>
                        </div>
                    </div>
                    <button type="submit" class="booking-button mt-4">
                        Sign In
                    </button>
                </form>
                <div class="mt-4 text-sm text-slate-500">
                    <button type="button" id="customer-auth-request-otp" class="booking-link">
                        <?= lang('customer_login_send_code') ?>
                    </button>
                </div>
                <form id="customer-auth-otp-form" method="post" action="<?= site_url('customer/request_otp') ?>" hidden>
                    <input type="hidden" name="csrf_token" value="<?= e(vars('csrf_token')) ?>">
                    <input type="hidden" name="intent" value="login">
                    <input type="hidden" name="email" id="customer-auth-otp-email">
                </form>

                <?php if ($otp_pending && $otp_pending_intent === 'login'): ?>
                    <div class="mt-4 text-sm text-slate-500">
                        <?= strtr(lang('customer_login_otp_sent'), ['{$email}' => e($otp_pending_email)]) ?>
                    </div>
                    <form method="post" action="<?= site_url('customer/verify_otp') ?>" class="mt-4">
                        <input type="hidden" name="csrf_token" value="<?= e(vars('csrf_token')) ?>">
                        <input type="hidden" name="intent" value="login">
                        <input type="hidden" name="email" value="<?= e($otp_pending_email) ?>">
                        <div class="space-y-4">
                            <div>
                                <label for="customer-login-code" class="form-label">
                                    <?= lang('customer_login_otp_label') ?>
                                </label>
                                <input type="text"
                                       id="customer-login-code"
                                       name="code"
                                       class="booking-input"
                                       inputmode="numeric"
                                       autocomplete="one-time-code"
                                       pattern="[0-9]{6}"
                                       required>
                                <div class="form-text text-muted">
                                    <small><?= lang('customer_login_otp_hint') ?></small>
                                </div>
                            </div>
                        </div>
                        <button type="submit" class="booking-button mt-4">
                            <?= lang('customer_login_verify_code') ?>
                        </button>
                    </form>
                <?php endif; ?>
                </div>
            <?php elseif ($login_mode === 'otp'): ?>
                <div id="customer-auth-otp" class="">
                    <?php if (!$otp_pending): ?>
                        <p class="text-center text-sm text-slate-500">New and returning customers</p>
                        <form method="post" action="<?= site_url('customer/request_otp') ?>">
                            <input type="hidden" name="csrf_token" value="<?= e(vars('csrf_token')) ?>">
                            <input type="hidden" name="intent" value="<?= $show_login ? 'login' : 'register' ?>">
                            <div class="mt-6 space-y-4">
                                <div>
                                    <label for="customer-otp-email" class="form-label"><?= lang('email') ?></label>
                                    <input type="email"
                                           id="customer-otp-email"
                                           name="email"
                                           class="booking-input"
                                           required>
                                </div>
                            </div>
                            <button type="submit" class="booking-button mt-4">
                                <?= lang('customer_login_send_code') ?>
                            </button>
                        </form>
                    <?php else: ?>
                        <div class="mt-2 text-sm text-slate-500 text-center">
                            <?= strtr(lang('customer_login_otp_sent'), ['{$email}' => '<strong>' . e($otp_pending_email) . '</strong>']) ?>
                            <form method="post" action="<?= site_url('customer/request_otp') ?>" class="d-inline">
                                <input type="hidden" name="csrf_token" value="<?= e(vars('csrf_token')) ?>">
                                <input type="hidden" name="intent"
                                       value="<?= $otp_pending_intent === 'register' ? 'register' : 'login' ?>">
                                <input type="hidden" name="email" value="<?= e($otp_pending_email) ?>">
                                <button type="submit" class="booking-link border-0 bg-transparent p-0 align-baseline">
                                    <?= lang('customer_login_resend_code') ?>
                                </button>
                            </form>
                        </div>
                        <form method="post" action="<?= site_url('customer/verify_otp') ?>" class="mt-4">
                            <input type="hidden" name="csrf_token" value="<?= e(vars('csrf_token')) ?>">
                            <input type="hidden" name="intent" value="<?= $otp_pending_intent === 'register' ? 'register' : 'login' ?>">
                            <input type="hidden" name="email" value="<?= e($otp_pending_email) ?>">
                            <div class="space-y-4">
                                <div>
                                    <label for="customer-otp-digit-0" class="form-label">
                                        <?= lang('customer_login_otp_label') ?>
                                    </label>
                                    <input type="hidden" name="code" id="customer-otp-code" required>
                                    <div class="flex flex-nowrap items-center justify-center gap-2"
                                         id="customer-otp-inputs"
                                         data-otp-inputs>
                                        <?php for ($i = 0; $i < 6; $i++): ?>
                                            <input type="tel"
                                                   id="customer-otp-digit-<?= $i ?>"
                                                   inputmode="numeric"
                                                   pattern="[0-9]*"
                                                   maxlength="1"
                                                   autocomplete="one-time-code"
                                                   class="booking-input text-center text-lg font-semibold"
                                                   aria-label="<?= lang('customer_login_otp_label') ?> <?= $i + 1 ?>"
                                                   data-otp-index="<?= $i ?>">
                                        <?php endfor; ?>
                                    </div>
                                    <div class="form-text text-muted">
                                        <small><?= lang('customer_login_otp_hint') ?></small>
                                    </div>
                                </div>
                            </div>
                            <button type="submit" class="booking-button mt-4">
                                <?= lang('customer_login_verify_code') ?>
                            </button>
                        </form>
                        <div class="mt-4 text-sm text-slate-500 text-center">
                            <a href="<?= site_url('customer/login?reset_otp=1') ?>" class="booking-link">
                                <?= lang('back') ?>
                            </a>
                        </div>
                    <?php endif; ?>
                </div>
            <?php else: ?>
                <div id="customer-auth-register" class="<?= $show_login ? 'hidden' : '' ?>">
                    <div class="text-center text-sm text-slate-500">
                        Already have an account?
                        <a href="#" id="customer-auth-show-login" class="booking-link">
                            <?= lang('login') ?>
                        </a>
                    </div>
                    <form method="post" action="<?= site_url('customer/request_otp') ?>">
                        <input type="hidden" name="csrf_token" value="<?= e(vars('csrf_token')) ?>">
                        <input type="hidden" name="intent" value="register">
                        <div class="mt-6 space-y-4">
                            <div>
                                <label for="customer-register-email" class="form-label"><?= lang('email') ?></label>
                                <input type="email"
                                       id="customer-register-email"
                                       name="email"
                                       class="booking-input"
                                       value="<?= $otp_pending && $otp_pending_intent === 'register' ? e($otp_pending_email) : '' ?>"
                                       required>
                            </div>
                        </div>
                        <p class="mt-4 text-sm text-slate-500">
                            You will complete your profile after creating your account.
                        </p>
                        <button type="submit" class="booking-button mt-4">
                            <?= lang('customer_login_send_code') ?>
                        </button>
                    </form>

                    <?php if ($otp_pending && $otp_pending_intent === 'register'): ?>
                        <div class="mt-4 text-sm text-slate-500">
                            <?= strtr(lang('customer_login_otp_sent'), ['{$email}' => e($otp_pending_email)]) ?>
                        </div>
                        <form method="post" action="<?= site_url('customer/verify_otp') ?>" class="mt-4">
                            <input type="hidden" name="csrf_token" value="<?= e(vars('csrf_token')) ?>">
                            <input type="hidden" name="intent" value="register">
                            <input type="hidden" name="email" value="<?= e($otp_pending_email) ?>">
                            <div class="space-y-4">
                                <div>
                                    <label for="customer-register-code" class="form-label">
                                        <?= lang('customer_login_otp_label') ?>
                                    </label>
                                    <input type="text"
                                           id="customer-register-code"
                                           name="code"
                                           class="booking-input"
                                           inputmode="numeric"
                                           autocomplete="one-time-code"
                                           pattern="[0-9]{6}"
                                           required>
                                    <div class="form-text text-muted">
                                        <small><?= lang('customer_login_otp_hint') ?></small>
                                    </div>
                                </div>
                            </div>
                            <button type="submit" class="booking-button mt-4">
                                <?= lang('customer_login_verify_code') ?>
                            </button>
                        </form>
                    <?php endif; ?>
                </div>

                <div id="customer-auth-login" class="<?= $show_login ? '' : 'hidden' ?>">
                    <div class="text-center text-sm text-slate-500">
                        Need to create an account?
                        <a href="#" id="customer-auth-show-register" class="booking-link">
                            Create Account
                        </a>
                    </div>
                    <form method="post" action="<?= site_url('customer/request_otp') ?>">
                        <input type="hidden" name="csrf_token" value="<?= e(vars('csrf_token')) ?>">
                        <input type="hidden" name="intent" value="login">
                        <div class="mt-6 space-y-4">
                            <div>
                                <label for="customer-login-email" class="form-label"><?= lang('email') ?></label>
                                <input type="email"
                                       id="customer-login-email"
                                       name="email"
                                       class="booking-input"
                                       value="<?= $otp_pending && $otp_pending_intent === 'login' ? e($otp_pending_email) : '' ?>"
                                       required>
                            </div>
                        </div>
                        <button type="submit" class="booking-button mt-4">
                            <?= lang('customer_login_send_code') ?>
                        </button>
                    </form>

                    <?php if ($otp_pending && $otp_pending_intent === 'login'): ?>
                        <div class="mt-4 text-sm text-slate-500">
                            <?= strtr(lang('customer_login_otp_sent'), ['{$email}' => e($otp_pending_email)]) ?>
                        </div>
                        <form method="post" action="<?= site_url('customer/verify_otp') ?>" class="mt-4">
                            <input type="hidden" name="csrf_token" value="<?= e(vars('csrf_token')) ?>">
                            <input type="hidden" name="intent" value="login">
                            <input type="hidden" name="email" value="<?= e($otp_pending_email) ?>">
                            <div class="space-y-4">
                                <div>
                                    <label for="customer-login-code" class="form-label">
                                        <?= lang('customer_login_otp_label') ?>
                                    </label>
                                    <input type="text"
                                           id="customer-login-code"
                                           name="code"
                                           class="booking-input"
                                           inputmode="numeric"
                                           autocomplete="one-time-code"
                                           pattern="[0-9]{6}"
                                           required>
                                    <div class="form-text text-muted">
                                        <small><?= lang('customer_login_otp_hint') ?></small>
                                    </div>
                                </div>
                            </div>
                            <button type="submit" class="booking-button mt-4">
                                <?= lang('customer_login_verify_code') ?>
                            </button>
                        </form>
                    <?php endif; ?>
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>
<?php end_section('content'); ?>

<?php section('scripts'); ?>
<script>
    (function () {
        const registerPanel = document.getElementById('customer-auth-register');
        const loginPanel = document.getElementById('customer-auth-login');
        const showLogin = document.getElementById('customer-auth-show-login');
        const showRegister = document.getElementById('customer-auth-show-register');
        const requestOtpButton = document.getElementById('customer-auth-request-otp');
        const otpForm = document.getElementById('customer-auth-otp-form');
        const otpEmailInput = document.getElementById('customer-auth-otp-email');
        const loginEmailInput = document.getElementById('customer-login-email');
        const otpHiddenInput = document.getElementById('customer-otp-code');
        const otpInputsWrapper = document.querySelector('[data-otp-inputs]');

        const titleEl = document.getElementById('customer-auth-title');
        const togglePanels = (showLoginPanel) => {
            if (showLoginPanel) {
                registerPanel.classList.add('hidden');
                loginPanel.classList.remove('hidden');
                titleEl.textContent = '<?= e(lang('login')) ?>';
            } else {
                loginPanel.classList.add('hidden');
                registerPanel.classList.remove('hidden');
                titleEl.textContent = 'Create an Account';
            }
        };

        if (registerPanel && loginPanel && showLogin && showRegister) {
            const initialIsLogin = !loginPanel.classList.contains('hidden');
            togglePanels(initialIsLogin);

            showLogin.addEventListener('click', (event) => {
                event.preventDefault();
                togglePanels(true);
            });

            showRegister.addEventListener('click', (event) => {
                event.preventDefault();
                togglePanels(false);
            });
        }

        if (requestOtpButton && otpForm && otpEmailInput && loginEmailInput) {
            requestOtpButton.addEventListener('click', () => {
                otpEmailInput.value = loginEmailInput.value;
                otpForm.submit();
            });
        }

        if (otpHiddenInput && otpInputsWrapper) {
            const otpInputs = Array.from(otpInputsWrapper.querySelectorAll('input[data-otp-index]'));

            const syncOtpValue = () => {
                const code = otpInputs.map((input) => input.value).join('');
                otpHiddenInput.value = code;
            };

            otpInputs.forEach((input, index) => {
                input.setAttribute('maxlength', '1');

                const setValueAt = (targetIndex, value) => {
                    if (otpInputs[targetIndex]) {
                        otpInputs[targetIndex].value = value;
                    }
                };

                const distribute = (value) => {
                    const chars = String(value).replace(/[^0-9]/g, '').split('');
                    if (!chars.length) {
                        return;
                    }
                    chars.slice(0, otpInputs.length - index).forEach((char, offset) => {
                        setValueAt(index + offset, char);
                    });
                    syncOtpValue();
                    const nextIndex = Math.min(index + chars.length, otpInputs.length - 1);
                    if (otpInputs[nextIndex]) {
                        otpInputs[nextIndex].focus();
                    }
                };

                const isEmptyInput = (inputIndex) =>
                    inputIndex < otpInputs.length && otpInputs[inputIndex].value === '';

                input.addEventListener('keydown', (event) => {
                    if (event.ctrlKey || event.metaKey) {
                        return;
                    }

                    event.preventDefault();

                    switch (event.key) {
                        case 'ArrowLeft':
                            if (otpInputs[index - 1]) {
                                otpInputs[index - 1].focus();
                            }
                            break;
                        case 'ArrowRight':
                            if (otpInputs[index + 1]) {
                                otpInputs[index + 1].focus();
                            }
                            break;
                        case 'Backspace':
                        case 'Delete':
                            setValueAt(index, '');
                            if (event.key === 'Backspace' && otpInputs[index - 1]) {
                                otpInputs[index - 1].focus();
                            }
                            syncOtpValue();
                            break;
                        case 'Home':
                            if (otpInputs[0]) {
                                otpInputs[0].focus();
                            }
                            break;
                        case 'End':
                            if (otpInputs[otpInputs.length - 1]) {
                                otpInputs[otpInputs.length - 1].focus();
                            }
                            break;
                        default:
                            if (!/^[0-9]$/.test(event.key)) {
                                return;
                            }

                            if (isEmptyInput(index)) {
                                setValueAt(index, event.key);
                            }

                            if (isEmptyInput(index + 1) && otpInputs[index + 1]) {
                                otpInputs[index + 1].focus();
                            }

                            syncOtpValue();
                            break;
                    }
                });

                input.addEventListener('paste', (event) => {
                    event.preventDefault();
                    const pasted = (event.clipboardData?.getData('text') || '')
                        .replace(/[^0-9]/g, '')
                        .slice(0, otpInputs.length - index);

                    if (!pasted) {
                        return;
                    }

                    distribute(pasted);
                });
            });
        }
    })();
</script>
<?php end_section('scripts'); ?>
