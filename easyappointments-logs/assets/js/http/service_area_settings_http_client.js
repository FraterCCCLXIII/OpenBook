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
 * Service Area Settings HTTP client.
 *
 * This module implements the service area settings related HTTP requests.
 */
App.Http.ServiceAreaSettings = (function () {
    /**
     * Save service area settings.
     *
     * @param {Object} payload
     *
     * @return {Object}
     */
    function save(payload) {
        const url = App.Utils.Url.siteUrl('service_area_settings/save');

        const data = {
            csrf_token: vars('csrf_token'),
            ...payload,
        };

        return $.post(url, data);
    }

    return {
        save,
    };
})();
