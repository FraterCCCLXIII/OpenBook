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
 * Customer profiles settings page.
 *
 * This module implements the functionality of the customer profiles settings page.
 */
App.Pages.CustomerProfilesSettings = (function () {
    let $customerProfilesSettings = $('#customer-profiles-settings');
    let $saveSettings = $('#save-settings');
    let $customFieldsList = $('#custom-fields-list');
    let $addCustomField = $('#add-custom-field-setting');
    let $customFieldsDebug = $('#custom-fields-debug');

    function refreshSelectors() {
        $customerProfilesSettings = $('#customer-profiles-settings');
        $saveSettings = $('#save-settings');
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

    function isInvalid() {
        try {
            $('#customer-profiles-settings .is-invalid').removeClass('is-invalid');

            let missingRequiredFields = false;

            $('#customer-profiles-settings .required').each((index, requiredField) => {
                const $requiredField = $(requiredField);

                if (!$requiredField.val()) {
                    $requiredField.addClass('is-invalid');
                    missingRequiredFields = true;
                }
            });

            if (missingRequiredFields) {
                throw new Error(lang('fields_are_required'));
            }

            const hasLegacyDisplayed = $('.display-switch:checked').length > 0;
            const hasDynamicDisplayed = $('.custom-field-displayed:checked').length > 0;
            if (!hasLegacyDisplayed && !hasDynamicDisplayed) {
                throw new Error(lang('at_least_one_field'));
            }

            const hasLegacyRequired = $('.require-switch:checked').length > 0;
            const hasDynamicRequired = $('.custom-field-required:checked').length > 0;
            if (!hasLegacyRequired && !hasDynamicRequired) {
                throw new Error(lang('at_least_one_field_required'));
            }

            return false;
        } catch (error) {
            App.Layouts.Backend.displayNotification(error.message);
            return true;
        }
    }

    function deserialize(settings) {
        settings.forEach((setting) => {
            const $field = $('[data-field="' + setting.name + '"]');

            if ($field.is(':checkbox')) {
                $field.prop('checked', Boolean(Number(setting.value)));
            } else {
                $field.val(setting.value);
            }
        });
    }

    function serialize() {
        const settings = [];

        $('[data-field]').each((index, field) => {
            const $field = $(field);

            settings.push({
                name: $field.data('field'),
                value: $field.is(':checkbox') ? Number($field.prop('checked')) : $field.val(),
            });
        });

        return settings;
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
        });

        const $label = $('<input/>', {
            type: 'text',
            class: 'form-control custom-field-label',
            placeholder: 'Label',
            value: field.label || '',
        });

        const $type = $('<select/>', {
            class: 'form-select custom-field-type',
        });

        customFieldTypeOptions.forEach((option) => {
            $('<option/>', {
                value: option.value,
                text: option.label,
                selected: option.value === fieldType,
            }).appendTo($type);
        });

        const $options = $('<textarea/>', {
            class: 'form-control custom-field-options',
            rows: 4,
            placeholder: 'Options (one per line)',
            value: formatOptions(options),
        });

        const $displaySwitch = $('<input/>', {
            type: 'checkbox',
            class: 'form-check-input custom-field-displayed',
            checked: Boolean(Number(field.is_displayed)),
        });

        const $requireSwitch = $('<input/>', {
            type: 'checkbox',
            class: 'form-check-input custom-field-required',
            checked: Boolean(Number(field.is_required)),
        });

        const $top = $('<div/>', { class: 'd-flex align-items-start gap-3' });
        const $labelGroup = $('<div/>', { class: 'flex-grow-1' });
        const $row = $('<div/>', { class: 'd-flex gap-2' });
        const $switches = $('<div/>', { class: 'd-flex gap-3 mt-2' });

        $labelGroup.append($label);
        $row.append($type);

        if (fieldTypeRequiresOptions(fieldType)) {
            $row.append($options);
        }

        const $displayWrap = $('<label/>', { class: 'form-check d-flex align-items-center gap-2' });
        $displayWrap.append($displaySwitch, $('<span/>', { text: 'Display' }));

        const $requireWrap = $('<label/>', { class: 'form-check d-flex align-items-center gap-2' });
        $requireWrap.append($requireSwitch, $('<span/>', { text: 'Required' }));

        $switches.append($displayWrap, $requireWrap);

        const $actions = $('<div/>', { class: 'd-flex align-items-center gap-2' });
        const $duplicate = $('<button/>', {
            type: 'button',
            class: 'btn btn-outline-secondary btn-sm custom-field-duplicate',
            text: 'Duplicate',
        });
        const $remove = $('<button/>', {
            type: 'button',
            class: 'btn btn-outline-danger btn-sm custom-field-remove',
            text: 'Remove',
        });

        $actions.append($duplicate, $remove);

        $top.append($handle, $labelGroup, $actions);

        $card.append($top, $row, $switches);

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

    function applyInitialState() {
        $customerProfilesSettings.find('.display-switch').each((index, displaySwitchEl) => {
            updateDisplaySwitch($(displaySwitchEl));
        });

        $customerProfilesSettings.find('.require-switch').each((index, requireSwitchEl) => {
            updateRequireSwitch($(requireSwitchEl));
        });
    }

    function onSaveSettingsClick() {
        if (isInvalid()) {
            return;
        }

        const settings = serialize();
        const customFields = serializeCustomFields();

        writeDebug(`debug: saving settings (${settings.length}) fields (${customFields.length})`);

        App.Http.CustomerProfilesSettings.save(settings, customFields)
            .done(() => {
                App.Layouts.Backend.displayNotification(lang('settings_saved'));
                writeDebug('debug: save success');
            })
            .fail((xhr) => {
                const message = xhr?.responseJSON?.message || xhr?.responseText || 'unknown error';
                writeDebug(`debug: save failed ${message}`);
            });
    }

    function onDisplaySwitchClick(event) {
        updateDisplaySwitch($(event.target));
    }

    function onRequireSwitchClick(event) {
        updateRequireSwitch($(event.target));
    }

    function onDynamicDisplaySwitchClick(event) {
        updateDynamicDisplaySwitch($(event.target));
    }

    function onDynamicRequireSwitchClick(event) {
        updateDynamicRequireSwitch($(event.target));
    }

    function onAddCustomFieldClick() {
        const $list = getCustomFieldsList();
        if (!$list.length) {
            writeDebug('debug: custom fields list not found');
            return;
        }
        $list.append(createCustomFieldCard());
    }

    function enableCustomFieldDragAndDrop() {
        const $list = getCustomFieldsList();
        if (!$list.length || typeof $list.sortable !== 'function') {
            return;
        }
        $list.sortable({
            handle: '.custom-field-handle',
            axis: 'y',
            placeholder: 'custom-field-placeholder',
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

    let hasInitialized = false;

    function initialize() {
        if (hasInitialized) {
            return;
        }
        hasInitialized = true;
        refreshSelectors();
        const settings = vars('customer_profile_settings');
        writeDebug('debug: customer_profiles_settings.js initialize start');

        $saveSettings.off('click').on('click', onSaveSettingsClick);
        $addCustomField.off('click').on('click', onAddCustomFieldClick);
        $customerProfilesSettings
            .off('click', '.display-switch', onDisplaySwitchClick)
            .off('click', '.require-switch', onRequireSwitchClick)
            .off('click', '.custom-field-displayed', onDynamicDisplaySwitchClick)
            .off('click', '.custom-field-required', onDynamicRequireSwitchClick)
            .on('click', '.display-switch', onDisplaySwitchClick)
            .on('click', '.require-switch', onRequireSwitchClick)
            .on('click', '.custom-field-displayed', onDynamicDisplaySwitchClick)
            .on('click', '.custom-field-required', onDynamicRequireSwitchClick);

        deserialize(settings || []);
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
            writeDebug('debug: customer_profiles_settings.js loaded');
            try {
                initialize();
            } catch (error) {
                writeDebug(`debug: customer_profiles_settings.js error: ${error?.message || error}`);
                throw error;
            }
        });
    } else {
        writeDebug('debug: customer_profiles_settings.js loaded (late)');
        try {
            initialize();
        } catch (error) {
            writeDebug(`debug: customer_profiles_settings.js error: ${error?.message || error}`);
            throw error;
        }
    }

    return {
        initialize,
    };
})();
