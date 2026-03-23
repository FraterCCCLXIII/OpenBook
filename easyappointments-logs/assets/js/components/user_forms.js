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
 * User forms component.
 *
 * Renders assigned forms list for a specific user record.
 */
App.Components.UserForms = (function () {
    function renderEmpty($tbody) {
        $tbody.empty();
        $('<tr/>', {
            'html': $('<td/>', {
                'class': 'px-4 py-6 text-center text-slate-500',
                'colspan': 3,
                'text': 'No forms assigned.',
            }),
        }).appendTo($tbody);
    }

    function renderList($tbody, forms, options) {
        $tbody.empty();

        if (!forms.length) {
            renderEmpty($tbody);
            return;
        }

        forms.forEach((form) => {
            const status = form.status === 'complete' ? 'Complete' : 'Not Complete';
            const badgeClass =
                form.status === 'complete'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700';

            const $actions = $('<div/>', {
                class: 'd-inline-flex align-items-center justify-content-end gap-2',
            });

            $('<a/>', {
                class: 'btn btn-outline-secondary btn-sm',
                href: App.Utils.Url.siteUrl(`forms/user/${options.userType}/${options.userId}/${form.id}`),
                text: 'View',
            }).appendTo($actions);

            if (options.canReset && form.status === 'complete') {
                $('<button/>', {
                    type: 'button',
                    class: 'btn btn-outline-danger btn-sm user-forms-reset',
                    'data-form-id': form.id,
                    text: 'Reset',
                }).appendTo($actions);
            }

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
                    $('<td/>', { class: 'px-4 py-3 text-right', html: $actions }),
                ],
            });

            $tbody.append($row);
        });
    }

    function create($panel, options) {
        const $tbody = $panel.find('.user-forms-body');
        const $reminder = $panel.find('.user-forms-reminder');
        const canReset = options.canReset;
        const canRemind = options.canRemind !== false;
        const isCustomer = options.userType === 'customer';

        function reset() {
            renderEmpty($tbody);
            if ($reminder.length) {
                $reminder.prop('disabled', true);
            }
        }

        function refresh() {
            const userId = options.getUserId();
            if (!userId) {
                reset();
                return;
            }

            if ($reminder.length) {
                $reminder.prop('disabled', !(canRemind && isCustomer));
            }

            App.Http.Forms.listForRecord(userId, options.userType)
                .done((forms) => {
                    renderList($tbody, Array.isArray(forms) ? forms : [], {
                        userType: options.userType,
                        userId,
                        canReset,
                    });
                })
                .fail(() => {
                    renderEmpty($tbody);
                    App.Layouts.Backend.displayNotification(lang('unexpected_issues'));
                });
        }

        $panel.on('click', '.user-forms-reminder', () => {
            const userId = options.getUserId();
            if (!userId || !isCustomer || !canRemind) {
                return;
            }

            if (!window.confirm('Send a profile completion reminder to this customer?')) {
                return;
            }

            if (!App?.Http?.Forms?.sendReminder) {
                App.Layouts.Backend.displayNotification('Reminder service is unavailable.');
                return;
            }

            App.Layouts.Backend.displayNotification('Sending reminder...');

            App.Http.Forms.sendReminder(userId, options.userType)
                .done(() => {
                    App.Layouts.Backend.displayNotification('Reminder sent.');
                })
                .fail((xhr) => {
                    App.Layouts.Backend.displayNotification(
                        xhr.responseJSON?.message || 'Failed to send reminder.',
                    );
                });
        });

        $panel.on('click', '.user-forms-reset', (event) => {
            const formId = Number($(event.currentTarget).data('form-id'));
            const userId = options.getUserId();

            if (!formId || !userId) {
                return;
            }

            if (!window.confirm('Reset this form submission?')) {
                return;
            }

            App.Http.Forms.resetSubmission(formId, userId, options.userType)
                .done(() => refresh())
                .fail((xhr) => {
                    App.Layouts.Backend.displayNotification(
                        xhr.responseJSON?.message || 'Failed to reset form.',
                    );
                });
        });

        return {
            refresh,
            reset,
        };
    }

    return {
        create,
    };
})();
