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
 * Forms settings edit page.
 */
App.Pages.FormsSettingsEdit = (function () {
    const $formsSettings = $('#forms-settings');
    const $formId = $('#form-id');
    const $formName = $('#form-name');
    const $userTypesToggle = $('#form-user-types-toggle');
    const $userTypeInputs = $('.form-user-type');
    const $formFields = $('#form-fields');
    const $saveForm = $('#save-form');
    const $deleteForm = $('#delete-form');
    const $addFormText = $('#add-form-text');
    const $addFormInput = $('#add-form-input');
    const $addFormDropdown = $('#add-form-dropdown');
    const $addFormRadio = $('#add-form-radio');
    const $addFormCheckboxes = $('#add-form-checkboxes');
    const $addFormDate = $('#add-form-date');
    const $message = $('#forms-message');
    const $previewButton = $('#preview-form');
    const $previewModal = $('#form-preview-modal');
    const $previewTitle = $('#form-preview-title');
    const $previewFields = $('#form-preview-fields');
    let seededInitialBlock = false;

    function resetMessage() {
        $message.addClass('d-none').removeClass('alert-danger alert-success').text('');
    }

    function showMessage(text, type = 'danger') {
        $message.removeClass('d-none').removeClass('alert-danger alert-success');
        $message.addClass(`alert-${type}`).text(text);
    }

    function updateUserTypesLabel() {
        const selected = $userTypeInputs
            .filter(':checked')
            .map((_, input) => $(input).val())
            .get();

        if (!selected.length) {
            $userTypesToggle.text('Select user types');
            return;
        }

        $userTypesToggle.text(selected.map((value) => value.charAt(0).toUpperCase() + value.slice(1)).join(', '));
    }

    const fieldTypeOptions = [
        { value: 'input', label: 'Input' },
        { value: 'text', label: 'Text block' },
        { value: 'dropdown', label: 'Dropdown' },
        { value: 'radio', label: 'Radio' },
        { value: 'checkboxes', label: 'Checkboxes' },
        { value: 'date', label: 'Date' },
    ];

    function normalizeFieldType(fieldType) {
        const normalized = String(fieldType || '').toLowerCase();
        return fieldTypeOptions.some((option) => option.value === normalized) ? normalized : 'input';
    }

    function fieldTypeRequiresOptions(fieldType) {
        return ['dropdown', 'radio', 'checkboxes'].includes(fieldType);
    }

    function fieldTypeSupportsRequired(fieldType) {
        return ['input', 'dropdown', 'radio', 'checkboxes', 'date'].includes(fieldType);
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

    function formatOptions(options) {
        return normalizeOptions(options).join('\n');
    }

    function createFieldCard(field = {}) {
        const fieldId = field.id || '';
        const fieldType = normalizeFieldType(field.field_type);
        const options = normalizeOptions(field.options);
        const $card = $('<div/>', {
            class: 'form-field-card rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-3',
            'data-field-id': fieldId,
            'data-field-type': fieldType,
        });

        const $handle = $('<button/>', {
            type: 'button',
            class: 'btn btn-link p-0 text-slate-400 form-field-handle',
            html: '<i class="fas fa-grip-vertical"></i>',
            title: 'Reorder',
            draggable: true,
        });

        const $content = $('<div/>', { class: 'flex-grow-1' });
        const labelText = fieldType === 'text' ? 'Text block' : 'Field label';

        const $label = $('<label/>', {
            class: 'form-label',
            text: labelText,
        });

        const $input = fieldType === 'text'
            ? $('<textarea/>', {
                  class: 'form-control form-field-label form-field-rich-text',
                  rows: 3,
                  placeholder: 'Enter text shown to users',
                  'data-initial-html': field.label || '',
              })
            : $('<input/>', {
                  type: 'text',
                  class: 'form-control form-field-label',
                  placeholder: 'Field label',
                  value: field.label || '',
              });

        const $typeLabel = $('<label/>', {
            class: 'form-label mt-2',
            text: 'Field type',
        });

        const $typeSelect = $('<select/>', {
            class: 'form-select form-select-sm form-field-type',
        });

        fieldTypeOptions.forEach((option) => {
            $typeSelect.append(
                $('<option/>', {
                    value: option.value,
                    text: option.label,
                    selected: option.value === fieldType,
                }),
            );
        });

        $content.append($label, $input, $typeLabel, $typeSelect);

        if (fieldTypeRequiresOptions(fieldType)) {
            const $optionsLabel = $('<label/>', {
                class: 'form-label mt-2',
                text: 'Options (one per line)',
            });
            const $optionsInput = $('<textarea/>', {
                class: 'form-control form-field-options',
                rows: 3,
                placeholder: 'Option 1\nOption 2',
                val: formatOptions(options),
            });
            $content.append($optionsLabel, $optionsInput);
        }

        const $top = $('<div/>', { class: 'd-flex gap-3 align-items-start' });
        $top.append($handle, $content);

        const $actions = $('<div/>', {
            class: 'mt-3 d-flex align-items-center justify-content-between border-top pt-2',
        });

        const $leftActions = $('<div/>', { class: 'd-flex align-items-center gap-3' });
        if (fieldTypeSupportsRequired(fieldType)) {
            const $required = $('<div/>', {
                class: 'form-check form-switch mb-0',
            });
            const $requiredInput = $('<input/>', {
                type: 'checkbox',
                class: 'form-check-input form-field-required',
                checked: Boolean(field.is_required),
            });
            const $requiredLabel = $('<label/>', {
                class: 'form-check-label text-sm',
                text: 'Required',
            });
            $required.append($requiredInput, $requiredLabel);
            $leftActions.append($required);
        }

        const $rightActions = $('<div/>', { class: 'd-flex align-items-center gap-2' });
        const $duplicate = $('<button/>', {
            type: 'button',
            class: 'btn btn-outline-secondary btn-sm form-field-duplicate',
            html: '<i class="fas fa-copy"></i>',
            title: 'Duplicate',
        });
        const $remove = $('<button/>', {
            type: 'button',
            class: 'btn btn-outline-danger btn-sm form-field-remove',
            html: '<i class="fas fa-trash"></i>',
            title: 'Delete',
        });
        $rightActions.append($duplicate, $remove);
        $actions.append($leftActions, $rightActions);

        $card.append($top, $actions);

        return $card;
    }

    function renderFields(fields = []) {
        $formFields.empty();
        const normalizedFields = fields.length
            ? fields
            : [{ field_type: 'text', label: '' }];
        normalizedFields.forEach((field) => {
            $formFields.append(createFieldCard(field));
        });
        initializeTextBlocks($formFields);
    }

    function renderPreviewField(field) {
        const fieldType = normalizeFieldType(field.field_type);
        if (fieldType === 'text') {
            return $('<div/>', {
                class: 'rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-slate-50/60 p-3 text-sm text-slate-600',
                html: field.label || '',
            });
        }

        const $wrapper = $('<div/>', { class: 'form-field' });
        const $label = $('<label/>', {
            class: 'form-label',
            text: field.label,
        });
        const options = normalizeOptions(field.options);
        let $input;

        if (fieldType === 'dropdown') {
            $input = $('<select/>', { class: 'form-select', disabled: true });
            $input.append($('<option/>', { value: '', text: '' }));
            options.forEach((option) => {
                $input.append($('<option/>', { value: option, text: option }));
            });
        } else if (fieldType === 'radio') {
            $input = $('<div/>', { class: 'd-flex flex-column gap-2' });
            options.forEach((option, index) => {
                const optionId = `preview-radio-${field.id || 'field'}-${index}`;
                const $wrap = $('<div/>', { class: 'form-check' });
                const $radio = $('<input/>', {
                    type: 'radio',
                    class: 'form-check-input',
                    disabled: true,
                    id: optionId,
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
            $input = $('<div/>', { class: 'd-flex flex-column gap-2' });
            options.forEach((option, index) => {
                const optionId = `preview-checkbox-${field.id || 'field'}-${index}`;
                const $wrap = $('<div/>', { class: 'form-check' });
                const $checkbox = $('<input/>', {
                    type: 'checkbox',
                    class: 'form-check-input',
                    disabled: true,
                    id: optionId,
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
                disabled: true,
            });
        } else {
            $input = $('<input/>', {
                type: 'text',
                class: 'form-control',
                disabled: true,
            });
        }

        $wrapper.append($label, $input);
        return $wrapper;
    }

    function openPreview() {
        const form = serializeForm();
        $previewTitle.text(form.name || 'Untitled form');
        $previewFields.empty();
        (form.fields || []).forEach((field) => {
            $previewFields.append(renderPreviewField(field));
        });
        $previewModal.modal('show');
    }

    function initializeTextBlocks($scope) {
        const $targets = $scope.is('.form-field-card[data-field-type="text"]')
            ? $scope.find('.form-field-rich-text')
            : $scope.find('.form-field-card[data-field-type="text"] .form-field-rich-text');

        $targets.each((_, textarea) => {
            const $textarea = $(textarea);
            if ($textarea.data('trumbowyg')) {
                return;
            }
            App.Utils.UI.initializeTextEditor($textarea);
            const initialHtml = $textarea.data('initial-html');
            if (initialHtml) {
                $textarea.trumbowyg('html', initialHtml);
            }
        });
    }

    function serializeForm() {
        const fields = [];
        $formFields.find('.form-field-card').each((index, card) => {
            const $card = $(card);
            const fieldType = normalizeFieldType($card.data('field-type') || 'input');
            const $labelInput = $card.find('.form-field-label');
            const label = fieldType === 'text'
                ? $labelInput.trumbowyg('html').trim()
                : $labelInput.val()?.trim() || '';
            if (!label) {
                return;
            }
            const required = $card.find('.form-field-required').prop('checked');
            const options = fieldTypeRequiresOptions(fieldType)
                ? normalizeOptions($card.find('.form-field-options').val() || '')
                : [];
            fields.push({
                id: $card.data('field-id') || undefined,
                label,
                field_type: fieldType,
                is_required: fieldTypeSupportsRequired(fieldType) && required ? 1 : 0,
                sort_order: index,
                options,
            });
        });

        const assignedUserTypes = $userTypeInputs
            .filter(':checked')
            .map((_, input) => $(input).val())
            .get();

        return {
            id: $formId.val() || undefined,
            name: $formName.val().trim(),
            content: '',
            assigned_user_types: assignedUserTypes,
            fields,
        };
    }

    function validateForm() {
        resetMessage();
        $formsSettings.find('.is-invalid').removeClass('is-invalid');

        if (!$formName.val().trim()) {
            $formName.addClass('is-invalid');
            showMessage('Form name is required.');
            return false;
        }

        if (!$userTypeInputs.filter(':checked').length) {
            showMessage('Select at least one user type.');
            return false;
        }

        return true;
    }

    function enableDragAndDrop() {
        let dragging = null;

        $formFields.on('dragstart', '.form-field-handle', (event) => {
            dragging = $(event.currentTarget).closest('.form-field-card').get(0);
            $(dragging).addClass('border-primary');
            event.originalEvent.dataTransfer.effectAllowed = 'move';
            event.originalEvent.dataTransfer.setData('text/plain', 'reorder');
        });

        $formFields.on('dragend', '.form-field-handle', () => {
            if (dragging) {
                $(dragging).removeClass('border-primary');
            }
            dragging = null;
        });

        $formFields.on('dragover', '.form-field-card', (event) => {
            event.preventDefault();
            if (!dragging || dragging === event.currentTarget) {
                return;
            }
            const $target = $(event.currentTarget);
            const targetRect = event.currentTarget.getBoundingClientRect();
            const offset = event.originalEvent.clientY - targetRect.top;
            if (offset > targetRect.height / 2) {
                $target.after(dragging);
            } else {
                $target.before(dragging);
            }
        });
    }

    function loadForm(formId) {
        seededInitialBlock = false;
        if (!formId) {
            $deleteForm.prop('disabled', true);
            updateUserTypesLabel();
            seededInitialBlock = true;
            renderFields([]);
            return;
        }

        App.Http.Forms.find(formId).done((form) => {
            $formId.val(form.id);
            $formName.val(form.name);
            const fields = Array.isArray(form.fields) ? [...form.fields] : [];
            if (form.content && !seededInitialBlock) {
                fields.unshift({
                    field_type: 'text',
                    label: form.content,
                });
                seededInitialBlock = true;
            }
            $userTypeInputs.prop('checked', false);
            (form.assigned_user_types || []).forEach((slug) => {
                $userTypeInputs.filter(`[value="${slug}"]`).prop('checked', true);
            });
            updateUserTypesLabel();
            renderFields(fields);
            $deleteForm.prop('disabled', false);
        });
    }

    function onSaveForm() {
        if (!validateForm()) {
            return;
        }

        const form = serializeForm();
        App.Http.Forms.save(form)
            .done((response) => {
                showMessage('Form saved.', 'success');
                window.location.href = App.Utils.Url.siteUrl(`forms_settings/view/${response.id}`);
            })
            .fail((xhr) => {
                showMessage(xhr.responseJSON?.message || 'Failed to save form.');
            });
    }

    function onDeleteForm() {
        const formId = $formId.val();
        if (!formId) {
            return;
        }

        App.Http.Forms.remove(formId)
            .done(() => {
                window.location.href = App.Utils.Url.siteUrl('forms_settings');
            })
            .fail((xhr) => {
                showMessage(xhr.responseJSON?.message || 'Failed to delete form.');
            });
    }

    function addEventListeners() {
        $saveForm.on('click', onSaveForm);
        $deleteForm.on('click', onDeleteForm);
        $previewButton.on('click', openPreview);
        $formsSettings.on('click', '#add-form-text', () => {
            const $card = createFieldCard({ field_type: 'text' });
            $formFields.append($card);
            initializeTextBlocks($card);
        });
        $formsSettings.on('click', '#add-form-input', () => {
            $formFields.append(createFieldCard({ field_type: 'input' }));
        });
        $formsSettings.on('click', '#add-form-dropdown', () => {
            $formFields.append(createFieldCard({ field_type: 'dropdown' }));
        });
        $formsSettings.on('click', '#add-form-radio', () => {
            $formFields.append(createFieldCard({ field_type: 'radio' }));
        });
        $formsSettings.on('click', '#add-form-checkboxes', () => {
            $formFields.append(createFieldCard({ field_type: 'checkboxes' }));
        });
        $formsSettings.on('click', '#add-form-date', () => {
            $formFields.append(createFieldCard({ field_type: 'date' }));
        });
        $formFields.on('change', '.form-field-type', (event) => {
            const $card = $(event.currentTarget).closest('.form-field-card');
            const nextType = normalizeFieldType($(event.currentTarget).val());
            const fieldType = normalizeFieldType($card.data('field-type') || 'input');
            const label = fieldType === 'text'
                ? $card.find('.form-field-label').trumbowyg('html')
                : $card.find('.form-field-label').val();
            const required = $card.find('.form-field-required').prop('checked');
            const options = normalizeOptions($card.find('.form-field-options').val() || '');
            const fieldId = $card.data('field-id') || undefined;
            const $clone = createFieldCard({
                id: fieldId,
                field_type: nextType,
                label,
                is_required: required,
                options,
            });
            $card.replaceWith($clone);
            if (nextType === 'text') {
                initializeTextBlocks($clone);
            }
        });
        $formFields.on('click', '.form-field-remove', (event) => {
            $(event.currentTarget).closest('.form-field-card').remove();
        });
        $formFields.on('click', '.form-field-duplicate', (event) => {
            const $card = $(event.currentTarget).closest('.form-field-card');
            const fieldType = normalizeFieldType($card.data('field-type') || 'input');
            const label = fieldType === 'text'
                ? $card.find('.form-field-label').trumbowyg('html')
                : $card.find('.form-field-label').val();
            const required = $card.find('.form-field-required').prop('checked');
            const options = normalizeOptions($card.find('.form-field-options').val() || '');
            const $clone = createFieldCard({
                field_type: fieldType,
                label,
                is_required: required,
                options,
            });
            $card.after($clone);
            if (fieldType === 'text') {
                initializeTextBlocks($clone);
            }
        });
        $userTypeInputs.on('change', updateUserTypesLabel);
    }

    function initialize() {
        updateUserTypesLabel();
        const formId = Number($formId.val()) || null;
        loadForm(formId);
        addEventListeners();
        enableDragAndDrop();
    }

    document.addEventListener('DOMContentLoaded', initialize);

    return {};
})();
