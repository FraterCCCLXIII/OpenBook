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
 * Customers HTTP client.
 *
 * This module implements the customers related HTTP requests.
 */
App.Http.Customers = (function () {
    /**
     * Save (create or update) a customer.
     *
     * @param {Object} customer
     *
     * @return {Object}
     */
    function save(customer, customFields = {}) {
        return customer.id ? update(customer, customFields) : store(customer, customFields);
    }

    /**
     * Create a customer.
     *
     * @param {Object} customer
     *
     * @return {Object}
     */
    function store(customer, customFields = {}) {
        const url = App.Utils.Url.siteUrl('customers/store');

        const data = {
            csrf_token: vars('csrf_token'),
            customer: customer,
            custom_fields: customFields,
        };

        return $.post(url, data);
    }

    /**
     * Update a customer.
     *
     * @param {Object} customer
     *
     * @return {Object}
     */
    function update(customer, customFields = {}) {
        const url = App.Utils.Url.siteUrl('customers/update');

        const data = {
            csrf_token: vars('csrf_token'),
            customer: customer,
            custom_fields: customFields,
        };

        return $.post(url, data);
    }

    /**
     * Delete a customer.
     *
     * @param {Number} customerId
     *
     * @return {Object}
     */
    function destroy(customerId) {
        const url = App.Utils.Url.siteUrl('customers/destroy');

        const data = {
            csrf_token: vars('csrf_token'),
            customer_id: customerId,
        };

        return $.post(url, data);
    }

    /**
     * Search customers by keyword.
     *
     * @param {String} keyword
     * @param {Number} [limit]
     * @param {Number} [offset]
     * @param {String} [orderBy]
     *
     * @return {Object}
     */
    function search(keyword, limit = null, offset = null, orderBy = null) {
        const url = App.Utils.Url.siteUrl('customers/search');

        const data = {
            csrf_token: vars('csrf_token'),
            keyword,
            limit,
            offset,
            order_by: orderBy || undefined,
        };

        return $.post(url, data);
    }

    /**
     * Find a customer.
     *
     * @param {Number} customerId
     *
     * @return {Object}
     */
    function find(customerId) {
        const url = App.Utils.Url.siteUrl('customers/find');

        const data = {
            csrf_token: vars('csrf_token'),
            customer_id: customerId,
        };

        return $.post(url, data);
    }

    /**
     * Find a customer by slug.
     *
     * @param {String} slug
     *
     * @return {Object}
     */
    function findBySlug(slug) {
        const url = App.Utils.Url.siteUrl('customers/find_by_slug');

        const data = {
            csrf_token: vars('csrf_token'),
            slug,
        };

        return $.post(url, data);
    }

    /**
     * Get customer visit notes (appointment notes).
     *
     * @param {Number} customerId
     *
     * @return {Object}
     */
    function visitNotes(customerId) {
        const url = App.Utils.Url.siteUrl('customers/visit_notes');

        const data = {
            csrf_token: vars('csrf_token'),
            customer_id: customerId,
        };

        return $.post(url, data);
    }

    /**
     * Get customer notes.
     *
     * @param {Number} customerId
     *
     * @return {Object}
     */
    function notes(customerId) {
        const url = App.Utils.Url.siteUrl('customers/notes');

        const data = {
            csrf_token: vars('csrf_token'),
            customer_id: customerId,
        };

        return $.post(url, data);
    }

    /**
     * Get customer alerts.
     *
     * @param {Number} customerId
     *
     * @return {Object}
     */
    function alerts(customerId) {
        const url = App.Utils.Url.siteUrl('customers/alerts');

        const data = {
            csrf_token: vars('csrf_token'),
            customer_id: customerId,
        };

        return $.post(url, data);
    }

    /**
     * Create a customer note.
     *
     * @param {Object} note
     *
     * @return {Object}
     */
    function storeNote(note) {
        const url = App.Utils.Url.siteUrl('customers/store_note');

        const data = {
            csrf_token: vars('csrf_token'),
            note,
        };

        return $.post(url, data);
    }

    /**
     * Create a customer alert.
     *
     * @param {Object} alert
     *
     * @return {Object}
     */
    function storeAlert(alert) {
        const url = App.Utils.Url.siteUrl('customers/store_alert');

        const data = {
            csrf_token: vars('csrf_token'),
            alert,
        };

        return $.post(url, data);
    }

    /**
     * Update a customer note.
     *
     * @param {Object} note
     *
     * @return {Object}
     */
    function updateNote(note) {
        const url = App.Utils.Url.siteUrl('customers/update_note');

        const data = {
            csrf_token: vars('csrf_token'),
            note,
        };

        return $.post(url, data);
    }

    /**
     * Update a customer alert.
     *
     * @param {Object} alert
     *
     * @return {Object}
     */
    function updateAlert(alert) {
        const url = App.Utils.Url.siteUrl('customers/update_alert');

        const data = {
            csrf_token: vars('csrf_token'),
            alert,
        };

        return $.post(url, data);
    }

    /**
     * Delete a customer note.
     *
     * @param {Number} noteId
     *
     * @return {Object}
     */
    function deleteNote(noteId) {
        const url = App.Utils.Url.siteUrl('customers/delete_note');

        const data = {
            csrf_token: vars('csrf_token'),
            note_id: noteId,
        };

        return $.post(url, data);
    }

    /**
     * Delete a customer alert.
     *
     * @param {Number} alertId
     *
     * @return {Object}
     */
    function deleteAlert(alertId) {
        const url = App.Utils.Url.siteUrl('customers/delete_alert');

        const data = {
            csrf_token: vars('csrf_token'),
            alert_id: alertId,
        };

        return $.post(url, data);
    }

    return {
        save,
        store,
        update,
        destroy,
        search,
        find,
        findBySlug,
        notes,
        alerts,
        visitNotes,
        storeNote,
        storeAlert,
        updateNote,
        updateAlert,
        deleteNote,
        deleteAlert,
    };
})();
