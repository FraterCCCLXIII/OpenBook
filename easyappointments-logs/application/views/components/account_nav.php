<?php
/**
 * Local variables.
 *
 * @var string $active_nav
 * @var bool $show_forms_nav
 * @var bool $show_service_area_nav
 * @var bool $show_availability_nav
 */
$active_nav = $active_nav ?? 'account';
$show_forms_nav = $show_forms_nav ?? false;
$show_service_area_nav = $show_service_area_nav ?? false;
$show_availability_nav = $show_availability_nav ?? false;
?>

<div class="settings-nav-panel-inner d-flex flex-column">
    <div class="settings-nav-section flex-column border-0 p-0">
        <div class="settings-nav-heading">Account</div>
        <nav class="settings-nav-list d-flex flex-column gap-px">
            <div>
                <a class="settings-nav-item-link backend-sidebar-link <?= $active_nav === 'account' ? 'active' : '' ?>"
                   href="<?= site_url('account') ?>"
                   title="<?= e(lang('account_settings')) ?>">
                    <span class="settings-nav-icon backend-sidebar-icon">
                        <i data-lucide="user" class="backend-sidebar-icon" aria-hidden="true"></i>
                    </span>
                    <span class="settings-nav-label backend-sidebar-label text-truncate"><?= lang('account_settings') ?></span>
                </a>
            </div>
            <?php if ($show_forms_nav): ?>
                <div>
                    <a class="settings-nav-item-link backend-sidebar-link <?= $active_nav === 'account/forms' ? 'active' : '' ?>"
                       href="<?= site_url('account/forms') ?>"
                       title="Forms">
                        <span class="settings-nav-icon backend-sidebar-icon">
                            <i data-lucide="list" class="backend-sidebar-icon" aria-hidden="true"></i>
                    </span>
                        <span class="settings-nav-label backend-sidebar-label text-truncate">Forms</span>
                    </a>
                </div>
            <?php endif; ?>
            <?php if ($show_service_area_nav): ?>
                <div>
                    <a class="settings-nav-item-link backend-sidebar-link <?= $active_nav === 'account/service_areas' ? 'active' : '' ?>"
                       href="<?= site_url('account/service_areas') ?>"
                       title="<?= e(lang('service_area_preferences')) ?>">
                        <span class="settings-nav-icon backend-sidebar-icon">
                            <i data-lucide="map" class="backend-sidebar-icon" aria-hidden="true"></i>
                        </span>
                        <span class="settings-nav-label backend-sidebar-label text-truncate">
                            <?= lang('service_area_preferences') ?>
                        </span>
                    </a>
                </div>
            <?php endif; ?>
            <?php if ($show_availability_nav): ?>
                <div>
                    <a class="settings-nav-item-link backend-sidebar-link <?= $active_nav === 'account/availability' ? 'active' : '' ?>"
                       href="<?= site_url('account/availability') ?>"
                       title="<?= e(lang('availability')) ?>">
                        <span class="settings-nav-icon backend-sidebar-icon">
                            <i data-lucide="calendar-clock" class="backend-sidebar-icon" aria-hidden="true"></i>
                        </span>
                        <span class="settings-nav-label backend-sidebar-label text-truncate">
                            <?= lang('availability') ?>
                        </span>
                    </a>
                </div>
            <?php endif; ?>
        </nav>
    </div>
</div>
