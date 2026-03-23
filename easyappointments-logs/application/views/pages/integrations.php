<?php extend('layouts/backend_layout'); ?>

<?php section('content'); ?>

<div id="integrations-page" class="container backend-page">
    <div class="row settings-layout">
        <div class="col-sm-3 settings-nav-panel ps-0">
            <?php component('settings_nav'); ?>
        </div>
        <div id="integrations" class="col-sm-9 settings-content">
            <h4 class="text-slate-900 mb-3 text-lg font-medium"><?= lang('integrations') ?></h4>

            <p class="form-text text-muted mb-4">
                <?= lang('integrations_info') ?>
            </p>

            <div class="row">
                <div class="col-sm-6 mb-4">
                    <section class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-5 h-100 d-flex flex-column">
                        <div class="mb-4 flex items-center justify-between">
                            <h3 class="text-lg font-medium text-slate-900">
                                <?= lang('webhooks') ?>
                            </h3>
                        </div>
                        <div class="mb-4 integration-info">
                            <small class="form-text text-muted mb-0">
                                <?= lang('webhooks_info') ?>
                            </small>
                        </div>
                        <div class="mt-auto">
                            <a href="<?= site_url('webhooks') ?>" class="btn btn-outline-secondary">
                                <i class="fas fa-cog me-2"></i>
                                <?= lang('configure') ?>
                            </a>
                        </div>
                    </section>
                </div>

                <div class="col-sm-6 mb-4">
                    <section class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-5 h-100 d-flex flex-column">
                        <div class="mb-4 flex items-center justify-between">
                            <h3 class="text-lg font-medium text-slate-900">
                                <?= lang('google_analytics') ?>
                            </h3>
                        </div>
                        <div class="mb-4 integration-info">
                            <small class="form-text text-muted mb-0">
                                <?= lang('google_analytics_info') ?>
                            </small>
                        </div>
                        <div class="mt-auto">
                            <a href="<?= site_url('google_analytics_settings') ?>"
                               class="btn btn-outline-secondary">
                                <i class="fas fa-cog me-2"></i>
                                <?= lang('configure') ?>
                            </a>
                        </div>
                    </section>
                </div>

                <div class="col-sm-6 mb-4">
                    <section class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-5 h-100 d-flex flex-column">
                        <div class="mb-4 flex items-center justify-between">
                            <h3 class="text-lg font-medium text-slate-900">
                                <?= lang('matomo_analytics') ?>
                            </h3>
                        </div>
                        <div class="mb-4 integration-info">
                            <small class="form-text text-muted mb-0">
                                <?= lang('matomo_analytics_info') ?>
                            </small>
                        </div>
                        <div class="mt-auto">
                            <a href="<?= site_url('matomo_analytics_settings') ?>"
                               class="btn btn-outline-secondary">
                                <i class="fas fa-cog me-2"></i>
                                <?= lang('configure') ?>
                            </a>
                        </div>
                    </section>
                </div>

                <div class="col-sm-6 mb-4">
                    <section class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-5 h-100 d-flex flex-column">
                        <div class="mb-4 flex items-center justify-between">
                            <h3 class="text-lg font-medium text-slate-900">
                                <?= lang('api') ?>
                            </h3>
                        </div>
                        <div class="mb-4 integration-info">
                            <small class="form-text text-muted mb-0">
                                <?= lang('api_info') ?>
                            </small>
                        </div>
                        <div class="mt-auto">
                            <a href="<?= site_url('api_settings') ?>" class="btn btn-outline-secondary">
                                <i class="fas fa-cog me-2"></i>
                                <?= lang('configure') ?>
                            </a>
                        </div>
                    </section>
                </div>

                <div class="col-sm-6 mb-4">
                    <section class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-5 h-100 d-flex flex-column">
                        <div class="mb-4 flex items-center justify-between">
                            <h3 class="text-lg font-medium text-slate-900">
                                <?= lang('ldap') ?>
                            </h3>
                        </div>
                        <div class="mb-4 integration-info">
                            <small class="form-text text-muted mb-0">
                                <?= lang('ldap_info') ?>
                            </small>
                        </div>
                        <div class="mt-auto">
                            <a href="<?= site_url('ldap_settings') ?>" class="btn btn-outline-secondary">
                                <i class="fas fa-cog me-2"></i>
                                <?= lang('configure') ?>
                            </a>
                        </div>
                    </section>
                </div>

                <?php slot('after_integration_cards'); ?>
            </div>
        </div>
    </div>
</div>

<?php end_section('content'); ?>

