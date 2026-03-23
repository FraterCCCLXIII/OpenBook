<?php
/**
 * Local variables.
 *
 * @var string $active_menu
 */
?>

<?php
$nav_link_base = 'backend-sidebar-link';
$nav_link_inactive = $nav_link_base;
$nav_link_active = $nav_link_base . ' is-active';
$dropdown_item_class = 'backend-sidebar-dropdown-item';
$dropdown_menu_class = 'backend-sidebar-dropdown dropdown-menu absolute z-50 mt-2 w-56 rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-2 shadow-lg';
?>

<aside class="backend-sidebar" aria-label="<?= lang('backend_section') ?>">
    <div class="backend-sidebar-inner">
        <div class="backend-sidebar-header">
            <a class="backend-sidebar-logo" href="<?= site_url('dashboard') ?>" aria-label="<?= lang('backend_section') ?>"
               data-sidebar-expand>
                <span class="backend-sidebar-logo-mark">
                    <?php component('company_logo', [
                        'company_logo' => vars('company_logo'),
                        'company_name' => setting('company_name'),
                        'height' => 18,
                        'class' => 'block h-5 w-auto',
                    ]); ?>
                </span>
                <span class="backend-sidebar-logo-toggle" aria-hidden="true">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                         class="lucide lucide-panel-left-icon lucide-panel-left">
                        <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                        <path d="M9 3v18"></path>
                    </svg>
                </span>
            </a>
            <button class="backend-sidebar-toggle" type="button" data-sidebar-toggle aria-expanded="true"
                    aria-label="Toggle sidebar">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                     class="lucide lucide-panel-left-icon lucide-panel-left">
                    <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                    <path d="M9 3v18"></path>
                </svg>
            </button>
        </div>

        <nav class="backend-sidebar-nav">
            <div class="backend-sidebar-scroll">
                <ul class="backend-sidebar-list">
                <?php $is_provider = vars('role_slug') === DB_SLUG_PROVIDER; ?>
                <?php if ($is_provider): ?>
                    <?php $active = $active_menu == 'provider_bookings'; ?>
                    <li>
                        <a href="<?= site_url('provider/bookings') ?>"
                           class="<?= $active ? $nav_link_active : $nav_link_inactive ?>"
                           aria-label="Bookings"
                           data-tippy-content="Bookings">
                            <i class="backend-sidebar-icon" data-lucide="list"></i>
                            <span class="backend-sidebar-label">Bookings</span>
                        </a>
                    </li>
                <?php endif; ?>
                <?php $hidden = can('view', PRIV_APPOINTMENTS) ? '' : 'hidden'; ?>
                <?php $active = $active_menu == PRIV_APPOINTMENTS; ?>
                <li class="<?= $hidden ?>">
                    <a href="<?= site_url(
                        'calendar' . (vars('calendar_view') === CALENDAR_VIEW_TABLE ? '?view=table' : ''),
                    ) ?>"
                       class="<?= $active ? $nav_link_active : $nav_link_inactive ?>"
                       aria-label="<?= lang('calendar') ?>"
                       data-tippy-content="<?= lang('calendar') ?>">
                        <i class="backend-sidebar-icon" data-lucide="calendar"></i>
                        <span class="backend-sidebar-label"><?= lang('calendar') ?></span>
                    </a>
                </li>

                <?php $hidden = can('view', PRIV_CUSTOMERS) ? '' : 'hidden'; ?>
                <?php $active = $active_menu == PRIV_CUSTOMERS; ?>
                <li class="<?= $hidden ?>">
                    <a href="<?= site_url('customers') ?>"
                       class="<?= $active ? $nav_link_active : $nav_link_inactive ?>"
                       aria-label="<?= lang('customers') ?>"
                       data-tippy-content="<?= lang('customers') ?>">
                        <i class="backend-sidebar-icon" data-lucide="user"></i>
                        <span class="backend-sidebar-label"><?= lang('customers') ?></span>
                    </a>
                </li>

                <?php $hidden = can('view', PRIV_SYSTEM_SETTINGS) ? '' : 'hidden'; ?>
                <?php $active = $active_menu == 'billing'; ?>
                <li class="<?= $hidden ?>">
                    <a href="<?= site_url('billing') ?>"
                       class="<?= $active ? $nav_link_active : $nav_link_inactive ?>"
                       aria-label="Billing"
                       data-tippy-content="Billing">
                        <i class="backend-sidebar-icon" data-lucide="file-text"></i>
                        <span class="backend-sidebar-label">Billing</span>
                    </a>
                </li>

                <?php $hidden = can('view', PRIV_SYSTEM_SETTINGS) ? '' : 'hidden'; ?>
                <?php $active = $active_menu == 'logs'; ?>
                <li class="<?= $hidden ?>">
                    <a href="<?= site_url('logs') ?>"
                       class="<?= $active ? $nav_link_active : $nav_link_inactive ?>"
                       aria-label="Logs"
                       data-tippy-content="Logs">
                        <i class="backend-sidebar-icon" data-lucide="scroll-text"></i>
                        <span class="backend-sidebar-label">Logs</span>
                    </a>
                </li>

                <?php $hidden = can('view', PRIV_SERVICES) ? '' : 'hidden'; ?>
                <?php $active = $active_menu == PRIV_SERVICES; ?>
                <li class="dropdown relative <?= $hidden ?>">
                    <button class="<?= $active ? $nav_link_active : $nav_link_inactive ?>"
                            type="button"
                            data-bs-toggle="dropdown"
                            aria-label="<?= lang('services') ?>"
                            data-tippy-content="<?= lang('services') ?>">
                        <i class="backend-sidebar-icon" data-lucide="briefcase"></i>
                        <span class="backend-sidebar-label"><?= lang('services') ?></span>
                        <i class="backend-sidebar-chevron" data-lucide="chevron-down"></i>
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
                    <button class="<?= $active ? $nav_link_active : $nav_link_inactive ?>"
                            type="button"
                            data-bs-toggle="dropdown"
                            aria-label="<?= lang('users') ?>"
                            data-tippy-content="<?= lang('users') ?>">
                        <i class="backend-sidebar-icon" data-lucide="users"></i>
                        <span class="backend-sidebar-label"><?= lang('users') ?></span>
                        <i class="backend-sidebar-chevron" data-lucide="chevron-down"></i>
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
        </nav>

        <div class="backend-sidebar-footer">
            <ul class="backend-sidebar-list">
                <?php slot('before_user_nav_item'); ?>

                <?php $hidden = can('view', PRIV_SYSTEM_SETTINGS) || can('view', PRIV_USER_SETTINGS) ? '' : 'hidden'; ?>
                <?php $active = $active_menu == PRIV_SYSTEM_SETTINGS; ?>
                <li class="dropdown relative <?= $hidden ?>">
                    <button class="<?= $active ? $nav_link_active : $nav_link_inactive ?>"
                            type="button"
                            data-bs-toggle="dropdown"
                            aria-label="<?= e(vars('user_display_name')) ?>"
                            data-tippy-content="<?= e(vars('user_display_name')) ?>">
                        <i class="backend-sidebar-icon" data-lucide="user"></i>
                        <span class="backend-sidebar-label"><?= e(vars('user_display_name')) ?></span>
                        <i class="backend-sidebar-chevron" data-lucide="chevron-down"></i>
                    </button>
                    <div class="<?= $dropdown_menu_class ?>">
                        <?php if (can('view', PRIV_SYSTEM_SETTINGS)): ?>
                            <a class="<?= $dropdown_item_class ?>" href="<?= site_url('general_settings') ?>">
                                Admin Settings
                            </a>
                        <?php endif; ?>

                        <?php slot('after_settings_dropdown_item'); ?>

                        <a class="<?= $dropdown_item_class ?>" href="<?= site_url('account') ?>">
                            <?= lang('account') ?>
                        </a>
                        <a class="<?= $dropdown_item_class ?>" href="<?= site_url('appointments') ?>">
                            <?= lang('go_to_booking_page') ?>
                        </a>
                        <div class="px-3 py-2">
                            <small class="mb-2 block text-xs text-slate-500">Language</small>
                            <button id="select-language" type="button"
                                    class="inline-flex w-full items-center justify-between rounded-lg border border-[var(--bs-border-color,#e2e8f0)] px-3 py-2 text-sm text-slate-600 hover:border-[var(--bs-border-color,#e2e8f0)] hover:text-slate-900">
                                <?= ucfirst(config('language')) ?>
                                <i class="backend-sidebar-chevron" data-lucide="chevron-down"></i>
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
</aside>
