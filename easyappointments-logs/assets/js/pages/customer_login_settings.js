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
 * Customer login settings page.
 *
 * This module implements the functionality of the customer login settings page.
 */
App.Pages.CustomerLoginSettings = (function () {
    const $saveSettings = $('#save-settings');

    function deserialize(settings) {
        settings.forEach((setting) => {
            if (setting.name !== 'customer_login_mode') {
                return;
            }

            const $field = $('[data-field="' + setting.name + '"]');
            $field.filter('[value="' + setting.value + '"]').prop('checked', true);
        });
    }

    function serialize() {
        const customerLoginSettings = [];

        $('[data-field]').each((index, field) => {
            const $field = $(field);

            if ($field.is(':radio') && !$field.prop('checked')) {
                return;
            }

            customerLoginSettings.push({
                name: $field.data('field'),
                value: $field.val(),
            });
        });

        return customerLoginSettings;
    }

    function onSaveSettingsClick() {
        const customerLoginSettings = serialize();

        App.Http.CustomerLoginSettings.save(customerLoginSettings).done(() => {
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

        const settings = vars('customer_login_settings');
        deserialize(settings);

        if ($('[data-field="customer_login_mode"]:checked').length === 0) {
            $('#customer-login-mode-password').prop('checked', true);
        }
    }

    document.addEventListener('DOMContentLoaded', initialize);

    return {};
})();
