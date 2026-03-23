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
 * Account forms page.
 *
 * Displays assigned forms and completion status.
 */
App.Pages.AccountForms = (function () {
    const $formsBody = $('#account-forms-body');

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
                    $('<td/>', {
                        class: 'px-4 py-3 text-slate-900',
                        html: $('<span/>', { class: 'inline-flex items-center gap-2' }).append(
                            $('<i/>', { class: 'me-2 inline-block size-4 shrink-0 text-slate-500', 'data-lucide': 'file-text' }),
                            document.createTextNode(form.name)
                        ),
                    }),
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
                            href: App.Utils.Url.siteUrl(`account/forms/${form.id}`),
                            text: 'View',
                        }),
                    }),
                ],
            });

            $formsBody.append($row);
        });

        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    function initialize() {
        App.Http.Forms.listForUser()
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
