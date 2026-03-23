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
 * Account HTTP client.
 *
 * This module implements the account related HTTP requests.
 */
App.Http.Account = (function () {
    /**
     * Save account.
     *
     * @param {Object} account
     *
     * @return {Object}
     */
    function save(account) {
        const url = App.Utils.Url.siteUrl('account/save');

        const data = {
            csrf_token: vars('csrf_token'),
            account,
        };

        return $.post(url, data);
    }

    /**
     * Validate username.
     *
     * @param {Number} userId
     * @param {String} username
     *
     * @return {Object}
     */
    function validateUsername(userId, username) {
        const url = App.Utils.Url.siteUrl('account/validate_username');

        const data = {
            csrf_token: vars('csrf_token'),
            user_id: userId,
            username,
        };

        return $.post(url, data);
    }

    /**
     * Save provider service areas.
     *
     * @param {Array} serviceAreaZipIds
     *
     * @return {Object}
     */
    function saveServiceAreas(serviceAreaZipIds) {
        const url = App.Utils.Url.siteUrl('account/save_service_areas');

        const data = {
            csrf_token: vars('csrf_token'),
            service_area_zip_ids: serviceAreaZipIds,
        };

        return $.post(url, data);
    }

    /**
     * Save provider availability.
     *
     * @param {String} workingPlan
     * @param {String} workingPlanExceptions
     *
     * @return {Object}
     */
    function saveAvailability(workingPlan, workingPlanExceptions) {
        const url = App.Utils.Url.siteUrl('account/save_availability');

        const data = {
            csrf_token: vars('csrf_token'),
            working_plan: workingPlan,
            working_plan_exceptions: workingPlanExceptions,
        };

        return $.post(url, data);
    }

    return {
        save,
        validateUsername,
        saveServiceAreas,
        saveAvailability,
    };
})();
