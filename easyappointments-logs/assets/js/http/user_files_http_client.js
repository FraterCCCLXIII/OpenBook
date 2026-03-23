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
 * User files HTTP client.
 *
 * This module implements the user file related HTTP requests.
 */
App.Http.UserFiles = (function () {
    /**
     * List files for a user.
     *
     * @param {Number} userId
     * @param {String} userType
     *
     * @return {Object}
     */
    function list(userId, userType) {
        const url = App.Utils.Url.siteUrl('user_files/list_files');

        const data = {
            csrf_token: vars('csrf_token'),
            user_id: userId,
            user_type: userType,
        };

        return $.post(url, data);
    }

    /**
     * Upload a file for a user.
     *
     * @param {Number} userId
     * @param {String} userType
     * @param {File} file
     *
     * @return {Object}
     */
    function upload(userId, userType, file, options = {}) {
        const url = App.Utils.Url.siteUrl('user_files/upload');
        const formData = new FormData();

        formData.append('csrf_token', vars('csrf_token'));
        formData.append('user_id', userId);
        formData.append('user_type', userType);
        formData.append('file', file);

        return $.ajax({
            url,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            xhr: () => {
                const xhr = new window.XMLHttpRequest();
                if (xhr.upload && typeof options.onProgress === 'function') {
                    xhr.upload.addEventListener('progress', (event) => {
                        if (event.lengthComputable) {
                            options.onProgress({
                                loaded: event.loaded,
                                total: event.total,
                                percent: Math.round((event.loaded / event.total) * 100),
                            });
                        }
                    });
                }
                return xhr;
            },
        });
    }

    /**
     * Delete a file.
     *
     * @param {Number} fileId
     *
     * @return {Object}
     */
    function remove(fileId) {
        const url = App.Utils.Url.siteUrl('user_files/delete');

        const data = {
            csrf_token: vars('csrf_token'),
            file_id: fileId,
        };

        return $.post(url, data);
    }

    return {
        list,
        upload,
        remove,
    };
})();
