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
 * Customer login settings HTTP client.
 *
 * This module implements the customer login settings related HTTP requests.
 */
App.Http.CustomerLoginSettings = (function () {
    /**
     * Save customer login settings.
     *
     * @param {Object[]} customerLoginSettings
     *
     * @return {Object}
     */
    function save(customerLoginSettings) {
        const url = App.Utils.Url.siteUrl('customer_login_settings/save');

        const data = {
            csrf_token: vars('csrf_token'),
            customer_login_settings: customerLoginSettings,
        };

        return $.post(url, data);
    }

    return {
        save,
    };
})();
