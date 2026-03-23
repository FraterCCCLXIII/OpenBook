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
 * Forms HTTP client.
 *
 * This module implements the forms related HTTP requests.
 */
App.Http.Forms = (function () {
    function list() {
        const url = App.Utils.Url.siteUrl('forms/list');
        return $.post(url, { csrf_token: vars('csrf_token') });
    }

    function find(formId) {
        const url = App.Utils.Url.siteUrl('forms/find');
        return $.post(url, { csrf_token: vars('csrf_token'), form_id: formId });
    }

    function save(form) {
        const url = App.Utils.Url.siteUrl('forms/save');
        return $.post(url, { csrf_token: vars('csrf_token'), form });
    }

    function remove(formId) {
        const url = App.Utils.Url.siteUrl('forms/delete');
        return $.post(url, { csrf_token: vars('csrf_token'), form_id: formId });
    }

    function listForUser() {
        const url = App.Utils.Url.siteUrl('forms/list_for_user');
        return $.post(url, { csrf_token: vars('csrf_token') });
    }

    function listForRecord(userId, userType) {
        const url = App.Utils.Url.siteUrl('forms/list_for_record');
        return $.post(url, { csrf_token: vars('csrf_token'), user_id: userId, user_type: userType });
    }

    function findForUser(formId) {
        const url = App.Utils.Url.siteUrl('forms/find_for_user');
        return $.post(url, { csrf_token: vars('csrf_token'), form_id: formId });
    }

    function submit(formId, responses) {
        const url = App.Utils.Url.siteUrl('forms/submit');
        return $.post(url, { csrf_token: vars('csrf_token'), form_id: formId, responses });
    }

    function resetSubmission(formId, userId, userType) {
        const url = App.Utils.Url.siteUrl('forms/reset_submission');
        return $.post(url, {
            csrf_token: vars('csrf_token'),
            form_id: formId,
            user_id: userId,
            user_type: userType,
        });
    }

    function sendReminder(userId, userType) {
        const url = App.Utils.Url.siteUrl('forms/send_reminder');
        return $.post(url, {
            csrf_token: vars('csrf_token'),
            user_id: userId,
            user_type: userType,
        });
    }

    function findForRecord(formId, userId, userType) {
        const url = App.Utils.Url.siteUrl('forms/find_for_record');
        return $.post(url, {
            csrf_token: vars('csrf_token'),
            form_id: formId,
            user_id: userId,
            user_type: userType,
        });
    }

    return {
        list,
        find,
        save,
        remove,
        listForUser,
        listForRecord,
        findForUser,
        findForRecord,
        submit,
        resetSubmission,
        sendReminder,
    };
})();
