<?php extend('layouts/backend_layout'); ?>

<?php section('content'); ?>

<div id="account-forms-page" class="container backend-page">
    <div class="row settings-layout">
        <div class="col-sm-3 settings-nav-panel ps-0">
            <?php component('account_nav', [
                'active_nav' => 'account/forms',
                'show_forms_nav' => vars('show_forms_nav', false),
                'show_service_area_nav' => vars('show_service_area_nav', false),
                'show_availability_nav' => vars('show_availability_nav', false),
            ]); ?>
        </div>
        <div class="col-sm-9 settings-content">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h4 class="text-dark mb-0 fw-medium fs-3"><?= lang('forms') ?></h4>
            </div>
            <div class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white overflow-hidden">
                <table class="w-full text-left text-sm" id="account-forms-table">
                    <thead class="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500 border-b border-[var(--bs-border-color,#e2e8f0)]">
                    <tr>
                        <th class="px-4 py-3">Form</th>
                        <th class="px-4 py-3">Status</th>
                        <th class="px-4 py-3 text-right">Action</th>
                    </tr>
                    </thead>
                    <tbody id="account-forms-body" class="divide-y divide-[var(--bs-border-color,#e2e8f0)]">
                        <!-- JS -->
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<?php end_section('content'); ?>

<?php section('scripts'); ?>

<script src="<?= asset_url('assets/js/http/forms_http_client.js') ?>"></script>
<script src="<?= asset_url('assets/js/pages/account_forms.js') ?>"></script>

<?php end_section('scripts'); ?>
