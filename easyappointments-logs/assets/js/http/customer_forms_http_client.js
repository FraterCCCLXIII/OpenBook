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
 * Customer forms HTTP client.
 *
 * This module implements the customer forms related HTTP requests.
 */
App.Http.CustomerForms = (function () {
    function list() {
        const url = App.Utils.Url.siteUrl('customer/forms/list');
        return $.post(url, { csrf_token: vars('csrf_token') });
    }

    function find(formId) {
        const url = App.Utils.Url.siteUrl('customer/forms/find');
        return $.post(url, { csrf_token: vars('csrf_token'), form_id: formId });
    }

    function submit(formId, responses) {
        const url = App.Utils.Url.siteUrl('customer/forms/submit');
        return $.post(url, { csrf_token: vars('csrf_token'), form_id: formId, responses });
    }

    return {
        list,
        find,
        submit,
    };
})();
