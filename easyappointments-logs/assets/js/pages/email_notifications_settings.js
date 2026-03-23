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
 * Email Notifications settings page.
 *
 * This module implements the functionality of the email notifications settings page.
 */
App.Pages.EmailNotificationsSettings = (function () {
    const $saveSettings = $('#save-settings');

    function deserialize(settings) {
        settings.forEach((setting) => {
            const $field = $('[data-field="' + setting.name + '"]');

            if (!$field.length) {
                return;
            }

            if ($field.is(':checkbox')) {
                $field.prop('checked', Boolean(Number(setting.value)));
            } else {
                $field.val(setting.value);
            }
        });
    }

    function serialize() {
        const emailNotificationSettings = [];

        $('[data-field]').each((index, field) => {
            const $field = $(field);

            emailNotificationSettings.push({
                name: $field.data('field'),
                value: $field.is(':checkbox') ? Number($field.prop('checked')) : $field.val(),
            });
        });

        return emailNotificationSettings;
    }

    function onSaveSettingsClick() {
        const emailNotificationSettings = serialize();

        App.Http.EmailNotificationsSettings.save(emailNotificationSettings).done(() => {
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

        const settings = vars('email_notification_settings');
        deserialize(Array.isArray(settings) ? settings : []);
    }

    document.addEventListener('DOMContentLoaded', initialize);

    return {};
})();
