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
 * Customer profiles settings HTTP client.
 *
 * This module implements the customer profile settings related HTTP requests.
 */
App.Http.CustomerProfilesSettings = (function () {
    function save(settings, customFields = []) {
        const url = App.Utils.Url.siteUrl('customer_profiles_settings/save');

        const data = {
            csrf_token: vars('csrf_token'),
            customer_profile_settings: settings,
            custom_fields: customFields,
        };

        return $.post(url, data);
    }

    return {
        save,
    };
})();
