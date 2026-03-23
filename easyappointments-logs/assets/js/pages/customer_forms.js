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
 * Customer forms page.
 */
App.Pages.CustomerForms = (function () {
    const $formsBody = $('#customer-forms-body');

    function renderEmpty() {
        $formsBody.empty();
        $('<tr/>', {
            'html': $('<td/>', {
                'class': 'px-4 py-6 text-center text-slate-500',
                'colspan': 3,
                'text': 'No forms assigned.',
            }),
        }).appendTo($formsBody);
    }

    function renderList(forms) {
        $formsBody.empty();

        if (!forms.length) {
            renderEmpty();
            return;
        }

        forms.forEach((form) => {
            const status = form.status === 'complete' ? 'Complete' : 'Not Complete';
            const badgeClass =
                form.status === 'complete'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700';

            const $row = $('<tr/>', {
                'html': [
                    $('<td/>', { class: 'px-4 py-3 text-slate-900', text: form.name }),
                    $('<td/>', {
                        class: 'px-4 py-3',
                        html: $('<span/>', {
                            class: `inline-flex rounded-full px-3 py-1 text-xs font-medium ${badgeClass}`,
                            text: status,
                        }),
                    }),
                    $('<td/>', {
                        class: 'px-4 py-3 text-right',
                        html: $('<a/>', {
                            class: 'btn btn-outline-secondary btn-sm',
                            href: App.Utils.Url.siteUrl(`customer/forms/${form.slug || form.id}`),
                            text: 'View',
                        }),
                    }),
                ],
            });

            $formsBody.append($row);
        });
    }

    function initialize() {
        App.Http.CustomerForms.list()
            .done((forms) => {
                renderList(Array.isArray(forms) ? forms : []);
            })
            .fail(() => {
                renderEmpty();
                App.Layouts.Backend.displayNotification(lang('unexpected_issues'));
            });
    }

    document.addEventListener('DOMContentLoaded', initialize);

    return {};
})();
