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
 * HTTP requests utility.
 *
 * This module implements the functionality of HTTP requests.
 */
window.App.Utils.Http = (function () {
    let latestCsrfToken = null;

    /**
     * Read the current CSRF token from cookie (falls back to server vars).
     *
     * @return {String|null}
     */
    function getCsrfToken() {
        const cookieToken = document.cookie
            .split('; ')
            .find((cookie) => cookie.startsWith('csrf_cookie='))
            ?.split('=')[1];

        if (cookieToken) {
            latestCsrfToken = decodeURIComponent(cookieToken);
            return latestCsrfToken;
        }

        if (!latestCsrfToken && typeof vars === 'function') {
            latestCsrfToken = vars('csrf_token') || null;
        }

        return latestCsrfToken;
    }

    /**
     * Build standard request headers including CSRF.
     *
     * @param {Boolean} includeJsonContentType
     *
     * @return {Object}
     */
    function buildHeaders(includeJsonContentType = true) {
        const headers = {};
        const csrfToken = getCsrfToken();

        if (includeJsonContentType) {
            headers['Content-Type'] = 'application/json';
        }

        if (csrfToken) {
            headers['X-CSRF'] = csrfToken;
        }

        return headers;
    }

    /**
     * Store the latest CSRF token from response headers.
     *
     * @param {Response} response
     */
    function syncCsrfToken(response) {
        const headerToken = response.headers.get('X-CSRF-TOKEN');
        if (headerToken) {
            latestCsrfToken = headerToken;
        }
    }

    /**
     * Convert non-ok responses to rich errors without reading body twice.
     *
     * @param {Response} response
     *
     * @return {Promise<void>}
     */
    async function ensureOk(response) {
        syncCsrfToken(response);

        if (response.ok) {
            return;
        }

        const message = await response.text();
        const error = new Error(message || `HTTP ${response.status}`);
        error.status = response.status;
        throw error;
    }

    /**
     * Perform an HTTP request.
     *
     * @param {String} method
     * @param {String} url
     * @param {Object} data
     *
     * @return {Promise}
     */
    function request(method, url, data) {
        return new Promise((resolve, reject) => {
            fetch(App.Utils.Url.siteUrl(url), {
                method,
                mode: 'cors',
                credentials: 'same-origin',
                headers: buildHeaders(true),
                redirect: 'follow',
                referrer: 'no-referrer',
                body: data ? JSON.stringify(data) : undefined,
            })
                .then(async (response) => {
                    await ensureOk(response);
                    return response;
                })
                .then((response) => {
                    return response.json();
                })
                .then((json) => {
                    resolve(json);
                })
                .catch((error) => {
                    console.error(error);
                    reject(error);
                });
        });
    }

    /**
     * Upload the provided file.
     *
     * @param {String} method
     * @param {String} url
     * @param {File} file
     *
     * @return {Promise}
     */
    function upload(method, url, file) {
        const formData = new FormData();

        formData.append('file', file, file.name);

        return new Promise((resolve, reject) => {
            fetch(App.Utils.Url.siteUrl(url), {
                method,
                headers: buildHeaders(false),
                credentials: 'same-origin',
                redirect: 'follow',
                referrer: 'no-referrer',
                body: formData,
            })
                .then(async (response) => {
                    await ensureOk(response);
                    return response;
                })
                .then((response) => {
                    return response.json();
                })
                .then((json) => {
                    resolve(json);
                })
                .catch((error) => {
                    console.error(error);
                    reject(error);
                });
        });
    }

    /**
     * Download the requested URL.
     *
     * @param {String} method
     * @param {String} url
     *
     * @return {Promise}
     */
    function download(method, url) {
        return new Promise((resolve, reject) => {
            fetch(App.Utils.Url.siteUrl(url), {
                method,
                mode: 'cors',
                credentials: 'same-origin',
                headers: buildHeaders(true),
                redirect: 'follow',
                referrer: 'no-referrer',
            })
                .then(async (response) => {
                    await ensureOk(response);
                    return response;
                })
                .then((response) => {
                    return response.arrayBuffer();
                })
                .then((json) => {
                    resolve(json);
                })
                .catch((error) => {
                    console.error(error);
                    reject(error);
                });
        });
    }

    return {
        request,
        upload,
        download,
    };
})();
