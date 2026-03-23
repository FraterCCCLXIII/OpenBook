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
 * Booking layout.
 *
 * This module implements the booking layout functionality.
 */
window.App.Layouts.Booking = (function () {
    const $selectLanguage = $('#select-language');

    /**
     * Initialize the module.
     */
    function initialize() {
        $(document).on('change', '#select-language', function () {
            const language = $(this).val();
            App.Http.Localization.changeLanguage(language).done(() => document.location.reload());
        });

        $(document).on('click', '[data-dropdown-toggle]', function (event) {
            event.preventDefault();
            event.stopPropagation();

            const $button = $(this);
            const dropdownId = $button.data('dropdown-toggle');
            const $menu = $('#' + dropdownId);
            const isOpen = $menu.length && !$menu.hasClass('hidden');

            $('[data-dropdown-toggle]').attr('aria-expanded', 'false');
            $('.booking-dropdown').addClass('hidden');

            if ($menu.length) {
                if (!isOpen) {
                    $menu.removeClass('hidden');
                    $button.attr('aria-expanded', 'true');
                }
            }
        });

        $(document).on('click', function (event) {
            if (!$(event.target).closest('[data-dropdown-toggle], .booking-dropdown').length) {
                $('[data-dropdown-toggle]').attr('aria-expanded', 'false');
                $('.booking-dropdown').addClass('hidden');
            }
        });

        const openModal = (modalId) => {
            const $modal = $('#' + modalId);
            if ($modal.length) {
                $modal.attr('aria-hidden', 'false');
            }
        };

        const closeModal = (modalId) => {
            const $modal = $('#' + modalId);
            if ($modal.length) {
                $modal.attr('aria-hidden', 'true');
            }
        };

        $(document).on('click', '[data-modal-open]', function (event) {
            event.preventDefault();
            openModal($(this).data('modal-open'));
        });

        $(document).on('click', '[data-modal-close]', function (event) {
            event.preventDefault();
            closeModal($(this).data('modal-close'));
        });

        $(document).on('click', '.booking-modal', function (event) {
            if (event.target === this) {
                closeModal($(this).attr('id'));
            }
        });

        $(document).on('keydown', function (event) {
            if (event.key === 'Escape') {
                $('[data-dropdown-toggle]').attr('aria-expanded', 'false');
                $('.booking-dropdown').addClass('hidden');
                $('.booking-modal[aria-hidden="false"]').each((index, modal) => {
                    closeModal($(modal).attr('id'));
                });
            }
        });

        $(document).on('click', '[data-bs-toggle="pill"]', function (event) {
            event.preventDefault();

            const $tabButton = $(this);
            const targetSelector = $tabButton.attr('data-bs-target');

            if (!targetSelector) {
                return;
            }

            const $targetPane = $(targetSelector);
            if (!$targetPane.length) {
                return;
            }

            const $tabList = $tabButton.closest('[role="tablist"]');
            const $tabContent = $targetPane.closest('.tab-content');

            if ($tabList.length) {
                $tabList
                    .find('[data-bs-toggle="pill"]')
                    .removeClass('active')
                    .attr('aria-selected', 'false');
            }

            $tabButton.addClass('active').attr('aria-selected', 'true');

            if ($tabContent.length) {
                $tabContent.find('.tab-pane').removeClass('show active');
            }

            $targetPane.addClass('show active');
        });
    }

    document.addEventListener('DOMContentLoaded', initialize);

    return {};
})();
