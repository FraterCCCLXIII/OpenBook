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
 * Forms user view page.
 */
App.Pages.FormsUserView = (function () {
    const $title = $('#forms-user-title');
    const $content = $('#forms-user-content');
    const $fields = $('#forms-user-fields');
    const $status = $('#forms-user-status');
    const $message = $('#forms-user-message');
    const $reset = $('#forms-user-reset');
    const $reminder = $('#forms-user-reminder');

    let currentForm = null;

    function showMessage(text, type = 'danger') {
        $message.removeClass('d-none').removeClass('alert-danger alert-success');
        $message.addClass(`alert-${type}`).text(text);
    }

    function resetMessage() {
        $message.addClass('d-none').removeClass('alert-danger alert-success').text('');
    }

    function normalizeFieldType(fieldType) {
        const normalized = String(fieldType || '').toLowerCase();
        return ['input', 'text', 'dropdown', 'radio', 'checkboxes', 'date'].includes(normalized)
            ? normalized
            : 'input';
    }

    function normalizeOptions(options) {
        if (Array.isArray(options)) {
            return options.map((option) => String(option).trim()).filter(Boolean);
        }
        if (typeof options === 'string') {
            try {
                const decoded = JSON.parse(options);
                if (Array.isArray(decoded)) {
                    return decoded.map((option) => String(option).trim()).filter(Boolean);
                }
            } catch (error) {
                return options
                    .split(/\r?\n/)
                    .map((option) => option.trim())
                    .filter(Boolean);
            }
        }
        return [];
    }

    function parseMultiValue(value) {
        if (Array.isArray(value)) {
            return value.map((item) => String(item));
        }
        if (typeof value === 'string' && value) {
            try {
                const decoded = JSON.parse(value);
                if (Array.isArray(decoded)) {
                    return decoded.map((item) => String(item));
                }
            } catch (error) {
                return [value];
            }
        }
        return [];
    }

    function renderTextBlock(field) {
        return $('<div/>', {
            class: 'rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-slate-50/60 p-3 text-sm text-slate-600',
            html: field.label || '',
        });
    }

    function renderField(field, value = '') {
        const fieldType = normalizeFieldType(field.field_type);
        if (fieldType === 'text') {
            return renderTextBlock(field);
        }
        const $wrapper = $('<div/>', { class: 'form-field' });
        const $label = $('<label/>', { class: 'form-label', text: field.label });
        const options = normalizeOptions(field.options);
        let $input;

        if (fieldType === 'dropdown') {
            $input = $('<select/>', { class: 'form-select', disabled: true });
            $input.append($('<option/>', { value: '', text: '' }));
            options.forEach((option) => {
                $input.append($('<option/>', { value: option, text: option }));
            });
            $input.val(value);
        } else if (fieldType === 'radio') {
            $input = $('<div/>', { class: 'd-flex flex-column gap-2' });
            options.forEach((option, index) => {
                const optionId = `form-user-radio-${field.id || index}-${index}`;
                const $wrap = $('<div/>', { class: 'form-check' });
                const $radio = $('<input/>', {
                    type: 'radio',
                    class: 'form-check-input',
                    disabled: true,
                    id: optionId,
                    checked: String(value) === String(option),
                });
                const $radioLabel = $('<label/>', {
                    class: 'form-check-label',
                    text: option,
                    for: optionId,
                });
                $wrap.append($radio, $radioLabel);
                $input.append($wrap);
            });
        } else if (fieldType === 'checkboxes') {
            const selected = parseMultiValue(value);
            $input = $('<div/>', { class: 'd-flex flex-column gap-2' });
            options.forEach((option, index) => {
                const optionId = `form-user-checkbox-${field.id || index}-${index}`;
                const $wrap = $('<div/>', { class: 'form-check' });
                const $checkbox = $('<input/>', {
                    type: 'checkbox',
                    class: 'form-check-input',
                    disabled: true,
                    id: optionId,
                    checked: selected.includes(String(option)),
                });
                const $checkboxLabel = $('<label/>', {
                    class: 'form-check-label',
                    text: option,
                    for: optionId,
                });
                $wrap.append($checkbox, $checkboxLabel);
                $input.append($wrap);
            });
        } else if (fieldType === 'date') {
            $input = $('<input/>', {
                type: 'date',
                class: 'form-control',
                value,
                disabled: true,
            });
        } else {
            $input = $('<input/>', {
                type: 'text',
                class: 'form-control',
                value,
                disabled: true,
            });
        }

        $wrapper.append($label, $input);
        return $wrapper;
    }

    function renderForm(form) {
        $title.text(form.name);
        $content.empty().hide();
        $fields.empty();

        (form.fields || []).forEach((field) => {
            $fields.append(renderField(field, field.value || ''));
        });

        if (form.status === 'complete') {
            $status.text('This form has been completed.');
        } else {
            $status.text('This form has not been completed yet.');
        }

        const canReset = Number(vars('can_reset_form')) === 1;
        const canSendReminder = vars('user_type') === 'customer' && form.status !== 'complete';
        $reset.toggleClass('d-none', !(canReset && form.status === 'complete'));
        $reminder.toggleClass('d-none', !canSendReminder);
    }

    function loadForm() {
        resetMessage();
        const formId = Number(vars('form_id'));
        const userId = Number(vars('user_id'));
        const userType = vars('user_type');

        if (!formId || !userId || !userType) {
            showMessage('Invalid form.');
            return;
        }

        App.Http.Forms.findForRecord(formId, userId, userType)
            .done((form) => {
                currentForm = form;
                renderForm(form);
            })
            .fail((xhr) => {
                showMessage(xhr.responseJSON?.message || 'Failed to load form.');
            });
    }

    function onReset() {
        if (!currentForm) {
            return;
        }

        if (!window.confirm('Reset this form submission?')) {
            return;
        }

        App.Http.Forms.resetSubmission(currentForm.id, Number(vars('user_id')), vars('user_type'))
            .done(() => {
                showMessage('Form reset.', 'success');
                loadForm();
            })
            .fail((xhr) => {
                showMessage(xhr.responseJSON?.message || 'Failed to reset form.');
            });
    }

    function onSendReminder() {
        if (!currentForm) {
            return;
        }

        if (!window.confirm('Send a profile completion reminder to this customer?')) {
            return;
        }

        App.Http.Forms.sendReminder(Number(vars('user_id')), vars('user_type'))
            .done(() => {
                showMessage('Reminder sent.', 'success');
            })
            .fail((xhr) => {
                showMessage(xhr.responseJSON?.message || 'Failed to send reminder.');
            });
    }

    function initialize() {
        $reset.on('click', onReset);
        $reminder.on('click', onSendReminder);
        loadForm();
    }

    $(document).ready(initialize);

    return {};
})();
