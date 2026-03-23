<?php
/**
 * Local variables.
 *
 * @var string $active_menu
 * @var string $company_logo
 */
?>

<?php
$nav_link_base = 'inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium transition';
$nav_link_inactive = $nav_link_base . ' text-slate-600 hover:bg-slate-100 hover:text-slate-900';
$nav_link_active = $nav_link_base . ' bg-slate-100 text-slate-900';
$dropdown_item_class = 'block rounded-lg px-3 py-2 text-sm normal-case text-slate-600 hover:bg-slate-100 hover:text-slate-900';
$dropdown_menu_class = 'dropdown-menu dropdown-menu-end absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-2 shadow-lg';
?>

<nav id="header" class="sticky top-0 z-40 border-b border-[var(--bs-border-color,#e2e8f0)] bg-white">
    <div class="mx-auto w-full px-4 py-3 backend-header-grid">
        <a id="header-logo" href="<?= site_url('dashboard') ?>" class="flex items-center text-slate-900">
            <?php component('company_logo', [
                'company_logo' => vars('company_logo'),
                'company_name' => setting('company_name'),
                'height' => 32,
                'class' => 'block h-8 w-auto',
            ]); ?>
        </a>

        <div id="header-menu" class="flex justify-center header-menu">
            <ul class="flex items-center gap-1">
                    <?php $hidden = can('view', PRIV_APPOINTMENTS) ? '' : 'hidden'; ?>
                    <?php $active = $active_menu == PRIV_APPOINTMENTS; ?>
                    <li class="<?= $hidden ?>">
                        <a href="<?= site_url(
                            'calendar' . (vars('calendar_view') === CALENDAR_VIEW_TABLE ? '?view=table' : ''),
                        ) ?>"
                           class="<?= $active ? $nav_link_active : $nav_link_inactive ?>"
                           data-tippy-content="<?= lang('manage_appointment_record_hint') ?>">
                            <i class="backend-header-icon mr-2" data-lucide="calendar"></i>
                            <?= lang('calendar') ?>
                        </a>
                    </li>

                    <?php $hidden = can('view', PRIV_CUSTOMERS) ? '' : 'hidden'; ?>
                    <?php $active = $active_menu == PRIV_CUSTOMERS; ?>
                    <li class="<?= $hidden ?>">
                        <a href="<?= site_url('customers') ?>" class="<?= $active ? $nav_link_active : $nav_link_inactive ?>"
                           data-tippy-content="<?= lang('manage_customers_hint') ?>">
                            <i class="backend-header-icon mr-2" data-lucide="user"></i>
                            <?= lang('customers') ?>
                        </a>
                    </li>

                    <?php $hidden = can('view', PRIV_SYSTEM_SETTINGS) ? '' : 'hidden'; ?>
                    <?php $active = $active_menu == 'billing'; ?>
                    <li class="<?= $hidden ?>">
                        <a href="<?= site_url('billing') ?>" class="<?= $active ? $nav_link_active : $nav_link_inactive ?>"
                           data-tippy-content="View all billing transactions">
                            <i class="backend-header-icon mr-2" data-lucide="file-text"></i>
                            Billing
                        </a>
                    </li>

                    <?php $hidden = can('view', PRIV_SERVICES) ? '' : 'hidden'; ?>
                    <?php $active = $active_menu == PRIV_SERVICES; ?>
                    <li class="dropdown relative <?= $hidden ?>">
                        <button class="<?= $active ? $nav_link_active : $nav_link_inactive ?> gap-2"
                                type="button"
                                data-bs-toggle="dropdown"
                           data-tippy-content="<?= lang('manage_services_hint') ?>">
                            <i class="backend-header-icon" data-lucide="briefcase"></i>
                            <?= lang('services') ?>
                            <i class="backend-header-chevron" data-lucide="chevron-down"></i>
                        </button>
                        <div class="<?= $dropdown_menu_class ?>">
                            <a class="<?= $dropdown_item_class ?>" href="<?= site_url('services') ?>">
                                <?= lang('services') ?>
                            </a>
                            <a class="<?= $dropdown_item_class ?>" href="<?= site_url('service_categories') ?>">
                                <?= lang('categories') ?>
                            </a>
                        </div>
                    </li>

                    <?php $hidden = can('view', PRIV_USERS) ? '' : 'hidden'; ?>
                    <?php $active = $active_menu == PRIV_USERS; ?>
                    <li class="dropdown relative <?= $hidden ?>">
                        <button class="<?= $active ? $nav_link_active : $nav_link_inactive ?> gap-2"
                                type="button"
                                data-bs-toggle="dropdown"
                           data-tippy-content="<?= lang('manage_users_hint') ?>">
                            <i class="backend-header-icon" data-lucide="users"></i>
                            <?= lang('users') ?>
                            <i class="backend-header-chevron" data-lucide="chevron-down"></i>
                        </button>
                        <div class="<?= $dropdown_menu_class ?>">
                            <a class="<?= $dropdown_item_class ?>" href="<?= site_url('providers') ?>">
                                <?= lang('providers') ?>
                            </a>
                            <a class="<?= $dropdown_item_class ?>" href="<?= site_url('secretaries') ?>">
                                <?= lang('secretaries') ?>
                            </a>
                            <a class="<?= $dropdown_item_class ?>" href="<?= site_url('admins') ?>">
                                <?= lang('admins') ?>
                            </a>
                        </div>
                    </li>
            </ul>
        </div>

        <div class="flex justify-end header-account">
            <ul class="flex items-center gap-1">
                    <?php slot('before_user_nav_item'); ?>

                    <?php $hidden = can('view', PRIV_SYSTEM_SETTINGS) || can('view', PRIV_USER_SETTINGS) ? '' : 'hidden'; ?>
                    <?php $active = $active_menu == PRIV_SYSTEM_SETTINGS; ?>
                    <li class="dropdown relative <?= $hidden ?>">
                        <button class="<?= $active ? $nav_link_active : $nav_link_inactive ?> gap-2"
                                type="button"
                                data-bs-toggle="dropdown"
                           data-tippy-content="<?= lang('settings_hint') ?>">
                            <i class="backend-header-icon" data-lucide="user"></i>
                            <?= e(vars('user_display_name')) ?>
                            <i class="backend-header-chevron" data-lucide="chevron-down"></i>
                        </button>
                        <div class="<?= $dropdown_menu_class ?>">
                            <?php if (can('view', PRIV_SYSTEM_SETTINGS)): ?>
                                <a class="<?= $dropdown_item_class ?>" href="<?= site_url('general_settings') ?>">
                                    <?= lang('settings') ?>
                                </a>
                            <?php endif; ?>

                            <?php slot('after_settings_dropdown_item'); ?>

                            <a class="<?= $dropdown_item_class ?>" href="<?= site_url('account') ?>">
                                <?= lang('account') ?>
                            </a>
                            <?php if (can('view', PRIV_SYSTEM_SETTINGS)): ?>
                                <a class="<?= $dropdown_item_class ?>" href="<?= site_url('components') ?>">
                                    Components
                                </a>
                                <a class="<?= $dropdown_item_class ?>" href="<?= site_url('about') ?>">
                                    <?= lang('about') ?>
                                </a>
                            <?php endif; ?>
                            <a class="<?= $dropdown_item_class ?>" href="<?= site_url('appointments') ?>">
                                <?= lang('go_to_booking_page') ?>
                            </a>
                            <div class="px-3 py-2">
                                <small class="mb-2 block text-xs text-slate-500">Language</small>
                                <button id="select-language" type="button"
                                        class="inline-flex w-full items-center justify-between rounded-lg border border-[var(--bs-border-color,#e2e8f0)] px-3 py-2 text-sm text-slate-600 hover:border-[var(--bs-border-color,#e2e8f0)] hover:text-slate-900">
                                    <?= ucfirst(config('language')) ?>
                                    <i class="backend-header-chevron" data-lucide="chevron-down"></i>
                                </button>
                            </div>
                            <div class="my-2 border-t border-[var(--bs-border-color,#e2e8f0)]"></div>
                            <a class="<?= $dropdown_item_class ?>" href="<?= site_url('logout') ?>">
                                <?= lang('log_out') ?>
                            </a>
                        </div>
                    </li>
            </ul>
        </div>
    </div>
</nav>

<div id="notification" style="display: none;"></div>

<div id="loading" style="display: none;">
    <div class="any-element animation is-loading">
        &nbsp;
    </div>
</div>
