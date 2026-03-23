<?php
/**
 * Local variables.
 *
 * @var string|null $active_menu
 */
$current_route = $active_menu ?? uri_string();
$active_route_map = [
    'general_settings' => 'general_settings',
    'booking_settings' => 'booking_settings',
    'email_notifications_settings' => 'email_notifications_settings',
    'service_area_settings' => 'service_area_settings',
    'customer_profiles_settings' => 'customer_profiles_settings',
    'business_settings' => 'business_settings',
    'legal_settings' => 'legal_settings',
    'forms_settings' => 'forms_settings',
    'customer_login_settings' => 'customer_login_settings',
    'integrations' => 'integrations',
    'api_settings' => 'integrations',
    'ldap_settings' => 'integrations',
    'google_analytics_settings' => 'integrations',
    'matomo_analytics_settings' => 'integrations',
    'stripe_settings' => 'stripe_settings',
    'stripe' => 'stripe_settings',
    'components' => 'components',
    'about' => 'about',
];
$active_route = $active_route_map[$current_route] ?? $current_route;
?>

<div class="settings-nav-panel-inner d-flex flex-column">
    <div class="settings-nav-section flex-column border-0 p-0">
        <div class="settings-nav-heading">Settings</div>
        <nav id="settings-nav" class="settings-nav-list d-flex flex-column gap-px">
            <div>
                <a class="settings-nav-item-link backend-sidebar-link <?= $active_route === 'general_settings' ? 'active' : '' ?>"
                   href="<?= site_url('general_settings') ?>"
                   title="<?= e(lang('general_settings')) ?>">
                    <span class="settings-nav-icon backend-sidebar-icon">
                        <i data-lucide="settings" class="backend-sidebar-icon" aria-hidden="true"></i>
                    </span>
                    <span class="settings-nav-label backend-sidebar-label text-truncate"><?= lang('general_settings') ?></span>
                </a>
            </div>
            <div>
                <a class="settings-nav-item-link backend-sidebar-link <?= $active_route === 'booking_settings' ? 'active' : '' ?>"
                   href="<?= site_url('booking_settings') ?>"
                   title="<?= e(lang('booking_settings')) ?>">
                    <span class="settings-nav-icon backend-sidebar-icon">
                        <i data-lucide="calendar" class="backend-sidebar-icon" aria-hidden="true"></i>
                    </span>
                    <span class="settings-nav-label backend-sidebar-label text-truncate"><?= lang('booking_settings') ?></span>
                </a>
            </div>
            <div>
                <a class="settings-nav-item-link backend-sidebar-link <?= $active_route === 'email_notifications_settings' ? 'active' : '' ?>"
                   href="<?= site_url('email_notifications_settings') ?>"
                   title="<?= e(lang('email_notifications')) ?>">
                    <span class="settings-nav-icon backend-sidebar-icon">
                        <i data-lucide="mail" class="backend-sidebar-icon" aria-hidden="true"></i>
                    </span>
                    <span class="settings-nav-label backend-sidebar-label text-truncate">
                        <?= lang('email_notifications') ?>
                    </span>
                </a>
            </div>
            <div>
                <a class="settings-nav-item-link backend-sidebar-link <?= $active_route === 'service_area_settings' ? 'active' : '' ?>"
                   href="<?= site_url('service_area_settings') ?>"
                   title="<?= e(lang('service_area_settings')) ?>">
                    <span class="settings-nav-icon backend-sidebar-icon">
                        <i data-lucide="map" class="backend-sidebar-icon" aria-hidden="true"></i>
                    </span>
                    <span class="settings-nav-label backend-sidebar-label text-truncate">
                        <?= lang('service_area_settings') ?>
                    </span>
                </a>
            </div>
            <div>
                <a class="settings-nav-item-link backend-sidebar-link <?= $active_route === 'customer_profiles_settings' ? 'active' : '' ?>"
                   href="<?= site_url('customer_profiles_settings') ?>"
                   title="<?= e(lang('customer_profiles_settings')) ?>">
                    <span class="settings-nav-icon backend-sidebar-icon">
                        <i data-lucide="id-card" class="backend-sidebar-icon" aria-hidden="true"></i>
                    </span>
                    <span class="settings-nav-label backend-sidebar-label text-truncate"><?= lang('customer_profiles_settings') ?></span>
                </a>
            </div>
            <div>
                <a class="settings-nav-item-link backend-sidebar-link <?= $active_route === 'business_settings' ? 'active' : '' ?>"
                   href="<?= site_url('business_settings') ?>"
                   title="<?= e(lang('business_logic')) ?>">
                    <span class="settings-nav-icon backend-sidebar-icon">
                        <i data-lucide="briefcase" class="backend-sidebar-icon" aria-hidden="true"></i>
                    </span>
                    <span class="settings-nav-label backend-sidebar-label text-truncate"><?= lang('business_logic') ?></span>
                </a>
            </div>
            <div>
                <a class="settings-nav-item-link backend-sidebar-link <?= $active_route === 'legal_settings' ? 'active' : '' ?>"
                   href="<?= site_url('legal_settings') ?>"
                   title="<?= e(lang('legal_contents')) ?>">
                    <span class="settings-nav-icon backend-sidebar-icon">
                        <i data-lucide="scale" class="backend-sidebar-icon" aria-hidden="true"></i>
                    </span>
                    <span class="settings-nav-label backend-sidebar-label text-truncate"><?= lang('legal_contents') ?></span>
                </a>
            </div>
            <div>
                <a class="settings-nav-item-link backend-sidebar-link <?= $active_route === 'forms_settings' ? 'active' : '' ?>"
                   href="<?= site_url('forms_settings') ?>"
                   title="Forms">
                    <span class="settings-nav-icon backend-sidebar-icon">
                        <i data-lucide="clipboard-list" class="backend-sidebar-icon" aria-hidden="true"></i>
                    </span>
                    <span class="settings-nav-label backend-sidebar-label text-truncate">Forms</span>
                </a>
            </div>
            <div>
                <a class="settings-nav-item-link backend-sidebar-link <?= $active_route === 'customer_login_settings' ? 'active' : '' ?>"
                   href="<?= site_url('customer_login_settings') ?>"
                   title="<?= e(lang('customer_login_settings')) ?>">
                    <span class="settings-nav-icon backend-sidebar-icon">
                        <i data-lucide="log-in" class="backend-sidebar-icon" aria-hidden="true"></i>
                    </span>
                    <span class="settings-nav-label backend-sidebar-label text-truncate"><?= lang('customer_login_settings') ?></span>
                </a>
            </div>
            <div class="settings-nav-divider my-2 border-top opacity-50"></div>
            <div>
                <a class="settings-nav-item-link backend-sidebar-link <?= $active_route === 'integrations' ? 'active' : '' ?>"
                   href="<?= site_url('integrations') ?>"
                   title="<?= e(lang('integrations')) ?>">
                    <span class="settings-nav-icon backend-sidebar-icon">
                        <i data-lucide="puzzle" class="backend-sidebar-icon" aria-hidden="true"></i>
                    </span>
                    <span class="settings-nav-label backend-sidebar-label text-truncate"><?= lang('integrations') ?></span>
                </a>
            </div>
            <div>
                <a class="settings-nav-item-link backend-sidebar-link <?= $active_route === 'stripe_settings' ? 'active' : '' ?>"
                   href="<?= site_url('stripe_settings') ?>"
                   title="Stripe">
                    <span class="settings-nav-icon backend-sidebar-icon">
                        <i data-lucide="credit-card" class="backend-sidebar-icon" aria-hidden="true"></i>
                    </span>
                    <span class="settings-nav-label backend-sidebar-label text-truncate">Stripe</span>
                </a>
            </div>
            <div class="settings-nav-divider my-2 border-top opacity-50"></div>
            <div>
                <a class="settings-nav-item-link backend-sidebar-link <?= $active_route === 'components' ? 'active' : '' ?>"
                   href="<?= site_url('components') ?>"
                   title="Components">
                    <span class="settings-nav-icon backend-sidebar-icon">
                        <i data-lucide="layout-grid" class="backend-sidebar-icon" aria-hidden="true"></i>
                    </span>
                    <span class="settings-nav-label backend-sidebar-label text-truncate">Components</span>
                </a>
            </div>
            <div>
                <a class="settings-nav-item-link backend-sidebar-link <?= $active_route === 'about' ? 'active' : '' ?>"
                   href="<?= site_url('about') ?>"
                   title="<?= e(lang('about')) ?>">
                    <span class="settings-nav-icon backend-sidebar-icon">
                        <i data-lucide="info" class="backend-sidebar-icon" aria-hidden="true"></i>
                    </span>
                    <span class="settings-nav-label backend-sidebar-label text-truncate"><?= lang('about') ?></span>
                </a>
            </div>
        </nav>
    </div>
</div>
