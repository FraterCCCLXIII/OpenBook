/* ----------------------------------------------------------------------------
 * Easy!Appointments - Online Appointment Scheduler
 *
 * @package     EasyAppointments
 * @author      A.Tselegidis <alextselegidis@gmail.com>
 * @copyright   Copyright (c) Alex Tselegidis
 * @license     https://opensource.org/licenses/GPL-3.0 - GPLv3
 * @link        https://easyappointments.org
 * @since       v1.5.0
 * ---------------------------------------------------------------------------- */

/**
 * Backend layout.
 *
 * This module implements the backend layout functionality.
 */
window.App.Layouts.Backend = (function () {
    const $selectLanguage = $('#select-language');
    const $notification = $('#notification');
    const $loading = $('#loading');
    const $footer = $('#footer');

    const DB_SLUG_ADMIN = 'admin';
    const DB_SLUG_PROVIDER = 'provider';
    const DB_SLUG_SECRETARY = 'secretary';
    const DB_SLUG_CUSTOMER = 'customer';

    const PRIV_VIEW = 1;
    const PRIV_ADD = 2;
    const PRIV_EDIT = 4;
    const PRIV_DELETE = 8;

    const PRIV_APPOINTMENTS = 'appointments';
    const PRIV_CUSTOMERS = 'customers';
    const PRIV_SERVICES = 'services';
    const PRIV_USERS = 'users';
    const PRIV_SYSTEM_SETTINGS = 'system_settings';
    const PRIV_USER_SETTINGS = 'user_settings';

    /**
     * Display backend notifications to user.
     *
     * Using this method you can display notifications to the use with custom messages. If the 'actions' array is
     * provided then an action link will be displayed too.
     *
     * @param {String} message Notification message
     * @param {Array} [actions] An array with custom actions that will be available to the user. Every array item is an
     * object that contains the 'label' and 'function' key values.
     */
    function displayNotification(message, actions = []) {
        if (!message) {
            return;
        }

        const $toast = $(`
            <div class="toast fixed bottom-0 end-0 m-4 flex w-full max-w-sm items-center gap-2 rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-slate-900/90 p-2 shadow-lg show backend-notification" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-body w-100 text-white">
                    ${message}
                </div>
                <button type="button" class="btn-close me-2 text-white/70 hover:text-white" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        `).appendTo('body');

        actions.forEach(function (action) {
            $('<button/>', {
                class: 'btn btn-light btn-sm ms-2',
                text: action.label,
                on: {
                    click: action.function,
                },
            }).prependTo($toast);
        });

        const toast = new bootstrap.Toast($toast[0]);
        toast.show();

        setTimeout(() => {
            toast.dispose();
            $toast.remove();
        }, 5000);
    }

    /**
     * Initialize the module.
     */
    let sidebarTooltipInstances = [];

    function destroyTooltips(instances) {
        if (!instances || !instances.length) {
            return;
        }
        instances.forEach((instance) => {
            if (instance && typeof instance.destroy === 'function') {
                instance.destroy();
            }
        });
        instances.length = 0;
    }

    function initGlobalTooltips() {
        if (!window.tippy) {
            return;
        }

        const selector = '[data-tippy-content]:not(.backend-sidebar [data-tippy-content])';
        window.tippy(selector);
    }

    function syncSidebarTooltips() {
        if (!window.tippy) {
            return;
        }

        destroyTooltips(sidebarTooltipInstances);

        const isCollapsed = document.body.classList.contains('backend-sidebar-collapsed');
        if (!isCollapsed) {
            return;
        }

        const sidebarItems = document.querySelectorAll('.backend-sidebar [data-tippy-content]');
        if (!sidebarItems.length) {
            return;
        }

        sidebarTooltipInstances = window.tippy(sidebarItems, {
            placement: 'right',
            allowHTML: false,
        });
    }

    function enableResponsiveTables() {
        const tables = document.querySelectorAll('.backend-page table.table');

        tables.forEach((table) => {
            if (table.closest('.table-responsive')) {
                return;
            }

            const wrapper = document.createElement('div');
            wrapper.className = 'table-responsive';

            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        });
    }

    function isElementVisible(element) {
        if (!element) {
            return false;
        }

        const style = window.getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden';
    }

    function getSiblingRecordDetails(filterPanel) {
        if (!filterPanel || !filterPanel.parentElement) {
            return null;
        }

        return filterPanel.parentElement.querySelector('.record-details');
    }

    function setMobileRecordView(layoutRow, view) {
        if (!layoutRow) {
            return;
        }

        layoutRow.classList.toggle('backend-mobile-record-show-detail', view === 'detail');
    }

    function isMobileViewport() {
        return window.matchMedia('(max-width: 1320px)').matches;
    }

    function ensureMobileBackButton(recordDetails, layoutRow) {
        if (!recordDetails || !layoutRow) {
            return null;
        }

        let backContainer = recordDetails.querySelector('.backend-mobile-record-back');
        if (backContainer) {
            return backContainer.querySelector('[data-backend-mobile-record-back]');
        }

        backContainer = document.createElement('div');
        backContainer.className = 'backend-mobile-record-back';

        const backButton = document.createElement('button');
        backButton.type = 'button';
        backButton.className = 'btn btn-outline-secondary btn-sm';
        backButton.setAttribute('data-backend-mobile-record-back', '');
        backButton.setAttribute('aria-label', 'Back to list');
        backButton.innerHTML = `
            <i class="fas fa-arrow-left me-2" aria-hidden="true"></i>
            <span>${typeof lang === 'function' ? lang('back') : 'Back'}</span>
        `;

        backButton.addEventListener('click', () => {
            layoutRow.dataset.mobileRecordOpened = 'false';
            setMobileRecordView(layoutRow, 'list');
        });

        backContainer.appendChild(backButton);
        recordDetails.insertBefore(backContainer, recordDetails.firstChild);

        return backButton;
    }

    function enableMobileRecordNavigation() {
        const filterPanels = document.querySelectorAll('.backend-page .filter-records');

        filterPanels.forEach((filterPanel) => {
            const layoutRow = filterPanel.parentElement;
            const recordDetails = getSiblingRecordDetails(filterPanel);

            if (!layoutRow || !recordDetails) {
                return;
            }

            layoutRow.classList.add('backend-mobile-record-layout');
            layoutRow.dataset.mobileRecordOpened = 'false';
            ensureMobileBackButton(recordDetails, layoutRow);

            filterPanel.addEventListener('click', (event) => {
                const clickedEntry = event.target.closest('.entry');
                const clickedAdd = event.target.closest('button[id^="add-"], a[id^="add-"]');

                if (clickedEntry || clickedAdd) {
                    layoutRow.dataset.mobileRecordOpened = 'true';
                    setMobileRecordView(layoutRow, 'detail');
                }
            });

            const detailsObserver = new MutationObserver(() => {
                if (!isMobileViewport()) {
                    return;
                }

                if (!isElementVisible(recordDetails)) {
                    layoutRow.dataset.mobileRecordOpened = 'false';
                    setMobileRecordView(layoutRow, 'list');
                    return;
                }

                if (layoutRow.dataset.mobileRecordOpened === 'true') {
                    setMobileRecordView(layoutRow, 'detail');
                } else {
                    setMobileRecordView(layoutRow, 'list');
                }
            });

            detailsObserver.observe(recordDetails, {
                attributes: true,
                attributeFilter: ['style', 'class'],
            });

            if (isMobileViewport()) {
                setMobileRecordView(layoutRow, 'list');
            }
        });
    }

    function initialize() {
        $(document).ajaxStart(() => {
            $loading.show();
        });

        $(document).ajaxStop(() => {
            $loading.hide();
        });

        initGlobalTooltips();
        syncSidebarTooltips();
        enableResponsiveTables();
        enableMobileRecordNavigation();

        App.Utils.Lang.enableLanguageSelection($selectLanguage);

    }

    document.addEventListener('DOMContentLoaded', initialize);

    return {
        DB_SLUG_ADMIN,
        DB_SLUG_PROVIDER,
        DB_SLUG_SECRETARY,
        DB_SLUG_CUSTOMER,
        PRIV_VIEW,
        PRIV_ADD,
        PRIV_EDIT,
        PRIV_DELETE,
        PRIV_APPOINTMENTS,
        PRIV_CUSTOMERS,
        PRIV_SERVICES,
        PRIV_USERS,
        PRIV_SYSTEM_SETTINGS,
        PRIV_USER_SETTINGS,
        displayNotification,
        syncSidebarTooltips,
    };
})();
