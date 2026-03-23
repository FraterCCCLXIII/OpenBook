<!doctype html>
<html lang="<?= config('language_code') ?>">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
    <meta name="theme-color" content="#35A768">
    <meta name="google" content="notranslate">

    <?php slot('meta'); ?>

    <title><?= vars('page_title') ?? lang('backend_section') ?> | Easy!Appointments</title>

    <script>
        (function () {
            const storageKey = 'ea_backend_sidebar_collapsed';
            try {
                if (window.localStorage.getItem(storageKey) === 'true') {
                    document.documentElement.classList.add('backend-sidebar-collapsed');
                    document.body?.classList.add('backend-sidebar-collapsed');
                }
            } catch (error) {
                // Storage unavailable, keep default.
            }
        })();
    </script>

    <link rel="icon" type="image/svg+xml" href="<?= asset_url('assets/img/favicon.svg') ?>">
    <link rel="icon" sizes="192x192" href="<?= asset_url('assets/img/logo.png') ?>">

    <link rel="stylesheet" type="text/css" href="<?= asset_url('assets/vendor/trumbowyg/trumbowyg.min.css') ?>">
    <link rel="stylesheet" type="text/css" href="<?= asset_url('assets/vendor/select2/select2.min.css') ?>">
    <link rel="stylesheet" type="text/css" href="<?= asset_url('assets/vendor/flatpickr/flatpickr.min.css') ?>">
    <link rel="stylesheet" type="text/css" href="<?= asset_url('assets/vendor/flatpickr/material_green.min.css') ?>">
    <link rel="stylesheet" type="text/css"
          href="<?= asset_url('assets/css/themes/' . setting('theme', 'default') . '.css') ?>">
    <link rel="stylesheet" type="text/css" href="<?= asset_url('assets/css/general.css') ?>">
    <link rel="stylesheet" type="text/css" href="<?= asset_url('assets/css/components/scrollbars.css') ?>">
    <link rel="stylesheet" type="text/css" href="<?= asset_url('assets/css/tailwind/booking.css') ?>">
    <link rel="stylesheet" type="text/css" href="<?= asset_url('assets/css/layouts/backend_layout.css') ?>">
    <link rel="stylesheet" type="text/css" href="<?= asset_url('assets/css/components/backend_list.css') ?>">
    <link rel="stylesheet" type="text/css" href="<?= asset_url('assets/css/components/backend_sidebar.css') ?>">
    <style>
        body .modal .btn-close::before {
            content: none;
        }
    </style>

    <?php component('company_color_style', ['company_color' => setting('company_color')]); ?>

    <?php slot('styles'); ?>
</head>
<body class="min-h-screen bg-slate-50 text-slate-900">

<div class="backend-shell">
    <?php component('backend_sidebar', ['active_menu' => vars('active_menu')]); ?>

    <main class="backend-shell-content">
        <?php
        $hide_page_title = in_array(vars('active_menu'), [
            PRIV_APPOINTMENTS,
            PRIV_USERS,
            PRIV_SERVICES,
            PRIV_CUSTOMERS,
            PRIV_WEBHOOKS,
            PRIV_BLOCKED_PERIODS,
            'billing',
            'logs',
        ], true);
        ?>
        <?php if (vars('active_menu') !== PRIV_SYSTEM_SETTINGS && !$hide_page_title): ?>
            <div class="backend-page-header"
                 style="height: 60px; display: flex; align-items: center; background: #fff; border-bottom: 1px solid var(--bs-border-color, #e2e8f0);">
                <div class="mx-auto w-full px-4">
                    <h2 class="backend-page-title">
                        <?= e(vars('page_title') ?? lang('backend_section')) ?>
                    </h2>
                </div>
            </div>
        <?php endif; ?>
        <?php
        $is_fullbleed_content = in_array(vars('active_menu'), [
            PRIV_CUSTOMERS,
            PRIV_USERS,
            PRIV_SERVICES,
        ], true);
        $content_wrapper_classes = $is_fullbleed_content
            ? 'mx-auto w-full px-0 py-0 backend-content-fullbleed'
            : 'mx-auto w-full px-4 py-6';
        ?>
        <div class="<?= e($content_wrapper_classes) ?>">
            <?php slot('content'); ?>
        </div>
    </main>
</div>

<div id="notification" style="display: none;"></div>

<div id="loading" style="display: none;">
    <div class="any-element animation is-loading">
        &nbsp;
    </div>
</div>

<script src="<?= asset_url('assets/vendor/jquery/jquery.min.js') ?>"></script>
<script src="<?= asset_url('assets/vendor/moment/moment.min.js') ?>"></script>
<script src="<?= asset_url('assets/vendor/moment-timezone/moment-timezone-with-data.min.js') ?>"></script>
<script src="<?= asset_url('assets/vendor/@fortawesome-fontawesome-free/fontawesome.min.js') ?>"></script>
<script src="<?= asset_url('assets/vendor/@fortawesome-fontawesome-free/solid.min.js') ?>"></script>
<script src="<?= asset_url('assets/vendor/lucide/lucide.min.js') ?>"></script>
<script src="<?= asset_url('assets/vendor/@popperjs-core/popper.min.js') ?>"></script>
<script src="<?= asset_url('assets/vendor/tippy.js/tippy-bundle.umd.min.js') ?>"></script>
<script src="<?= asset_url('assets/vendor/trumbowyg/trumbowyg.min.js') ?>"></script>
<script src="<?= asset_url('assets/vendor/select2/select2.min.js') ?>"></script>
<script src="<?= asset_url('assets/vendor/flatpickr/flatpickr.min.js') ?>"></script>

<script src="<?= asset_url('assets/js/app.js') ?>"></script>
<script src="<?= asset_url('assets/js/utils/date.js') ?>"></script>
<script src="<?= asset_url('assets/js/utils/file.js') ?>"></script>
<script src="<?= asset_url('assets/js/utils/http.js') ?>"></script>
<script src="<?= asset_url('assets/js/utils/lang.js') ?>"></script>
<script src="<?= asset_url('assets/js/utils/bootstrap_replacements.js') ?>"></script>
<script src="<?= asset_url('assets/js/utils/popover_fix.js') ?>"></script>
<script src="<?= asset_url('assets/js/utils/ui.js') ?>"></script>
<script src="<?= asset_url('assets/js/utils/message.js') ?>"></script>
<script src="<?= asset_url('assets/js/utils/string.js') ?>"></script>
<script src="<?= asset_url('assets/js/utils/url.js') ?>"></script>
<script src="<?= asset_url('assets/js/utils/validation.js') ?>"></script>
<script src="<?= asset_url('assets/js/layouts/backend_layout.js') ?>"></script>
<script src="<?= asset_url('assets/js/http/calendar_http_client.js') ?>"></script>
<script src="<?= asset_url('assets/js/http/localization_http_client.js') ?>"></script>

<?php component('js_vars_script'); ?>
<?php component('js_lang_script'); ?>

<?php slot('scripts'); ?>

<script>
    document.addEventListener('DOMContentLoaded', () => {
        if (window.lucide) {
            window.lucide.createIcons();
        }

        const storageKey = 'ea_backend_sidebar_collapsed';
        const toggleButtons = document.querySelectorAll('[data-sidebar-toggle]');

        if (!toggleButtons.length) {
            return;
        }

        const updateSidebarTooltips = () => {
            if (window.App?.Layouts?.Backend?.syncSidebarTooltips) {
                window.App.Layouts.Backend.syncSidebarTooltips();
            }
        };

        const setSidebarCollapsed = (isCollapsed) => {
            document.documentElement.classList.toggle('backend-sidebar-collapsed', isCollapsed);
            document.body.classList.toggle('backend-sidebar-collapsed', isCollapsed);
            toggleButtons.forEach((button) => {
                button.setAttribute('aria-expanded', (!isCollapsed).toString());
            });
            updateSidebarTooltips();
        };

        let storedCollapsed = false;

        try {
            storedCollapsed = window.localStorage.getItem(storageKey) === 'true';
        } catch (error) {
            storedCollapsed = false;
        }

        setSidebarCollapsed(storedCollapsed);

        toggleButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const isCollapsed = !document.body.classList.contains('backend-sidebar-collapsed');
                setSidebarCollapsed(isCollapsed);

                try {
                    window.localStorage.setItem(storageKey, isCollapsed.toString());
                } catch (error) {
                    // Storage unavailable, still toggle.
                }
            });
        });

        document.querySelectorAll('[data-sidebar-expand]').forEach((button) => {
            button.addEventListener('click', (event) => {
                if (!document.body.classList.contains('backend-sidebar-collapsed')) {
                    return;
                }

                event.preventDefault();
                setSidebarCollapsed(false);

                try {
                    window.localStorage.setItem(storageKey, 'false');
                } catch (error) {
                    // Storage unavailable, still toggle.
                }
            });
        });

        const mobileQuery = window.matchMedia('(max-width: 1024px)');
        let mobileNavReady = false;
        const applyMobileNav = (isMobile, shouldAnimate) => {
            document.documentElement.classList.toggle('backend-sidebar-mobile-nav', isMobile);
            document.body.classList.toggle('backend-sidebar-mobile-nav', isMobile);

            if (isMobile) {
                setSidebarCollapsed(false);
            } else {
                setSidebarCollapsed(storedCollapsed);
            }

            if (shouldAnimate && !mobileNavReady) {
                document.documentElement.classList.add('backend-sidebar-mobile-nav-ready');
                document.body.classList.add('backend-sidebar-mobile-nav-ready');
                mobileNavReady = true;
            }
            updateSidebarTooltips();
        };

        applyMobileNav(mobileQuery.matches, false);
        const handleMobileChange = (event) => applyMobileNav(event.matches, true);
        if (mobileQuery.addEventListener) {
            mobileQuery.addEventListener('change', handleMobileChange);
        } else {
            mobileQuery.addListener(handleMobileChange);
        }
    });
</script>

</body>
</html>
