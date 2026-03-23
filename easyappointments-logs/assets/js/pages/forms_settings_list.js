/* ----------------------------------------------------------------------------
 * Easy!Appointments - Online Appointment Scheduler
 *
 * @package     Easy!Appointments
 * @author      A.Tselegidis <alextselegidis@gmail.com>
 * @copyright   Copyright (c) Alex Tselegidis
 * @license     https://opensource.org/licenses/GPL-3.0 - GPLv3
 * @link        https://easyappointments.org
 * @since       v1.5.0
 * ---------------------------------------------------------------------------- */

/**
 * Forms settings list page.
 */
App.Pages.FormsSettingsList = (function () {
    const $formsList = $('#forms-list');
    const $formsSearch = $('#forms-search');

    let forms = [];

    function renderFormsList(list) {
        $formsList.empty();

        if (!list.length) {
            $formsList.append(
                $('<div/>', { class: 'text-sm text-slate-500', text: 'No forms yet.' }),
            );
            return;
        }

        list.forEach((form) => {
            let lastEditedText = 'Last edited —';

            if (form.update_datetime) {
                try {
                    const formatted = App.Utils.Date.format(
                        form.update_datetime,
                        vars('date_format'),
                        vars('time_format'),
                        false,
                    );
                    lastEditedText = `Last edited ${formatted}`;
                } catch (error) {
                    lastEditedText = 'Last edited —';
                }
            }

            const $meta = $('<div/>', {
                class: 'd-flex flex-column min-w-0',
                html: [
                    $('<span/>', { class: 'forms-list-title text-truncate', text: form.name }),
                    $('<span/>', { class: 'forms-list-date text-truncate', text: lastEditedText }),
                ],
            });
            const $icon = $('<span/>', {
                class: 'forms-list-icon',
                html: $('<i/>', { 'data-lucide': 'file-text', 'aria-hidden': 'true' }),
            });
            const $left = $('<div/>', {
                class: 'd-flex align-items-center gap-2 min-w-0',
                html: [$icon, $meta],
            });
            const $link = $('<a/>', {
                class: 'forms-list-link',
                href: App.Utils.Url.siteUrl(`forms_settings/view/${form.id}`),
                'aria-label': 'View form',
                html: $('<i/>', { 'data-lucide': 'chevron-right', 'aria-hidden': 'true' }),
            });
            const $itemContent = $('<div/>', {
                class: 'd-flex align-items-center justify-content-between gap-2',
                html: [$left, $link],
            });

            $formsList.append(
                $('<a/>', {
                    class: 'forms-list-item',
                    href: App.Utils.Url.siteUrl(`forms_settings/view/${form.id}`),
                    'aria-label': `Open form ${form.name}`,
                    html: $itemContent,
                }),
            );
        });

        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    function onSearch() {
        const term = $formsSearch.val().toLowerCase();
        const filtered = forms.filter((form) => form.name.toLowerCase().includes(term));
        renderFormsList(filtered);
    }

    function loadForms() {
        App.Http.Forms.list().done((response) => {
            forms = Array.isArray(response) ? response : [];
            renderFormsList(forms);
        });
    }

    function initialize() {
        loadForms();
        $formsSearch.on('input', onSearch);
    }

    document.addEventListener('DOMContentLoaded', initialize);

    return {};
})();
