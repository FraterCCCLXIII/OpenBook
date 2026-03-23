<?php extend('layouts/backend_layout'); ?>

<?php section('content'); ?>

<div class="container-fluid backend-page" id="calendar-page">
    <div id="calendar-toolbar" class="mb-6 animate-fade-in">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-center gap-4">
                <h1 class="text-2xl font-semibold text-slate-900">
                    <?= lang('calendar') ?>
                </h1>
                <div id="calendar-filter">
                    <select id="select-filter-item"
                            class="form-select"
                            data-tippy-content="<?= lang('select_filter_item_hint') ?>"
                            aria-label="<?= lang('filter') ?>">
                        <!-- JS -->
                    </select>
                </div>
            </div>

            <div id="calendar-actions" class="flex flex-wrap items-center gap-2 sm:justify-end">
                <div id="calendar-header-controls" class="flex flex-wrap items-center gap-2"></div>
                <div id="calendar-view-toggle" class="ea-view-toggle">
                    <?php if (vars('calendar_view') === CALENDAR_VIEW_DEFAULT): ?>
                        <span class="ea-view-toggle-btn ea-view-toggle-btn--active"
                              aria-label="<?= lang('default') ?>"
                              aria-pressed="true"
                              title="<?= lang('default') ?>">
                    <?php else: ?>
                        <a class="ea-view-toggle-btn"
                           href="<?= site_url('calendar?view=default') ?>"
                           aria-label="<?= lang('default') ?>"
                           title="<?= lang('default') ?>">
                    <?php endif; ?>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                    <?php if (vars('calendar_view') === CALENDAR_VIEW_DEFAULT): ?>
                        </span>
                    <?php else: ?>
                        </a>
                    <?php endif; ?>

                    <?php if (vars('calendar_view') === CALENDAR_VIEW_TABLE): ?>
                        <span class="ea-view-toggle-btn ea-view-toggle-btn--active"
                              aria-label="<?= lang('table') ?>"
                              aria-pressed="true"
                              title="<?= lang('table') ?>">
                    <?php else: ?>
                        <a class="ea-view-toggle-btn"
                           href="<?= site_url('calendar?view=table') ?>"
                           aria-label="<?= lang('table') ?>"
                           title="<?= lang('table') ?>">
                    <?php endif; ?>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                                <path d="M12 3v18"></path>
                            </svg>
                    <?php if (vars('calendar_view') === CALENDAR_VIEW_TABLE): ?>
                        </span>
                    <?php else: ?>
                        </a>
                    <?php endif; ?>
                </div><!-- /#calendar-view-toggle -->

                <div class="ea-button-group">
                <?php if (can('add', PRIV_APPOINTMENTS)): ?>
                    <div class="dropdown d-sm-inline-block">
                        <button class="btn"
                                type="button"
                                data-bs-toggle="dropdown"
                                aria-label="<?= lang('add') ?>">
                            <i data-lucide="plus" class="w-4 h-4"></i>
                        </button>
                        <ul class="dropdown-menu mt-2 w-64 rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-2 shadow-lg">
                            <li>
                                <a class="dropdown-item block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                   href="#"
                                   id="insert-appointment">
                                    <?= lang('appointment') ?>
                                </a>
                            </li>
                            <li>
                                <a class="dropdown-item block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                   href="#"
                                   id="insert-unavailability">
                                    <?= lang('unavailability') ?>
                                </a>
                            </li>
                            <li>
                                <a class="dropdown-item block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                   href="#"
                                   id="insert-working-plan-exception" <?= session('role_slug') !== DB_SLUG_ADMIN
                                       ? 'hidden'
                                       : '' ?>>
                                    <?= lang('working_plan_exception') ?>
                                </a>
                            </li>
                        </ul>
                    </div>
                <?php endif; ?>

                <button id="reload-appointments"
                        type="button"
                        class="btn"
                        data-tippy-content="<?= lang('reload_appointments_hint') ?>"
                        aria-label="<?= lang('reload') ?>">
                    <i data-lucide="rotate-cw" class="w-4 h-4"></i>
                </button>
                <div class="dropdown d-sm-inline-block"
                     <?= vars('calendar_view') !== CALENDAR_VIEW_DEFAULT ? 'hidden' : '' ?>>
                    <button class="btn"
                            type="button"
                            data-bs-toggle="dropdown"
                            aria-label="<?= lang('synchronize') ?>">
                        <i data-lucide="more-vertical" class="w-4 h-4"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end mt-2 w-56 rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-2 shadow-lg">
                        <li>
                            <button id="enable-sync"
                                    class="dropdown-item block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                    data-tippy-content="<?= lang('enable_appointment_sync_hint') ?>"
                                    type="button"
                                    hidden>
                                <?= lang('enable_sync') ?>
                            </button>
                        </li>
                        <li>
                            <button id="trigger-sync"
                                    class="dropdown-item block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                    data-tippy-content="<?= lang('trigger_sync_hint') ?>"
                                    type="button">
                                <?= lang('synchronize') ?>
                            </button>
                        </li>
                        <li>
                            <a class="dropdown-item block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                               href="#"
                               id="disable-sync"
                               hidden>
                                <?= lang('disable_sync') ?>
                            </a>
                        </li>
                    </ul>
                </div>
                </div><!-- /.ea-button-group -->

                <?php slot('after_calendar_actions'); ?>
            </div>
        </div>
    </div>

    <div id="calendar">
        <!-- Dynamically Generated Content -->
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

<?php component('unavailabilities_modal', [
    'timezones' => vars('timezones'),
    'timezone' => vars('timezone'),
]); ?>

<?php component('working_plan_exceptions_modal'); ?>

<?php end_section('content'); ?>

<?php section('scripts'); ?>

<script src="<?= asset_url('assets/vendor/fullcalendar/index.global.min.js') ?>"></script>
<script src="<?= asset_url('assets/vendor/fullcalendar-moment/index.global.min.js') ?>"></script>
<script src="<?= asset_url('assets/vendor/jquery-jeditable/jquery.jeditable.min.js') ?>"></script>
<script src="<?= asset_url('assets/js/utils/ui.js') ?>"></script>
<script src="<?= asset_url('assets/js/utils/calendar_default_view.js') ?>"></script>
<script src="<?= asset_url('assets/js/utils/calendar_table_view.js') ?>"></script>
<script src="<?= asset_url('assets/js/utils/calendar_event_popover.js') ?>"></script>
<script src="<?= asset_url('assets/js/http/calendar_http_client.js') ?>"></script>
<script src="<?= asset_url('assets/js/http/customers_http_client.js') ?>"></script>
<?php if (vars('calendar_view') === CALENDAR_VIEW_DEFAULT): ?>
    <script src="<?= asset_url('assets/js/utils/calendar_sync.js') ?>"></script>
    <script src="<?= asset_url('assets/js/http/google_http_client.js') ?>"></script>
    <script src="<?= asset_url('assets/js/http/caldav_http_client.js') ?>"></script>
<?php endif; ?>
<script src="<?= asset_url('assets/js/pages/calendar.js') ?>"></script>

<?php end_section('scripts'); ?>
