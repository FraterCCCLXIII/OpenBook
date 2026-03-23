<?php extend('layouts/backend_layout'); ?>

<?php section('content'); ?>

<div id="business-logic-page" class="container backend-page">
    <div id="business-logic">
        <div class="row settings-layout">
            <div class="col-sm-3 settings-nav-panel ps-0">
                <?php component('settings_nav'); ?>
            </div>
            <div class="col-sm-9 settings-content">
                <form>
                    <fieldset>
                        <div class="d-flex justify-content-between align-items-center border-bottom mb-4 py-2">
                            <h4 class="text-slate-900 mb-3 text-lg font-medium"><?= lang('business_logic') ?></h4>

                            <?php if (can('edit', PRIV_SYSTEM_SETTINGS)): ?>
                                <button type="button" id="save-settings" class="btn btn-primary">
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

                            <table class="working-plan table table-striped">
                                <thead>
                                <tr>
                                    <th><?= lang('day') ?></th>
                                    <th><?= lang('start') ?></th>
                                    <th><?= lang('end') ?></th>
                                </tr>
                                </thead>
                                <tbody><!-- Dynamic Content --></tbody>
                            </table>

                            <div class="text-end">
                                <button class="btn btn-outline-secondary" id="apply-global-working-plan" type="button">
                                    <i class="fas fa-check"></i>
                                    <?= lang('apply_to_all_providers') ?>
                                </button>
                            </div>
                        </section>

                        <section class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-5 mb-5">
                            <div class="mb-4 flex items-center justify-between">
                                <h3 class="text-lg font-medium text-slate-900"><?= lang('breaks') ?></h3>
                            </div>

                            <p class="form-text text-muted">
                                <?= lang('edit_breaks_hint') ?>
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

                        <?php if (can('view', PRIV_BLOCKED_PERIODS)): ?>
                            <section class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-5 mb-5">
                                <div class="mb-4 flex items-center justify-between">
                                    <h3 class="text-lg font-medium text-slate-900"><?= lang('blocked_periods') ?></h3>
                                </div>

                                <p class="form-text text-muted">
                                    <?= lang('blocked_periods_hint') ?>
                                </p>

                                <div class="mb-0">
                                    <a href="<?= site_url('blocked_periods') ?>" class="btn btn-primary">
                                        <i class="fas fa-cogs me-2"></i>
                                        <?= lang('configure') ?>
                                    </a>
                                </div>
                            </section>
                        <?php endif; ?>

                        <section class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-5 mb-5">
                            <div class="mb-4 flex items-center justify-between">
                                <h3 class="text-lg font-medium text-slate-900"><?= lang(
                                    'allow_rescheduling_cancellation_before',
                                ) ?></h3>
                            </div>

                            <label for="book-advance-timeout" class="form-label">
                                <?= lang('timeout_minutes') ?>
                            </label>
                            <input id="book-advance-timeout" data-field="book_advance_timeout" class="form-control"
                                   type="number" min="15">
                            <div class="form-text text-muted">
                                <small>
                                    <?= lang('book_advance_timeout_hint') ?>
                                </small>
                            </div>
                        </section>

                        <section class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-5 mb-5">
                            <div class="mb-4 flex items-center justify-between">
                                <h3 class="text-lg font-medium text-slate-900"><?= lang('future_booking_limit') ?></h3>
                            </div>

                            <label for="future-booking-limit" class="form-label">
                                <?= lang('limit_days') ?>
                            </label>
                            <input id="future-booking-limit" data-field="future_booking_limit" class="form-control"
                                   type="number" min="15">
                            <div class="form-text text-muted">
                                <small>
                                    <?= lang('future_booking_limit_hint') ?>
                                </small>
                            </div>
                        </section>

                        <section class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-5">
                            <div class="mb-4 flex items-center justify-between">
                                <h3 class="text-lg font-medium text-slate-900"><?= lang('appointment_status_options') ?></h3>
                            </div>

                            <p class="form-text text-muted mb-4">
                                <?= lang('appointment_status_options_info') ?>
                            </p>

                            <?php component('appointment_status_options', [
                                'attributes' => 'id="appointment-status-options"',
                            ]); ?>
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

<script src="<?= asset_url('assets/vendor/jquery-jeditable/jquery.jeditable.min.js') ?>"></script>
<script src="<?= asset_url('assets/js/utils/ui.js') ?>"></script>
<script src="<?= asset_url('assets/js/utils/working_plan.js') ?>"></script>
<script src="<?= asset_url('assets/js/http/business_settings_http_client.js') ?>"></script>
<script src="<?= asset_url('assets/js/pages/business_settings.js') ?>"></script>

<?php end_section('scripts'); ?>

