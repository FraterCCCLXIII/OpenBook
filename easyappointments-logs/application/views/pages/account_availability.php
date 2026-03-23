<?php extend('layouts/backend_layout'); ?>

<?php section('content'); ?>

<div id="account-availability-page" class="container backend-page">
    <div class="row settings-layout">
        <div class="col-sm-3 settings-nav-panel ps-0">
            <?php component('account_nav', [
                'active_nav' => 'account/availability',
                'show_forms_nav' => vars('show_forms_nav', false),
                'show_service_area_nav' => vars('show_service_area_nav', false),
                'show_availability_nav' => vars('show_availability_nav', false),
            ]); ?>
        </div>
        <div class="col-sm-9 settings-content">
            <div id="account-availability">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h4 class="text-dark mb-0 fw-medium fs-3">
                        <?= lang('availability') ?>
                    </h4>

                    <?php if (can('edit', PRIV_USER_SETTINGS)): ?>
                        <button type="button" id="save-availability" class="btn btn-primary">
                            <i class="fas fa-check-square me-2"></i>
                            <?= lang('save') ?>
                        </button>
                    <?php endif; ?>
                </div>

                <section class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-5 mb-5">
                    <div class="mb-4 flex items-center justify-between">
                        <h3 class="text-lg font-medium text-slate-900"><?= lang('working_plan') ?></h3>
                    </div>

                    <p class="form-text text-muted mb-4">
                        <?= lang('edit_working_plan_hint') ?>
                    </p>

                    <button id="reset-working-plan" class="btn btn-outline-secondary"
                            data-tippy-content="<?= lang('reset_working_plan') ?>">
                        <i class="fas fa-undo-alt me-2"></i>
                        <?= lang('reset_plan') ?>
                    </button>

                    <table class="working-plan table table-striped mt-3">
                        <thead>
                        <tr>
                            <th><?= lang('day') ?></th>
                            <th><?= lang('start') ?></th>
                            <th><?= lang('end') ?></th>
                        </tr>
                        </thead>
                        <tbody><!-- Dynamic Content --></tbody>
                    </table>
                </section>

                <section class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-5 mb-5">
                    <div class="mb-4 flex items-center justify-between">
                        <h3 class="text-lg font-medium text-slate-900"><?= lang('breaks') ?></h3>
                    </div>

                    <p class="form-text text-muted">
                        <?= lang('add_breaks_during_each_day') ?>
                    </p>

                    <div class="mt-2">
                        <button type="button" class="add-break btn btn-primary">
                            <i class="fas fa-plus-square me-2"></i>
                            <?= lang('add_break') ?>
                        </button>
                    </div>

                    <br>

                    <table class="breaks table table-striped mb-0">
                        <thead>
                        <tr>
                            <th><?= lang('day') ?></th>
                            <th><?= lang('start') ?></th>
                            <th><?= lang('end') ?></th>
                            <th><?= lang('actions') ?></th>
                        </tr>
                        </thead>
                        <tbody><!-- Dynamic Content --></tbody>
                    </table>
                </section>

                <section class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-5">
                    <div class="mb-4 flex items-center justify-between">
                        <h3 class="text-lg font-medium text-slate-900"><?= lang('working_plan_exceptions') ?></h3>
                    </div>

                    <p class="form-text text-muted">
                        <?= lang('add_working_plan_exceptions_during_each_day') ?>
                    </p>

                    <div class="mt-2">
                        <button type="button" class="add-working-plan-exception btn btn-primary">
                            <i class="fas fa-plus-square me-2"></i>
                            <?= lang('add_working_plan_exception') ?>
                        </button>
                    </div>

                    <br>

                    <table class="working-plan-exceptions table table-striped">
                        <thead>
                        <tr>
                            <th><?= lang('day') ?></th>
                            <th><?= lang('start') ?></th>
                            <th><?= lang('end') ?></th>
                            <th><?= lang('actions') ?></th>
                        </tr>
                        </thead>
                        <tbody><!-- Dynamic Content --></tbody>
                    </table>

                    <?php component('working_plan_exceptions_modal'); ?>
                </section>
            </div>
        </div>
    </div>
</div>

<?php end_section('content'); ?>

<?php section('scripts'); ?>

<script src="<?= asset_url('assets/vendor/jquery-jeditable/jquery.jeditable.min.js') ?>"></script>
<script src="<?= asset_url('assets/js/utils/ui.js') ?>"></script>
<script src="<?= asset_url('assets/js/utils/working_plan.js') ?>"></script>
<script src="<?= asset_url('assets/js/components/working_plan_exceptions_modal.js') ?>"></script>
<script src="<?= asset_url('assets/js/http/account_http_client.js') ?>"></script>
<script src="<?= asset_url('assets/js/pages/account_availability.js') ?>"></script>

<?php end_section('scripts'); ?>
