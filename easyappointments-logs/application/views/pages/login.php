<?php extend('layouts/account_layout'); ?>

<?php section('content'); ?>

<div class="d-flex justify-content-center mb-4">
    <?php component('company_logo', [
        'company_logo' => vars('company_logo'),
        'company_name' => vars('company_name'),
        'height' => 48,
    ]); ?>
</div>

<div class="alert d-none"></div>

<form id="login-form">
    <div class="mb-3">
        <label for="username" class="form-label text-sm font-medium text-slate-700">
            <?= lang('username') ?>
        </label>
        <input type="text" id="username" placeholder="<?= lang(
            'enter_username_here',
        ) ?>"
               class="form-control rounded-xl border border-[var(--bs-border-color,#e2e8f0)] px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-[var(--bs-border-color,#e2e8f0)] focus:outline-none"
               required/>
    </div>

    <div class="mb-5">
        <label for="password" class="form-label text-sm font-medium text-slate-700">
            <?= lang('password') ?>
        </label>
        <input type="password" id="password" placeholder="<?= lang(
            'enter_password_here',
        ) ?>"
               class="form-control rounded-xl border border-[var(--bs-border-color,#e2e8f0)] px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-[var(--bs-border-color,#e2e8f0)] focus:outline-none"
               required/>
    </div>

    <div class="d-flex justify-content-start align-items-center gap-3 mb-5">
        <button type="submit" id="login" class="btn btn-primary">
            <i class="fas fa-sign-in-alt me-2"></i>
            <?= lang('login') ?>
        </button>
        <a href="<?= site_url('recovery') ?>" class="forgot-password"><?= lang('forgot_your_password') ?></a>
    </div>
</form>
<?php end_section('content'); ?>

<?php section('scripts'); ?>

<script src="<?= asset_url('assets/js/http/login_http_client.js') ?>"></script>
<script src="<?= asset_url('assets/js/pages/login.js') ?>"></script>

<?php end_section('scripts'); ?>
