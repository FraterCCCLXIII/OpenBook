<?php extend('layouts/backend_layout'); ?>

<?php section('content'); ?>

<div class="backend-page customers-page-fullbleed" id="customers-page">
    <div class="row g-0" id="customers">
        <div id="filter-customers" class="filter-records column col-12 col-md-5 backend-sticky-panel customers-inbox-panel">
            <div class="d-flex justify-content-between align-items-center mb-3 customers-inbox-header">
                <h2 class="backend-page-title mb-0">
                    <?= lang('customers') ?>
                </h2>

                <?php if (
                    can('add', PRIV_CUSTOMERS) &&
                    (
                        vars('role_slug') === DB_SLUG_ADMIN ||
                        (vars('role_slug') === DB_SLUG_PROVIDER && !setting('limit_provider_customer_access')) ||
                        (vars('role_slug') === DB_SLUG_SECRETARY && !setting('limit_secretary_customer_access'))
                    )
                ): ?>
                    <div class="ea-button-group">
                        <button id="add-customer" class="btn btn-primary btn-sm">
                            <i class="fas fa-plus-square me-2"></i>
                            <?= lang('add') ?>
                        </button>
                    </div>
                <?php endif; ?>
            </div>

            <?php slot('after_page_title'); ?>

            <form class="mb-3 customers-inbox-search">
                <div class="input-group mb-0">
                    <input type="text" class="key form-control" aria-label="keyword">

                    <button class="filter btn btn-outline-secondary" type="submit"
                            data-tippy-content="<?= lang('filter') ?>">
                        <i class="fas fa-search"></i>
                    </button>
                </div>
            </form>

            <div class="results customers-inbox-results">
                <!-- JS -->
            </div>
        </div>

        <div class="record-details col-12 col-md-7">
            <input id="customer-record-id" type="hidden">

            <div class="mb-4 rounded-xl border border-[var(--bs-border-color,#e2e8f0)] overflow-hidden bg-white">
                <div class="p-4">
                    <div class="d-flex w-100 justify-content-between gap-3">
                        <div>
                            <div class="text-lg font-medium text-slate-900" id="customer-summary-name">
                                —
                            </div>
                            <div class="mt-2" id="customer-summary-id-container">
                                <span class="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 border border-slate-200">
                                    Customer ID: <span id="customer-summary-id" class="ms-1">—</span>
                                </span>
                            </div>
                        </div>
                    <div id="customer-actions-group" class="d-flex align-items-start">
                                <div class="dropdown">
                                    <button class="btn btn-outline-secondary btn-sm"
                                            type="button"
                                            id="customer-actions-menu"
                                            data-bs-toggle="dropdown"
                                            aria-expanded="false"
                                            aria-label="<?= lang('actions') ?>">
                                        <i class="fas fa-ellipsis-vertical"></i>
                                    </button>
                                    <ul class="dropdown-menu dropdown-menu-end mt-0" style="top: calc(100% - 6px);">
                                        <?php if (can('edit', PRIV_CUSTOMERS)): ?>
                                            <li>
                                                <button id="edit-customer"
                                                        class="dropdown-item"
                                                        type="button"
                                                        disabled="disabled">
                                                    <i class="fas fa-edit me-2"></i>
                                                    <?= lang('edit') ?>
                                                </button>
                                            </li>
                                        <?php endif; ?>
                                        <?php if (can('delete', PRIV_CUSTOMERS)): ?>
                                            <li>
                                                <button id="delete-customer"
                                                        class="dropdown-item"
                                                        type="button"
                                                        disabled="disabled">
                                                    <i class="fas fa-trash-alt me-2"></i>
                                                    <?= lang('delete') ?>
                                                </button>
                                            </li>
                                        <?php endif; ?>
                                    </ul>
                                </div>
                            </div>

                            <div id="customer-save-cancel-group" class="d-none align-items-start gap-2">
                                <button id="save-customer" class="btn btn-primary btn-sm">
                                    <i class="fas fa-check-square me-2"></i>
                                    <?= lang('save') ?>
                                </button>
                                <button id="cancel-customer" class="btn btn-outline-secondary btn-sm">
                                    <?= lang('cancel') ?>
                                </button>
                            </div>
                    </div>
                    <div class="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-700 ps-1">
                        <span class="inline-flex items-center gap-2" id="customer-summary-email">
                            <i data-lucide="mail" style="width: 16px; height: 16px;" class="text-slate-600"></i>
                            <span class="summary-text">—</span>
                        </span>
                        <span class="inline-flex items-center gap-2" id="customer-summary-phone">
                            <i data-lucide="phone" style="width: 16px; height: 16px;" class="text-slate-600"></i>
                            <span class="summary-text">—</span>
                        </span>
                        <span class="inline-flex items-center gap-2" id="customer-summary-location">
                            <i data-lucide="map-pin" style="width: 16px; height: 16px;" class="text-slate-600"></i>
                            <span class="summary-text">—</span>
                        </span>
                    </div>
                </div>
                <div id="customer-alert-banner" class="customer-alert-banner" role="status" aria-live="polite">
                    <!-- JS -->
                </div>
                <div class="border-t border-[var(--bs-border-color,#e2e8f0)] customer-tabs-scroll">
                    <ul class="booking-tab-line-list border-0 bg-transparent shadow-none rounded-none px-4"
                        id="customer-tabs" role="tablist">
                        <li class="nav-item" role="presentation">
                            <button class="booking-tab-line active" id="customer-appointments-tab" data-bs-toggle="pill"
                                    data-bs-target="#customer-appointments-panel" type="button" role="tab"
                                    aria-selected="true">
                                <?= lang('appointments') ?>
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="booking-tab-line" id="customer-billing-tab" data-bs-toggle="pill"
                                    data-bs-target="#customer-billing-panel" type="button" role="tab"
                                    aria-selected="false" tabindex="-1">
                                Billing History
                            </button>
                        </li>
                        <?php if (in_array(vars('role_slug'), [DB_SLUG_ADMIN, 'manager'], true)): ?>
                            <li class="nav-item" role="presentation">
                                <button class="booking-tab-line" id="customer-activity-tab" data-bs-toggle="pill"
                                        data-bs-target="#customer-activity-panel" type="button" role="tab"
                                        aria-selected="false" tabindex="-1">
                                    Activity
                                </button>
                            </li>
                        <?php endif; ?>
                        <li class="nav-item" role="presentation">
                            <button class="booking-tab-line" id="customer-notes-tab" data-bs-toggle="pill"
                                    data-bs-target="#customer-notes-panel" type="button" role="tab"
                                    aria-selected="false" tabindex="-1">
                                <?= lang('notes') ?>
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="booking-tab-line" id="customer-alerts-tab" data-bs-toggle="pill"
                                    data-bs-target="#customer-alerts-panel" type="button" role="tab"
                                    aria-selected="false" tabindex="-1">
                                Alerts
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="booking-tab-line" id="customer-visit-notes-tab" data-bs-toggle="pill"
                                    data-bs-target="#customer-visit-notes-panel" type="button" role="tab"
                                    aria-selected="false" tabindex="-1">
                                Visit Notes
                            </button>
                        </li>
                        <?php if (vars('show_customer_forms_tab', false)): ?>
                            <li class="nav-item" role="presentation">
                                <button class="booking-tab-line" id="customer-forms-tab" data-bs-toggle="pill"
                                        data-bs-target="#customer-forms-panel" type="button" role="tab"
                                        aria-selected="false" tabindex="-1">
                                    Forms
                                </button>
                            </li>
                        <?php endif; ?>
                        <li class="nav-item" role="presentation">
                            <button class="booking-tab-line" id="customer-files-tab" data-bs-toggle="pill"
                                    data-bs-target="#customer-files-panel" type="button" role="tab"
                                    aria-selected="false" tabindex="-1">
                                Files
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="booking-tab-line" id="customer-account-tab" data-bs-toggle="pill"
                                    data-bs-target="#customer-account-panel" type="button" role="tab"
                                    aria-selected="false" tabindex="-1">
                                <?= lang('account') ?>
                            </button>
                        </li>
                    </ul>
                </div>
            </div>

            <div class="tab-content mt-6 w-full" id="customer-tabs-content">
                <div class="tab-pane fade show active" id="customer-appointments-panel" role="tabpanel"
                     aria-labelledby="customer-appointments-tab">
                    <div id="customer-appointments" class="w-full">
                        <div id="customer-appointments-list"></div>
                        <div id="customer-appointment-details" class="d-none">
                            <div class="mb-4 d-flex flex-wrap justify-content-between gap-3">
                                <button type="button" id="customer-appointment-back"
                                        class="btn btn-outline-secondary">
                                    <i class="fas fa-arrow-left me-2"></i>
                                    <?= lang('back') ?> <?= lang('appointments') ?>
                                </button>
                                <a id="customer-appointment-edit-link" href="#"
                                   class="customer-appointment-edit btn btn-primary">
                                    <?= lang('edit') ?>
                                </a>
                            </div>
                            <div class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-4">
                                <div class="text-lg font-medium text-slate-900">
                                    <?= lang('appointment_details_title') ?>
                                </div>
                                <div class="mt-4 grid grid-cols-3 gap-4 text-sm text-slate-700">
                                    <div>
                                        <div class="text-xs font-medium uppercase text-slate-400">Booking ID</div>
                                        <div id="customer-appointment-id">—</div>
                                    </div>
                                    <div>
                                        <div class="text-xs font-medium uppercase text-slate-400">Booking Code</div>
                                        <div id="customer-appointment-hash">—</div>
                                    </div>
                                    <div>
                                        <div class="text-xs font-medium uppercase text-slate-400">
                                            <?= lang('service') ?>
                                        </div>
                                        <div id="customer-appointment-service">—</div>
                                    </div>
                                    <div>
                                        <div class="text-xs font-medium uppercase text-slate-400">
                                            <?= lang('date') ?>
                                        </div>
                                        <div id="customer-appointment-date">—</div>
                                    </div>
                                    <div>
                                        <div class="text-xs font-medium uppercase text-slate-400">Time</div>
                                        <div id="customer-appointment-time">—</div>
                                    </div>
                                    <div>
                                        <div class="text-xs font-medium uppercase text-slate-400">
                                            <?= lang('duration') ?>
                                        </div>
                                        <div id="customer-appointment-duration">—</div>
                                    </div>
                                    <div>
                                        <div class="text-xs font-medium uppercase text-slate-400">
                                            <?= lang('status') ?>
                                        </div>
                                        <div id="customer-appointment-status">—</div>
                                    </div>
                                    <div>
                                        <div class="text-xs font-medium uppercase text-slate-400">
                                            <?= lang('provider') ?>
                                        </div>
                                        <div id="customer-appointment-provider">—</div>
                                    </div>
                                    <div>
                                        <div class="text-xs font-medium uppercase text-slate-400">
                                            <?= lang('customer') ?>
                                        </div>
                                        <div id="customer-appointment-customer">—</div>
                                    </div>
                                    <div class="col-span-3">
                                        <div class="text-xs font-medium uppercase text-slate-400">
                                            <?= lang('address') ?>
                                        </div>
                                        <div id="customer-appointment-address">—</div>
                                    </div>
                                    <div>
                                        <div class="text-xs font-medium uppercase text-slate-400">Billing Status</div>
                                        <div id="customer-appointment-payment-status">—</div>
                                    </div>
                                    <div>
                                        <div class="text-xs font-medium uppercase text-slate-400">
                                            <?= lang('amount') ?>
                                        </div>
                                        <div id="customer-appointment-payment-amount">—</div>
                                    </div>
                                </div>
                            </div>
                            <div class="mt-4 rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-4">
                                <div class="text-xs font-medium uppercase text-slate-400">Visit Status</div>
                                <div class="mt-2 d-flex flex-wrap gap-2">
                                    <button type="button" class="btn btn-outline-secondary customer-appointment-status"
                                            data-status="Arrived">Arrived</button>
                                    <button type="button" class="btn btn-outline-secondary customer-appointment-status"
                                            data-status="Left">Left</button>
                                    <button type="button" class="btn btn-outline-secondary customer-appointment-status"
                                            data-status="No-show">No-show</button>
                                    <button type="button" id="customer-appointment-complete"
                                            class="btn btn-primary customer-appointment-status"
                                            data-status="Completed">Complete</button>
                                </div>
                            </div>
                            <div class="mt-4 rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-4">
                                <div class="text-xs font-medium uppercase text-slate-400">Visit Notes</div>
                                <textarea id="customer-appointment-notes" class="form-control mt-2"
                                          rows="4"></textarea>
                                <div class="mt-3 d-flex justify-content-end">
                                    <button type="button" id="customer-appointment-save-notes"
                                            class="btn btn-primary">
                                        <?= lang('save') ?>
                                    </button>
                                </div>
                            </div>
                            <div id="customer-appointment-notes-list" class="mt-4 d-flex flex-column gap-3"></div>
                            <?php if (in_array(vars('role_slug'), [DB_SLUG_ADMIN, 'manager'], true)): ?>
                                <div class="mt-4 rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-4">
                                    <div class="text-xs font-medium uppercase text-slate-400">Appointment Activity</div>
                                    <div id="customer-appointment-activity-list" class="mt-3 d-flex flex-column gap-2"></div>
                                </div>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>
                <div class="tab-pane fade" id="customer-billing-panel" role="tabpanel"
                     aria-labelledby="customer-billing-tab">
                    <div id="customer-billing" class="w-full overflow-hidden rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white">
                        <div class="p-0">
                            <table class="w-full text-left text-sm">
                                <thead class="text-xs font-medium tracking-wide text-slate-500 border-b border-[var(--bs-border-color,#e2e8f0)] normal-case">
                                    <tr>
                                        <th class="px-4 py-3 normal-case"><?= lang('date') ?></th>
                                        <th class="px-4 py-3 normal-case"><?= lang('amount') ?></th>
                                        <th class="px-4 py-3 normal-case"><?= lang('status') ?></th>
                                    </tr>
                                </thead>
                                <tbody id="billing-history-body" class="divide-y divide-[var(--bs-border-color,#e2e8f0)]">
                                    <!-- JS -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <?php if (in_array(vars('role_slug'), [DB_SLUG_ADMIN, 'manager'], true)): ?>
                    <div class="tab-pane fade" id="customer-activity-panel" role="tabpanel"
                         aria-labelledby="customer-activity-tab">
                        <div id="customer-activity-list" class="w-full d-flex flex-column gap-3"></div>
                    </div>
                <?php endif; ?>
                <div class="tab-pane fade" id="customer-notes-panel" role="tabpanel"
                     aria-labelledby="customer-notes-tab">
                    <div id="customer-notes-tab-content" class="w-full">
                        <div class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-4">
                            <label for="customer-note-text" class="form-label text-slate-700">
                                <?= lang('notes') ?>
                            </label>
                            <textarea id="customer-note-text" class="form-control" rows="4"></textarea>
                            <div class="mt-3 d-flex justify-content-end">
                                <button id="add-customer-note" class="btn btn-primary">
                                    <?= lang('add') ?> <?= lang('notes') ?>
                                </button>
                            </div>
                        </div>
                        <div id="customer-notes-list" class="mt-4 d-flex flex-column gap-3"></div>
                    </div>
                </div>
                <div class="tab-pane fade" id="customer-alerts-panel" role="tabpanel"
                     aria-labelledby="customer-alerts-tab">
                    <div id="customer-alerts-tab-content" class="w-full">
                        <div class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-4">
                            <label for="customer-alert-text" class="form-label text-slate-700">
                                Alert
                            </label>
                            <textarea id="customer-alert-text" class="form-control" rows="4"></textarea>
                            <div class="mt-3 d-flex justify-content-end">
                                <button id="add-customer-alert" class="btn btn-primary">
                                    Add Alert
                                </button>
                            </div>
                        </div>
                        <div id="customer-alerts-list" class="mt-4 d-flex flex-column gap-3"></div>
                    </div>
                </div>
                <div class="tab-pane fade" id="customer-visit-notes-panel" role="tabpanel"
                     aria-labelledby="customer-visit-notes-tab">
                    <div id="customer-visit-notes" class="w-full">
                        <div id="customer-visit-notes-list" class="d-flex flex-column gap-3"></div>
                    </div>
                </div>
                <?php if (vars('show_customer_forms_tab', false)): ?>
                    <div class="tab-pane fade" id="customer-forms-panel" role="tabpanel"
                         aria-labelledby="customer-forms-tab">
                        <div class="user-forms-panel w-full" data-user-type="customer"
                             data-can-reset="<?= can('edit', PRIV_CUSTOMERS) ? '1' : '0' ?>"
                             data-can-remind="<?= can('view', PRIV_CUSTOMERS) ? '1' : '0' ?>">
                            <div class="w-full overflow-hidden rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white">
                                <table class="w-full text-left text-sm">
                                    <thead class="text-xs font-medium tracking-wide text-slate-500 border-b border-[var(--bs-border-color,#e2e8f0)] normal-case">
                                        <tr>
                                            <th class="px-4 py-3 normal-case">Form</th>
                                            <th class="px-4 py-3 normal-case">Status</th>
                                            <th class="px-4 py-3 text-right normal-case">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody class="user-forms-body divide-y divide-[var(--bs-border-color,#e2e8f0)]">
                                        <!-- JS -->
                                    </tbody>
                                </table>
                                <div class="border-t border-[var(--bs-border-color,#e2e8f0)] px-4 py-3">
                                    <div class="d-flex justify-content-end">
                                        <button type="button" class="btn btn-outline-primary user-forms-reminder">
                                            Send Reminder
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                <?php endif; ?>
                <div class="tab-pane fade" id="customer-files-panel" role="tabpanel"
                     aria-labelledby="customer-files-tab">
                    <div class="user-files-panel w-full" data-user-type="customer"
                         data-can-upload="<?= can('edit', PRIV_CUSTOMERS) ? '1' : '0' ?>"
                         data-can-delete="<?= can('delete', PRIV_CUSTOMERS) ? '1' : '0' ?>">
                        <div class="mb-4">
                            <div class="user-files-dropzone rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-slate-50/60 p-4 text-center d-flex flex-column align-items-center justify-content-center gap-2"
                                 role="button" tabindex="0" aria-label="Upload customer files">
                                <input type="file" class="user-files-input visually-hidden" multiple>
                                <div class="text-sm text-slate-600">Drag and drop files here.</div>
                                <div class="mt-2">
                                    <button type="button" class="user-files-upload btn btn-outline-secondary"
                                            <?= can('edit', PRIV_CUSTOMERS) ? '' : 'disabled' ?>>
                                        Upload File
                                    </button>
                                </div>
                                <div class="mt-2 text-xs text-slate-400">PDFs can be viewed inline.</div>
                            </div>
                        </div>
                        <div class="w-full overflow-hidden rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white">
                            <table class="w-full text-left text-sm">
                                <thead class="text-xs font-medium tracking-wide text-slate-500 border-b border-[var(--bs-border-color,#e2e8f0)] normal-case">
                                    <tr>
                                        <th class="px-4 py-3 normal-case">Name</th>
                                        <th class="px-4 py-3 normal-case">Size</th>
                                        <th class="px-4 py-3 normal-case">Date</th>
                                        <th class="px-4 py-3 text-right normal-case">Actions</th>
                                    </tr>
                                </thead>
                                <tbody class="user-files-body divide-y divide-[var(--bs-border-color,#e2e8f0)]">
                                    <!-- JS -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="tab-pane fade" id="customer-account-panel" role="tabpanel"
                     aria-labelledby="customer-account-tab">
                    <div class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-4">
                        <div id="form-message" class="alert" style="display:none;"></div>

                        <div class="row">
                            <div class="col-12">
                                <div class="mb-3">
                                    <label for="first-name" class="form-label">
                                        <?= lang('first_name') ?>
                                        <?php if (vars('require_first_name')): ?>
                                            <span class="text-danger" hidden>*</span>
                                        <?php endif; ?>
                                    </label>
                                    <input type="text" id="first-name"
                                           class="<?= vars('require_first_name') ? 'required' : '' ?> form-control"
                                           maxlength="100" disabled/>
                                </div>

                            <div class="mb-3">
                                <label for="last-name" class="form-label">
                                    <?= lang('last_name') ?>
                                    <?php if (vars('require_last_name')): ?>
                                        <span class="text-danger" hidden>*</span>
                                    <?php endif; ?>
                                </label>
                                <input type="text" id="last-name"
                                       class="<?= vars('require_last_name') ? 'required' : '' ?> form-control"
                                       maxlength="120" disabled/>
                            </div>

                            <div class="mb-3">
                                <label for="email" class="form-label">
                                    <?= lang('email') ?>
                                    <?php if (vars('require_email')): ?>
                                        <span class="text-danger" hidden>*</span>
                                    <?php endif; ?>
                                </label>
                                <input type="text" id="email"
                                       class="<?= vars('require_email') ? 'required' : '' ?> form-control"
                                       maxlength="120" disabled/>
                            </div>

                            <div class="mb-3">
                                <label for="phone-number" class="form-label">
                                    <?= lang('phone_number') ?>
                                    <?php if (vars('require_phone_number')): ?>
                                        <span class="text-danger" hidden>*</span>
                                    <?php endif; ?>
                                </label>
                                <input type="text" id="phone-number" maxlength="60"
                                       class="<?= vars('require_phone_number') ? 'required' : '' ?> form-control"
                                       disabled/>
                            </div>

                            <div class="mb-3">
                                <label for="address" class="form-label">
                                    <?= lang('address') ?>
                                    <?php if (vars('require_address')): ?>
                                        <span class="text-danger" hidden>*</span>
                                    <?php endif; ?>
                                </label>
                                <input type="text" id="address"
                                       class="<?= vars('require_address') ? 'required' : '' ?> form-control"
                                       maxlength="120" disabled/>
                            </div>

                            <div class="mb-3">
                                <label for="city" class="form-label">
                                    <?= lang('city') ?>
                                    <?php if (vars('require_city')): ?>
                                        <span class="text-danger" hidden>*</span>
                                    <?php endif; ?>
                                </label>
                                <input type="text" id="city"
                                       class="<?= vars('require_city') ? 'required' : '' ?> form-control"
                                       maxlength="120" disabled/>
                            </div>

                            <div class="mb-3">
                                <label for="zip-code" class="form-label">
                                    <?= lang('zip_code') ?>
                                    <?php if (vars('require_zip_code')): ?>
                                        <span class="text-danger" hidden>*</span>
                                    <?php endif; ?>
                                </label>
                                <input type="text" id="zip-code"
                                       class="<?= vars('require_zip_code') ? 'required' : '' ?> form-control"
                                       maxlength="120" disabled/>
                            </div>

                            <div class="mb-3">
                                <label class="form-label" for="language">
                                    <?= lang('language') ?>
                                    <span class="text-danger" hidden>*</span>
                                </label>
                                <select id="language" class="form-select required" disabled>
                                    <?php foreach (vars('available_languages') as $available_language): ?>
                                        <option value="<?= $available_language ?>">
                                            <?= ucfirst($available_language) ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </div>

                            <div class="mb-3">
                                <label class="form-label" for="timezone">
                                    <?= lang('timezone') ?>
                                    <span class="text-danger" hidden>*</span>
                                </label>
                                <?php component('timezone_dropdown', [
                                    'attributes' => 'id="timezone" class="form-control required" disabled',
                                    'grouped_timezones' => vars('grouped_timezones'),
                                ]); ?>
                            </div>

                            <?php if (setting('ldap_is_active')): ?>
                                <div class="mb-3">
                                    <label for="ldap-dn" class="form-label">
                                        <?= lang('ldap_dn') ?>
                                    </label>
                                    <input type="text" id="ldap-dn" class="form-control" maxlength="100" disabled/>
                                </div>
                            <?php endif; ?>

                            <?php component('custom_fields', [
                                'fields' => vars('custom_fields') ?? [],
                                'disabled' => true,
                                'show_all' => false,
                            ]); ?>

                            <div class="mb-3">
                                <label class="form-label" for="notes">
                                    <?= lang('notes') ?>
                                </label>
                                <textarea id="notes" rows="4" class="form-control" disabled></textarea>
                            </div>

                                <?php slot('after_primary_fields'); ?>
                            </div>
                        </div>

                        <?php slot('after_secondary_fields'); ?>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Page Components -->

<?php component('appointments_modal', [
    'available_services' => vars('available_services'),
    'appointment_status_options' => vars('appointment_status_options'),
    'timezones' => vars('timezones'),
    'require_first_name' => vars('require_first_name'),
    'require_last_name' => vars('require_last_name'),
    'require_email' => vars('require_email'),
    'require_phone_number' => vars('require_phone_number'),
    'require_address' => vars('require_address'),
    'require_city' => vars('require_city'),
    'require_zip_code' => vars('require_zip_code'),
    'require_notes' => vars('require_notes'),
]); ?>

<?php end_section('content'); ?>

<?php section('scripts'); ?>

<script src="<?= asset_url('assets/js/http/appointments_http_client.js') ?>"></script>
<script src="<?= asset_url('assets/js/http/customers_http_client.js') ?>"></script>
<script src="<?= asset_url('assets/js/http/forms_http_client.js') ?>"></script>
<script src="<?= asset_url('assets/js/http/user_files_http_client.js') ?>"></script>
<script src="<?= asset_url('assets/js/components/user_forms.js') ?>"></script>
<script src="<?= asset_url('assets/js/components/user_files.js') ?>"></script>
<script src="<?= asset_url('assets/js/components/activity_timeline.js') ?>"></script>
<script src="<?= asset_url('assets/js/pages/customers.js') ?>"></script>

<?php end_section('scripts'); ?>
