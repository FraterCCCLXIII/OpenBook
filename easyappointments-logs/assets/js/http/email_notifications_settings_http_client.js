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
 * Email Notifications Settings HTTP client.
 *
 * This module implements the email notification settings related HTTP requests.
 */
App.Http.EmailNotificationsSettings = (function () {
    /**
     * Save email notification settings.
     *
     * @param {Object} emailNotificationSettings
     *
     * @return {Object}
     */
    function save(emailNotificationSettings) {
        const url = App.Utils.Url.siteUrl('email_notifications_settings/save');

        const data = {
            csrf_token: vars('csrf_token'),
            email_notification_settings: emailNotificationSettings,
        };

        return $.post(url, data);
    }

    return {
        save,
    };
})();
