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
 * General settings page.
 *
 * This module implements the functionality of the general settings page.
 */
App.Pages.GeneralSettings = (function () {
    const $saveSettings = $('#save-settings');
    const $companyLogo = $('#company-logo');
    const $companyLogoPreview = $('#company-logo-preview');
    const $companyLogoEmailPreview = $('#company-logo-email-preview');
    const $companyLogoEmailPreviewWrapper = $('#company-logo-email-preview-wrapper');
    const $removeCompanyLogo = $('#remove-company-logo');
    const $companyColor = $('#company-color');
    const $resetCompanyColor = $('#reset-company-color');
    let companyLogoBase64 = '';
    let companyLogoEmailBase64 = '';

    /**
     * Check if the form has invalid values.
     *
     * @return {Boolean}
     */
    function isInvalid() {
        try {
            $('#general-settings .is-invalid').removeClass('is-invalid');

            // Validate required fields.

            let missingRequiredFields = false;

            $('#general-settings .required').each((index, requiredField) => {
                const $requiredField = $(requiredField);

                if (!$requiredField.val()) {
                    $requiredField.addClass('is-invalid');
                    missingRequiredFields = true;
                }
            });

            if (missingRequiredFields) {
                throw new Error(lang('fields_are_required'));
            }

            return false;
        } catch (error) {
            App.Layouts.Backend.displayNotification(error.message);
            return true;
        }
    }

    function deserialize(generalSettings) {
        let hasCompanyLogo = false;
        generalSettings.forEach((generalSetting) => {
            if (generalSetting.name === 'company_logo' && generalSetting.value) {
                companyLogoBase64 = generalSetting.value;
                $companyLogoPreview.attr('src', generalSetting.value);
                $companyLogoPreview.prop('hidden', false);
                $removeCompanyLogo.prop('hidden', false);
                hasCompanyLogo = true;
                return;
            }

            if (generalSetting.name === 'company_logo_email_png' && generalSetting.value) {
                companyLogoEmailBase64 = generalSetting.value;
                $companyLogoEmailPreview.attr('src', generalSetting.value);
                $companyLogoEmailPreviewWrapper.prop('hidden', false);
                return;
            }

            if (generalSetting.name === 'company_color' && generalSetting.value !== '#ffffff') {
                $resetCompanyColor.prop('hidden', false);
            }

            const $field = $('[data-field="' + generalSetting.name + '"]');

            $field.is(':checkbox')
                ? $field.prop('checked', Boolean(Number(generalSetting.value)))
                : $field.val(generalSetting.value);
        });

        if (!hasCompanyLogo) {
            companyLogoEmailBase64 = '';
            $companyLogoEmailPreview.attr('src', '#');
            $companyLogoEmailPreviewWrapper.prop('hidden', true);
        }
    }

    function serialize() {
        const generalSettings = [];

        $('[data-field]').each((index, field) => {
            const $field = $(field);

            generalSettings.push({
                name: $field.data('field'),
                value: $field.is(':checkbox') ? Number($field.prop('checked')) : $field.val(),
            });
        });

        generalSettings.push({
            name: 'company_logo',
            value: companyLogoBase64,
        });

        generalSettings.push({
            name: 'company_logo_email_png',
            value: companyLogoEmailBase64,
        });

        return generalSettings;
    }

    /**
     * Save the account information.
     */
    function onSaveSettingsClick() {
        if (isInvalid()) {
            App.Layouts.Backend.displayNotification(lang('settings_are_invalid'));
            return;
        }

        const generalSettings = serialize();

        App.Http.GeneralSettings.save(generalSettings).done(() => {
            App.Layouts.Backend.displayNotification(lang('settings_saved'), [
                {
                    label: lang('reload'), // Reload Page
                    function: () => window.location.reload(),
                },
            ]);
        });
    }

    /**
     * Convert the selected image to a base64 encoded string.
     */
    function onCompanyLogoChange() {
        const file = $companyLogo[0].files[0];

        if (!file) {
            $removeCompanyLogo.trigger('click');
            return;
        }

        App.Utils.File.toBase64(file).then((base64) => {
            companyLogoBase64 = base64;
            $companyLogoPreview.attr('src', base64);
            $companyLogoPreview.prop('hidden', false);
            $removeCompanyLogo.prop('hidden', false);

            if (isSvgDataUrl(base64)) {
                generateEmailPng(base64)
                    .then((pngBase64) => {
                        if (!pngBase64) {
                            throw new Error('Empty PNG');
                        }
                        companyLogoEmailBase64 = pngBase64;
                        $companyLogoEmailPreview.attr('src', pngBase64);
                        $companyLogoEmailPreviewWrapper.prop('hidden', false);
                    })
                    .catch(() => {
                        companyLogoEmailBase64 = '';
                        $companyLogoEmailPreview.attr('src', '#');
                        $companyLogoEmailPreviewWrapper.prop('hidden', true);
                    });
            } else {
                companyLogoEmailBase64 = '';
                $companyLogoEmailPreview.attr('src', '#');
                $companyLogoEmailPreviewWrapper.prop('hidden', true);
            }
        });
    }

    /**
     * Remove the company logo data.
     */
    function onRemoveCompanyLogoClick() {
        companyLogoBase64 = '';
        companyLogoEmailBase64 = '';
        $companyLogo.val('');
        $companyLogoPreview.attr('src', '#');
        $companyLogoPreview.prop('hidden', true);
        $companyLogoEmailPreview.attr('src', '#');
        $companyLogoEmailPreviewWrapper.prop('hidden', true);
        $removeCompanyLogo.prop('hidden', true);
    }

    function isSvgDataUrl(value) {
        return typeof value === 'string' && value.startsWith('data:image/svg+xml');
    }

    function extractSvgPayload(svgDataUrl) {
        const parts = svgDataUrl.split(',');
        if (parts.length < 2) {
            return null;
        }
        const header = parts[0];
        const data = parts.slice(1).join(',');
        if (header.includes(';base64')) {
            try {
                return atob(data);
            } catch (error) {
                return null;
            }
        }
        try {
            return decodeURIComponent(data);
        } catch (error) {
            return null;
        }
    }

    function parseSvgSize(svgText) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgText, 'image/svg+xml');
            const svg = doc.querySelector('svg');
            if (!svg) {
                return null;
            }
            const widthAttr = svg.getAttribute('width');
            const heightAttr = svg.getAttribute('height');
            if (widthAttr && heightAttr) {
                const width = parseFloat(widthAttr);
                const height = parseFloat(heightAttr);
                if (width && height) {
                    return { width, height };
                }
            }
            const viewBox = svg.getAttribute('viewBox');
            if (viewBox) {
                const parts = viewBox.split(/\s+|,/).map((value) => parseFloat(value));
                if (parts.length === 4 && parts[2] && parts[3]) {
                    return { width: parts[2], height: parts[3] };
                }
            }
        } catch (error) {
            return null;
        }
        return null;
    }

    function generateEmailPng(svgDataUrl) {
        return new Promise((resolve, reject) => {
            const svgText = extractSvgPayload(svgDataUrl);
            if (!svgText) {
                reject(new Error('Invalid SVG data'));
                return;
            }
            const size = parseSvgSize(svgText) || { width: 512, height: 512 };
            const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
            const blobUrl = URL.createObjectURL(blob);
            const image = new Image();
            image.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = size.width;
                canvas.height = size.height;
                const context = canvas.getContext('2d');
                if (!context) {
                    URL.revokeObjectURL(blobUrl);
                    reject(new Error('Canvas not supported'));
                    return;
                }
                context.drawImage(image, 0, 0, size.width, size.height);
                URL.revokeObjectURL(blobUrl);
                resolve(canvas.toDataURL('image/png'));
            };
            image.onerror = () => {
                URL.revokeObjectURL(blobUrl);
                reject(new Error('Failed to load SVG'));
            };
            image.src = blobUrl;
        });
    }

    /**
     * Toggle the reset company color button.
     */
    function onCompanyColorChange() {
        $resetCompanyColor.prop('hidden', $companyColor.val() === '#ffffff');
    }

    /**
     * Set the company color value to "#ffffff" which is the default one.
     */
    function onResetCompanyColorClick() {
        $companyColor.val('#ffffff');
    }

    /**
     * Initialize the module.
     */
    function initialize() {
        $saveSettings.on('click', onSaveSettingsClick);

        $companyLogo.on('change', onCompanyLogoChange);

        $removeCompanyLogo.on('click', onRemoveCompanyLogoClick);

        $companyColor.on('change', onCompanyColorChange);

        $resetCompanyColor.on('click', onResetCompanyColorClick);

        const generalSettings = vars('general_settings');

        deserialize(generalSettings);

        if (companyLogoBase64 && isSvgDataUrl(companyLogoBase64) && !companyLogoEmailBase64) {
            generateEmailPng(companyLogoBase64)
                .then((pngBase64) => {
                    if (!pngBase64) {
                        throw new Error('Empty PNG');
                    }
                    companyLogoEmailBase64 = pngBase64;
                    $companyLogoEmailPreview.attr('src', pngBase64);
                    $companyLogoEmailPreviewWrapper.prop('hidden', false);
                })
                .catch(() => {
                    companyLogoEmailBase64 = '';
                    $companyLogoEmailPreview.attr('src', '#');
                    $companyLogoEmailPreviewWrapper.prop('hidden', true);
                });
        }
    }

    document.addEventListener('DOMContentLoaded', initialize);

    return {};
})();
