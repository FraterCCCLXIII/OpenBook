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
 * Customer form view page.
 */
App.Pages.CustomerFormView = (function () {
    const $title = $('#customer-form-title');
    const $content = $('#customer-form-content');
    const $fields = $('#customer-form-fields');
    const $submit = $('#customer-form-submit');
    const $status = $('#customer-form-status');
    const $message = $('#customer-form-message');

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

    function renderFieldInput(field, value = '', readOnly = false) {
        const fieldType = normalizeFieldType(field.field_type);
        const fieldId = field.id ?? field.field_id;
        const $wrapper = $('<div/>', {
            class: 'form-field',
            'data-field-id': fieldId,
            'data-field-type': fieldType,
            'data-required': field.is_required ? 1 : 0,
        });
        const $label = $('<label/>', {
            class: 'form-label',
            text: field.label,
        });
        const options = normalizeOptions(field.options);
        let $input;

        if (fieldType === 'dropdown') {
            $input = $('<select/>', {
                class: 'form-select form-response-input',
                disabled: readOnly,
            });
            if (!field.is_required) {
                $input.append($('<option/>', { value: '', text: '' }));
            }
            options.forEach((option) => {
                $input.append($('<option/>', { value: option, text: option }));
            });
            $input.val(value);
        } else if (fieldType === 'radio') {
            $input = $('<div/>', { class: 'd-flex flex-column gap-2' });
            options.forEach((option, index) => {
                const optionId = `customer-form-radio-${fieldId}-${index}`;
                const $wrap = $('<div/>', { class: 'form-check' });
                const $radio = $('<input/>', {
                    type: 'radio',
                    id: optionId,
                    name: `customer-form-${fieldId}`,
                    class: 'form-check-input form-response-input',
                    value: option,
                    checked: String(value) === String(option),
                    disabled: readOnly,
                    'data-field-id': fieldId,
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
                const optionId = `customer-form-checkbox-${fieldId}-${index}`;
                const $wrap = $('<div/>', { class: 'form-check' });
                const $checkbox = $('<input/>', {
                    type: 'checkbox',
                    id: optionId,
                    class: 'form-check-input form-response-input',
                    value: option,
                    checked: selected.includes(String(option)),
                    disabled: readOnly,
                    'data-field-id': fieldId,
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
                class: 'form-control form-response-input',
                value: value,
                disabled: readOnly,
                'data-field-id': fieldId,
            });
        } else {
            $input = $('<input/>', {
                type: 'text',
                class: 'form-control form-response-input',
                value: value,
                disabled: readOnly,
                'data-field-id': fieldId,
            });
        }

        if (field.is_required && !readOnly && fieldType !== 'text') {
            $input.addClass('required');
        }

        $wrapper.append($label, $input);
        return $wrapper;
    }

    function renderField(field, value = '', readOnly = false) {
        if (normalizeFieldType(field.field_type) === 'text') {
            return renderTextBlock(field);
        }
        return renderFieldInput(field, value, readOnly);
    }

    function renderIncomplete(form) {
        $fields.empty();
        (form.fields || []).forEach((field) => {
            $fields.append(renderField(field, '', false));
        });
        $submit.prop('disabled', false).show();
        $status.text('Complete the required fields and submit.');
    }

    function renderComplete(form) {
        $fields.empty();
        (form.fields || []).forEach((field) => {
            $fields.append(renderField(field, field.value || '', true));
        });
        $submit.prop('disabled', true).hide();
        $status.text('This form has been completed and is read-only.');
    }

    function collectResponses() {
        const responses = [];
        let hasErrors = false;

        $fields.find('.form-field[data-field-id]').each((_, wrapper) => {
            const $wrapper = $(wrapper);
            const fieldId = Number($wrapper.data('field-id'));
            const fieldType = normalizeFieldType($wrapper.data('field-type'));
            const required = Number($wrapper.data('required')) === 1;
            const $inputs = $wrapper.find('.form-response-input');

            $inputs.removeClass('is-invalid');

            if (fieldType === 'checkboxes') {
                const selected = $inputs.filter(':checked').map((_, input) => $(input).val()).get();
                if (required && !selected.length) {
                    $inputs.addClass('is-invalid');
                    hasErrors = true;
                }
                responses.push({ field_id: fieldId, value: selected });
                return;
            }

            if (fieldType === 'radio') {
                const selected = $inputs.filter(':checked').val() || '';
                if (required && !selected) {
                    $inputs.addClass('is-invalid');
                    hasErrors = true;
                }
                responses.push({ field_id: fieldId, value: selected });
                return;
            }

            const value = ($inputs.first().val() || '').toString().trim();
            if (required && !value) {
                $inputs.addClass('is-invalid');
                hasErrors = true;
            }
            responses.push({ field_id: fieldId, value });
        });

        if (hasErrors) {
            showMessage('Please complete all required fields.');
            return null;
        }

        return responses;
    }

    function onSubmit() {
        resetMessage();

        const responses = collectResponses();
        if (!responses) {
            return;
        }

        App.Http.CustomerForms.submit(currentForm.id, responses)
            .done(() => {
                showMessage('Form submitted successfully.', 'success');
                loadForm();
            })
            .fail((xhr) => {
                showMessage(xhr.responseJSON?.message || 'Failed to submit form.');
            });
    }

    function loadForm() {
        resetMessage();
        const formId = Number(vars('form_id'));
        if (!formId) {
            showMessage('Invalid form.');
            return;
        }

        App.Http.CustomerForms.find(formId)
            .done((form) => {
                currentForm = form;
                $title.text(form.name);
                $content.empty().hide();

                if (form.status === 'complete') {
                    renderComplete(form);
                } else {
                    renderIncomplete(form);
                }
            })
            .fail((xhr) => {
                showMessage(xhr.responseJSON?.message || 'Failed to load form.');
            });
    }

    function initialize() {
        $submit.on('click', onSubmit);
        loadForm();
    }

    document.addEventListener('DOMContentLoaded', initialize);

    return {};
})();
