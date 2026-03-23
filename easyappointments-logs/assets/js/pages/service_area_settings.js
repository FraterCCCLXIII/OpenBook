/* ----------------------------------------------------------------------------
 * Easy!Appointments - Online Appointment Scheduler
 *
 * @package     EasyAppointments
 * @author      A.Tselegidis <alextselegidis@gmail.com>
 * @copyright   Copyright (c) Alex Tselegidis
 * @license     https://easyappointments.org
 * @since       v1.5.0
 * ---------------------------------------------------------------------------- */

/**
 * Service area settings page.
 *
 * This module implements the functionality of the service area settings page.
 */
App.Pages.ServiceAreaSettings = (function () {
    const $saveSettings = $('#save-settings');
    const $zipLines = $('#service-area-zips');
    const $defaultCountry = $('#default-service-area-country');

    function deserialize() {
        const lines = vars('service_area_zip_lines') || [];
        $zipLines.val(Array.isArray(lines) ? lines.join('\n') : '');
        $defaultCountry.val(vars('default_service_area_country') || 'US');
    }

    function serialize() {
        const raw = $zipLines.val() || '';
        const lines = raw
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line.length);

        return {
            service_area_zip_lines: lines,
            default_service_area_country: ($defaultCountry.val() || '').trim(),
        };
    }

    function onSaveSettingsClick() {
        const payload = serialize();

        App.Http.ServiceAreaSettings.save(payload).done(() => {
            App.Layouts.Backend.displayNotification(lang('settings_saved'), [
                {
                    label: lang('reload'),
                    function: () => window.location.reload(),
                },
            ]);
        });
    }

    function initialize() {
        $saveSettings.on('click', onSaveSettingsClick);
        deserialize();
    }

    document.addEventListener('DOMContentLoaded', initialize);

    return {};
})();
