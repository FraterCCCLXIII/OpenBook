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
 * Booking settings page.
 *
 * This module implements the functionality of the booking settings page.
 */
App.Pages.BookingSettings = (function () {
    let $bookingSettings = $('#booking-settings');
    let $saveSettings = $('#save-settings');
    let $disableBooking = $('#disable-booking');
    let $disableBookingMessage = $('#disable-booking-message');
    let $customFieldsList = $('#custom-fields-list');
    let $addCustomField = $('#add-custom-field-setting');
    let $customFieldsDebug = $('#custom-fields-debug');

    function refreshSelectors() {
        $bookingSettings = $('#booking-settings');
        $saveSettings = $('#save-settings');
        $disableBooking = $('#disable-booking');
        $disableBookingMessage = $('#disable-booking-message');
        $customFieldsList = $('#custom-fields-list');
        $addCustomField = $('#add-custom-field-setting');
        $customFieldsDebug = $('#custom-fields-debug');
    }

    function writeDebug(message) {
        const $debug = $customFieldsDebug.length ? $customFieldsDebug : $('#custom-fields-debug');
        if (!$debug.length) {
            return;
        }
        const current = $debug.text();
        $debug.text(current ? `${current} | ${message}` : message);
    }

    function getCustomFieldsList() {
        return $customFieldsList.length ? $customFieldsList : $('#custom-fields-list');
    }

    const customFieldTypeOptions = [
        { value: 'input', label: 'Text input' },
        { value: 'dropdown', label: 'Dropdown' },
        { value: 'radio', label: 'Radio' },
        { value: 'checkboxes', label: 'Checkboxes' },
        { value: 'date', label: 'Date' },
    ];

    function normalizeFieldType(fieldType) {
        const normalized = String(fieldType || '').toLowerCase();
        return customFieldTypeOptions.some((option) => option.value === normalized) ? normalized : 'input';
    }

    function fieldTypeRequiresOptions(fieldType) {
        return ['dropdown', 'radio', 'checkboxes'].includes(fieldType);
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

    /**
     * Check if the form has invalid values.
     *
     * @return {Boolean}
     */
    function isInvalid() {
        try {
            $('#booking-settings .is-invalid').removeClass('is-invalid');

            // Validate required fields.

            let missingRequiredFields = false;

            $('#booking-settings .required').each((index, requiredField) => {
                const $requiredField = $(requiredField);

                if (!$requiredField.val()) {
                    $requiredField.addClass('is-invalid');
                    missingRequiredFields = true;
                }
            });

            if (missingRequiredFields) {
                throw new Error(lang('fields_are_required'));
            }

            const hasFieldControls =
                $('.display-switch').length > 0 || $('.custom-field-displayed').length > 0;

            if (hasFieldControls) {
                // Ensure there is at least one field displayed.
                const hasLegacyDisplayed = $('.display-switch:checked').length > 0;
                const hasDynamicDisplayed = $('.custom-field-displayed:checked').length > 0;
                if (!hasLegacyDisplayed && !hasDynamicDisplayed) {
                    throw new Error(lang('at_least_one_field'));
                }

                // Ensure there is at least one field required.
                const hasLegacyRequired = $('.require-switch:checked').length > 0;
                const hasDynamicRequired = $('.custom-field-required:checked').length > 0;
                if (!hasLegacyRequired && !hasDynamicRequired) {
                    throw new Error(lang('at_least_one_field_required'));
                }
            }

            return false;
        } catch (error) {
            App.Layouts.Backend.displayNotification(error.message);
            return true;
        }
    }

    /**
     * Apply the booking settings into the page.
     *
     * @param {Object} bookingSettings
     */
    function deserialize(bookingSettings) {
        bookingSettings.forEach((bookingSetting) => {
            if (bookingSetting.name === 'disable_booking_message') {
                $disableBookingMessage.trumbowyg('html', bookingSetting.value);
                return;
            }

            const $field = $('[data-field="' + bookingSetting.name + '"]');

            if ($field.is(':checkbox')) {
                $field.prop('checked', Boolean(Number(bookingSetting.value)));
            } else {
                $field.val(bookingSetting.value);
            }
        });
    }

    /**
     * Serialize the page values into an array.
     *
     * @returns {Array}
     */
    function serialize() {
        const bookingSettings = [];

        $('[data-field]').each((index, field) => {
            const $field = $(field);

            bookingSettings.push({
                name: $field.data('field'),
                value: $field.is(':checkbox') ? Number($field.prop('checked')) : $field.val(),
            });
        });

        bookingSettings.push({
            name: 'disable_booking_message',
            value: $disableBookingMessage.trumbowyg('html'),
        });

        return bookingSettings;
    }

    function createCustomFieldCard(field = {}) {
        const fieldId = field.id || '';
        const fieldType = normalizeFieldType(field.field_type);
        const options = normalizeOptions(field.options);
        const $card = $('<div/>', {
            class: 'custom-field-card rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-3',
            'data-field-id': fieldId,
            'data-field-type': fieldType,
        });

        const $handle = $('<button/>', {
            type: 'button',
            class: 'btn btn-link p-0 text-slate-400 custom-field-handle',
            html: '<i class="fas fa-grip-vertical"></i>',
            title: 'Reorder',
            draggable: true,
        });

        const $content = $('<div/>', { class: 'flex-grow-1' });
        const $label = $('<label/>', {
            class: 'form-label',
            text: 'Custom Field',
        });
        const $input = $('<input/>', {
            type: 'text',
            class: 'form-control custom-field-label',
            placeholder: 'Field label',
            value: field.label || '',
        });

        const $typeLabel = $('<label/>', {
            class: 'form-label mt-2',
            text: 'Field type',
        });
        const $typeSelect = $('<select/>', {
            class: 'form-select form-select-sm custom-field-type',
        });
        customFieldTypeOptions.forEach((option) => {
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
                class: 'form-control custom-field-options',
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
        const $displayWrap = $('<div/>', { class: 'form-check form-switch mb-0' });
        const $displayInput = $('<input/>', {
            type: 'checkbox',
            class: 'form-check-input custom-field-displayed',
            checked: Boolean(field.is_displayed ?? true),
        });
        const $displayLabel = $('<label/>', {
            class: 'form-check-label text-sm',
            text: 'Display',
        });
        $displayWrap.append($displayInput, $displayLabel);

        const $requireWrap = $('<div/>', { class: 'form-check form-switch mb-0' });
        const $requireInput = $('<input/>', {
            type: 'checkbox',
            class: 'form-check-input custom-field-required',
            checked: Boolean(field.is_required),
        });
        const $requireLabel = $('<label/>', {
            class: 'form-check-label text-sm',
            text: 'Require',
        });
        $requireWrap.append($requireInput, $requireLabel);

        $leftActions.append($displayWrap, $requireWrap);

        const $rightActions = $('<div/>', { class: 'd-flex align-items-center gap-2' });
        const $duplicate = $('<button/>', {
            type: 'button',
            class: 'btn btn-outline-secondary btn-sm custom-field-duplicate',
            html: '<i class="fas fa-copy"></i>',
            title: 'Duplicate',
        });
        const $remove = $('<button/>', {
            type: 'button',
            class: 'btn btn-outline-danger btn-sm custom-field-remove',
            html: '<i class="fas fa-trash"></i>',
            title: 'Delete',
        });
        $rightActions.append($duplicate, $remove);

        $actions.append($leftActions, $rightActions);

        $card.append($top, $actions);

        return $card;
    }

    function renderCustomFields(fields = []) {
        const $list = getCustomFieldsList();
        $list.empty();
        fields.forEach((field) => {
            $list.append(createCustomFieldCard(field));
        });
        writeDebug(`debug: rendered ${fields.length} custom fields`);
        $list.find('.custom-field-displayed').each((index, el) => {
            updateDynamicDisplaySwitch($(el));
        });
    }

    function serializeCustomFields() {
        const fields = [];
        getCustomFieldsList().find('.custom-field-card').each((index, card) => {
            const $card = $(card);
            const label = $card.find('.custom-field-label').val()?.trim() || '';
            if (!label) {
                return;
            }
            const fieldType = $card.data('field-type') || 'input';
            const options = fieldTypeRequiresOptions(fieldType)
                ? normalizeOptions($card.find('.custom-field-options').val() || '')
                : [];
            fields.push({
                id: $card.data('field-id') || undefined,
                label,
                is_required: $card.find('.custom-field-required').prop('checked') ? 1 : 0,
                is_displayed: $card.find('.custom-field-displayed').prop('checked') ? 1 : 0,
                sort_order: index,
                field_type: fieldType,
                options,
            });
        });

        return fields;
    }

    /**
     * Update the UI based on the display switch state.
     *
     * @param {jQuery} $displaySwitch
     */
    function updateDisplaySwitch($displaySwitch) {
        const isChecked = $displaySwitch.prop('checked');

        const $formGroup = $displaySwitch.closest('.form-group');

        $formGroup.find('.require-switch').prop('disabled', !isChecked);

        $formGroup.find('.form-label, .form-control').toggleClass('opacity-25', !isChecked);

        if (!isChecked) {
            $formGroup.find('.require-switch').prop('checked', false);
            $formGroup.find('.text-danger').hide();
        }
    }

    /**
     * Update the UI based on the require switch state.
     *
     * @param {jQuery} $requireSwitch
     */
    function updateRequireSwitch($requireSwitch) {
        const isChecked = $requireSwitch.prop('checked');

        const $formGroup = $requireSwitch.closest('.form-group');

        $formGroup.find('.text-danger').toggle(isChecked);
    }

    function updateDynamicDisplaySwitch($displaySwitch) {
        const isChecked = $displaySwitch.prop('checked');
        const $card = $displaySwitch.closest('.custom-field-card');
        const $requireSwitch = $card.find('.custom-field-required');
        $requireSwitch.prop('disabled', !isChecked);
        if (!isChecked) {
            $requireSwitch.prop('checked', false);
        }
    }

    function updateDynamicRequireSwitch($requireSwitch) {
        const isChecked = $requireSwitch.prop('checked');
        const $card = $requireSwitch.closest('.custom-field-card');
        const $displaySwitch = $card.find('.custom-field-displayed');
        if (isChecked) {
            $displaySwitch.prop('checked', true);
            updateDynamicDisplaySwitch($displaySwitch);
        }
    }

    /**
     * Update the UI based on the initial values.
     */
    function applyInitialState() {
        $bookingSettings.find('.display-switch').each((index, displaySwitchEl) => {
            const $displaySwitch = $(displaySwitchEl);
            updateDisplaySwitch($displaySwitch);
        });

        $bookingSettings.find('.require-switch').each((index, requireSwitchEl) => {
            const $requireSwitch = $(requireSwitchEl);
            updateRequireSwitch($requireSwitch);
        });

        $disableBookingMessage.closest('.form-group').prop('hidden', !$disableBooking.prop('checked'));
    }

    /**
     * Save the account information.
     */
    function onSaveSettingsClick() {
        if (isInvalid()) {
            return;
        }

        const bookingSettings = serialize();
        const customFields = serializeCustomFields();

        writeDebug(`debug: saving settings (${bookingSettings.length}) fields (${customFields.length})`);

        App.Http.BookingSettings.save(bookingSettings, customFields)
            .done(() => {
                App.Layouts.Backend.displayNotification(lang('settings_saved'));
                writeDebug('debug: save success');
            })
            .fail((xhr) => {
                const message = xhr?.responseJSON?.message || xhr?.responseText || 'unknown error';
                writeDebug(`debug: save failed ${message}`);
            });
    }

    /**
     * Update the UI.
     *
     * @param {jQuery} event
     */
    function onDisplaySwitchClick(event) {
        const $displaySwitch = $(event.target);

        updateDisplaySwitch($displaySwitch);
    }

    /**
     * Update the UI.
     *
     * @param {Event} event
     */
    function onRequireSwitchClick(event) {
        const $requireSwitch = $(event.target);

        updateRequireSwitch($requireSwitch);
    }

    function onDynamicDisplaySwitchClick(event) {
        const $displaySwitch = $(event.target);
        updateDynamicDisplaySwitch($displaySwitch);
    }

    function onDynamicRequireSwitchClick(event) {
        const $requireSwitch = $(event.target);
        updateDynamicRequireSwitch($requireSwitch);
    }

    /**
     * Toggle the message container.
     */
    function onDisableBookingClick() {
        $disableBookingMessage.closest('.form-group').prop('hidden', !$disableBooking.prop('checked'));
    }

    function onAddCustomFieldClick() {
        const $list = getCustomFieldsList();
        if (!$list.length) {
            writeDebug('debug: custom fields list not found');
            return;
        }
        $list.append(createCustomFieldCard());
        const count = $list.find('.custom-field-card').length;
        writeDebug(`debug: added custom field, total ${count}`);
    }

    function enableCustomFieldDragAndDrop() {
        let dragging = null;

        getCustomFieldsList().on('dragstart', '.custom-field-handle', (event) => {
            dragging = $(event.currentTarget).closest('.custom-field-card').get(0);
            $(dragging).addClass('border-primary');
            event.originalEvent.dataTransfer.effectAllowed = 'move';
            event.originalEvent.dataTransfer.setData('text/plain', 'reorder');
        });

        getCustomFieldsList().on('dragend', '.custom-field-handle', () => {
            if (dragging) {
                $(dragging).removeClass('border-primary');
            }
            dragging = null;
        });

        getCustomFieldsList().on('dragover', '.custom-field-card', (event) => {
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

    function addCustomFieldEventListeners() {
        getCustomFieldsList().on('change', '.custom-field-type', (event) => {
            const $card = $(event.currentTarget).closest('.custom-field-card');
            const nextType = normalizeFieldType($(event.currentTarget).val());
            const label = $card.find('.custom-field-label').val();
            const isRequired = $card.find('.custom-field-required').prop('checked');
            const isDisplayed = $card.find('.custom-field-displayed').prop('checked');
            const options = normalizeOptions($card.find('.custom-field-options').val() || '');
            const fieldId = $card.data('field-id') || undefined;
            const $replacement = createCustomFieldCard({
                id: fieldId,
                label,
                is_required: isRequired,
                is_displayed: isDisplayed,
                field_type: nextType,
                options,
            });
            $card.replaceWith($replacement);
        });

        getCustomFieldsList().on('click', '.custom-field-remove', (event) => {
            $(event.currentTarget).closest('.custom-field-card').remove();
        });

        getCustomFieldsList().on('click', '.custom-field-duplicate', (event) => {
            const $card = $(event.currentTarget).closest('.custom-field-card');
            const label = $card.find('.custom-field-label').val();
            const isRequired = $card.find('.custom-field-required').prop('checked');
            const isDisplayed = $card.find('.custom-field-displayed').prop('checked');
            const fieldType = $card.data('field-type') || 'input';
            const options = normalizeOptions($card.find('.custom-field-options').val() || '');
            $card.after(
                createCustomFieldCard({
                    label,
                    is_required: isRequired,
                    is_displayed: isDisplayed,
                    field_type: fieldType,
                    options,
                }),
            );
        });
    }

    /**
     * Initialize the module.
     */
    let hasInitialized = false;

    function initialize() {
        if (hasInitialized) {
            return;
        }
        hasInitialized = true;
        refreshSelectors();
        const bookingSettings = vars('booking_settings');
        writeDebug('debug: booking_settings.js initialize start');

        $saveSettings.off('click').on('click', onSaveSettingsClick);

        $disableBooking.off('click').on('click', onDisableBookingClick);
        $addCustomField.off('click').on('click', onAddCustomFieldClick);
        $bookingSettings
            .off('click', '.display-switch', onDisplaySwitchClick)
            .off('click', '.require-switch', onRequireSwitchClick)
            .off('click', '.custom-field-displayed', onDynamicDisplaySwitchClick)
            .off('click', '.custom-field-required', onDynamicRequireSwitchClick)
            .on('click', '.display-switch', onDisplaySwitchClick)
            .on('click', '.require-switch', onRequireSwitchClick)
            .on('click', '.custom-field-displayed', onDynamicDisplaySwitchClick)
            .on('click', '.custom-field-required', onDynamicRequireSwitchClick);

        $disableBookingMessage.trumbowyg();

        deserialize(bookingSettings);
        const initialFields = vars('custom_fields');
        renderCustomFields(Array.isArray(initialFields) ? initialFields : []);
        addCustomFieldEventListeners();
        enableCustomFieldDragAndDrop();

        applyInitialState();
        const debugCount = Array.isArray(initialFields) ? initialFields.length : 0;
        writeDebug(`debug: init complete, fields payload ${debugCount}`);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            writeDebug('debug: booking_settings.js loaded');
            try {
                initialize();
            } catch (error) {
                writeDebug(`debug: booking_settings.js error: ${error?.message || error}`);
                throw error;
            }
        });
    } else {
        writeDebug('debug: booking_settings.js loaded (late)');
        try {
            initialize();
        } catch (error) {
            writeDebug(`debug: booking_settings.js error: ${error?.message || error}`);
            throw error;
        }
    }

    return {
        initialize,
    };
})();
