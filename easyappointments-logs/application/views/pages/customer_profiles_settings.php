<?php extend('layouts/backend_layout'); ?>

<?php section('content'); ?>

<div id="customer-profiles-settings-page" class="container backend-page">
    <div id="customer-profiles-settings">
        <div class="row settings-layout">
            <div class="col-sm-3 settings-nav-panel ps-0">
                <?php component('settings_nav'); ?>
            </div>
            <div class="col-sm-9 settings-content">
                <form>
                    <fieldset>
                        <div class="d-flex justify-content-between align-items-center border-bottom mb-4 py-2">
                            <h4 class="text-slate-900 mb-3 text-lg font-medium"><?= lang('customer_profiles_settings') ?></h4>

                            <?php if (can('edit', PRIV_SYSTEM_SETTINGS)): ?>
                                <button type="button" id="save-settings" class="btn btn-primary">
                                    <i class="fas fa-check-square me-2"></i>
                                    <?= lang('save') ?>
                                </button>
                            <?php endif; ?>
                        </div>

                        <section class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-5 mb-5 w-full lg:w-1/2 lg:ml-auto">
                            <div class="mb-4 flex items-center justify-between">
                                <h3 class="text-lg font-medium text-slate-900"><?= lang('fields') ?></h3>
                            </div>
                            <div class="row fields-row">
                                <div class="col-12">
                                    <div class="form-group mb-5">
                                    <label for="first-name" class="form-label">
                                        <?= lang('first_name') ?>
                                        <span class="text-danger">*</span>
                                    </label>

                                    <input type="text" id="first-name" class="form-control mb-2" readonly/>

                                    <div class="d-flex">
                                        <div class="form-check form-switch me-4">
                                            <input class="form-check-input display-switch" type="checkbox"
                                                   id="display-first-name"
                                                   data-field="display_first_name">
                                            <label class="form-check-label" for="display-first-name">
                                                <?= lang('display') ?>
                                            </label>
                                        </div>

                                        <div class="form-check form-switch">
                                            <input class="form-check-input require-switch" type="checkbox"
                                                   id="require-first-name"
                                                   data-field="require_first_name">
                                            <label class="form-check-label" for="require-first-name">
                                                <?= lang('require') ?>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div class="form-group mb-5">
                                    <label for="last-name" class="form-label">
                                        <?= lang('last_name') ?>
                                        <span class="text-danger">*</span>
                                    </label>
                                    <input type="text" id="last-name" class="form-control mb-2" readonly/>
                                    <div class="d-flex">
                                        <div class="form-check form-switch me-4">
                                            <input class="form-check-input display-switch" type="checkbox"
                                                   id="display-last-name"
                                                   data-field="display_last_name">
                                            <label class="form-check-label" for="display-last-name">
                                                <?= lang('display') ?>
                                            </label>
                                        </div>

                                        <div class="form-check form-switch">
                                            <input class="form-check-input require-switch" type="checkbox"
                                                   id="require-last-name"
                                                   data-field="require_last_name">
                                            <label class="form-check-label" for="require-last-name">
                                                <?= lang('require') ?>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div class="form-group mb-5">
                                    <label for="email" class="form-label">
                                        <?= lang('email') ?>
                                        <span class="text-danger">*</span>
                                    </label>
                                    <input type="text" id="email" class="form-control mb-2" readonly/>
                                    <div class="d-flex">
                                        <div class="form-check form-switch me-4">
                                            <input class="form-check-input display-switch" type="checkbox"
                                                   id="display-email"
                                                   data-field="display_email">
                                            <label class="form-check-label" for="display-email">
                                                <?= lang('display') ?>
                                            </label>
                                        </div>

                                        <div class="form-check form-switch">
                                            <input class="form-check-input require-switch" type="checkbox"
                                                   id="require-email"
                                                   data-field="require_email">
                                            <label class="form-check-label" for="require-email">
                                                <?= lang('require') ?>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div class="form-group mb-3">
                                    <label for="phone-number" class="form-label">
                                        <?= lang('phone_number') ?>
                                        <span class="text-danger">*</span>
                                    </label>
                                    <input type="text" id="phone-number" class="form-control mb-2" readonly/>
                                    <div class="d-flex">
                                        <div class="form-check form-switch me-4">
                                            <input class="form-check-input display-switch" type="checkbox"
                                                   id="display-phone-number"
                                                   data-field="display_phone_number">
                                            <label class="form-check-label" for="display-phone-number">
                                                <?= lang('display') ?>
                                            </label>
                                        </div>

                                        <div class="form-check form-switch">
                                            <input class="form-check-input require-switch" type="checkbox"
                                                   id="require-phone-number"
                                                   data-field="require_phone_number">
                                            <label class="form-check-label" for="require-phone-number">
                                                <?= lang('require') ?>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div class="form-group mb-5">
                                    <label for="address" class="form-label">
                                        <?= lang('address') ?>
                                        <span class="text-danger">*</span>
                                    </label>
                                    <input type="text" id="address" class="form-control mb-2" readonly/>
                                    <div class="d-flex">
                                        <div class="form-check form-switch me-4">
                                            <input class="form-check-input display-switch" type="checkbox"
                                                   id="display-address"
                                                   data-field="display_address">
                                            <label class="form-check-label" for="display-address">
                                                <?= lang('display') ?>
                                            </label>
                                        </div>

                                        <div class="form-check form-switch">
                                            <input class="form-check-input require-switch" type="checkbox"
                                                   id="require-address"
                                                   data-field="require_address">
                                            <label class="form-check-label" for="require-address">
                                                <?= lang('require') ?>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div class="form-group mb-5">
                                    <label for="city" class="form-label">
                                        <?= lang('city') ?>
                                        <span class="text-danger">*</span>
                                    </label>
                                    <input type="text" id="city" class="form-control mb-2" readonly/>
                                    <div class="d-flex">
                                        <div class="form-check form-switch me-4">
                                            <input class="form-check-input display-switch" type="checkbox"
                                                   id="display-city"
                                                   data-field="display_city">
                                            <label class="form-check-label" for="display-city">
                                                <?= lang('display') ?>
                                            </label>
                                        </div>

                                        <div class="form-check form-switch">
                                            <input class="form-check-input require-switch" type="checkbox"
                                                   id="require-city"
                                                   data-field="require_city">
                                            <label class="form-check-label" for="require-city">
                                                <?= lang('require') ?>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div class="form-group mb-5">
                                    <label for="zip-code" class="form-label">
                                        <?= lang('zip_code') ?>
                                        <span class="text-danger">*</span>
                                    </label>
                                    <input type="text" id="zip-code" class="form-control mb-2" readonly/>
                                    <div class="d-flex">
                                        <div class="form-check form-switch me-4">
                                            <input class="form-check-input display-switch" type="checkbox"
                                                   id="display-zip-code"
                                                   data-field="display_zip_code">
                                            <label class="form-check-label" for="display-zip-code">
                                                <?= lang('display') ?>
                                            </label>
                                        </div>

                                        <div class="form-check form-switch">
                                            <input class="form-check-input require-switch" type="checkbox"
                                                   id="require-zip-code"
                                                   data-field="require_zip_code">
                                            <label class="form-check-label" for="require-zip-code">
                                                <?= lang('require') ?>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div class="form-group mb-3">
                                    <label for="notes" class="form-label">
                                        <?= lang('notes') ?>
                                        <span class="text-danger">*</span>
                                    </label>
                                    <textarea id="notes" class="form-control mb-2" rows="1" readonly></textarea>
                                    <div class="d-flex">
                                        <div class="form-check form-switch me-4">
                                            <input class="form-check-input display-switch" type="checkbox"
                                                   id="display-notes"
                                                   data-field="display_notes">
                                            <label class="form-check-label" for="display-notes">
                                                <?= lang('display') ?>
                                            </label>
                                        </div>

                                        <div class="form-check form-switch">
                                            <input class="form-check-input require-switch" type="checkbox"
                                                   id="require-notes"
                                                   data-field="require_notes">
                                            <label class="form-check-label" for="require-notes">
                                                <?= lang('require') ?>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        </section>

                        <section class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-5 mb-5">
                            <div class="mb-4 flex items-center justify-between">
                                <h3 class="text-lg font-medium text-slate-900"><?= lang('custom_fields') ?></h3>
                            </div>

                            <div id="custom-fields-list" class="d-flex flex-column gap-3 mb-3"></div>
                            <button type="button" id="add-custom-field-setting" class="btn btn-outline-secondary">
                                Add Custom Field
                            </button>
                            <div id="custom-fields-debug" class="text-xs text-slate-400 mt-3"></div>
                        </section>
                    </fieldset>
                </form>
            </div>
        </div>
    </div>
</div>

<?php end_section('content'); ?>

<?php section('scripts'); ?>

<script src="<?= asset_url('assets/js/http/customer_profiles_settings_http_client.js') ?>"></script>
<script src="<?= asset_url('assets/js/pages/customer_profiles_settings.js') ?>?v=<?= time() ?>"></script>

<?php end_section('scripts'); ?>
