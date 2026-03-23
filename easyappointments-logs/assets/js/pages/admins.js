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
 * Admins page.
 *
 * This module implements the functionality of admins page.
 */
App.Pages.Admins = (function () {
    const $admins = $('#admins');
    const $id = $('#id');
    const $firstName = $('#first-name');
    const $lastName = $('#last-name');
    const $email = $('#email');
    const $mobileNumber = $('#mobile-number');
    const $phoneNumber = $('#phone-number');
    const $address = $('#address');
    const $city = $('#city');
    const $state = $('#state');
    const $zipCode = $('#zip-code');
    const $notes = $('#notes');
    const $language = $('#language');
    const $timezone = $('#timezone');
    const $ldapDn = $('#ldap-dn');
    const $username = $('#username');
    const $password = $('#password');
    const $passwordConfirmation = $('#password-confirm');
    const $notifications = $('#notifications');
    const $calendarView = $('#calendar-view');
    const $filterAdmins = $('#filter-admins');
    const $summaryName = $('#admin-summary-name');
    const $summaryEmail = $('#admin-summary-email');
    const $summaryPhone = $('#admin-summary-phone');
    const $summaryLocation = $('#admin-summary-location');
    const $adminFilesPanel = $('#admin-files-panel .user-files-panel');
    const $adminFormsPanel = $('#admin-forms-panel .user-forms-panel');
    let filterResults = {};
    let filterLimit = 20;
    let pendingSlug = null;
    let userFilesManager;
    let userFormsManager;

    function setRecordDetailsVisible(visible) {
        const $recordDetails = $admins.find('.record-details');

        if (visible) {
            $recordDetails.show();
        } else {
            $recordDetails.hide();
        }
    }

    function updateAdminSummary(record = null) {
        const firstName = record ? record.first_name : $firstName.val();
        const lastName = record ? record.last_name : $lastName.val();
        const email = record ? record.email : $email.val();
        const phoneNumber = record ? record.phone_number : $phoneNumber.val();
        const address = record ? record.address : $address.val();
        const city = record ? record.city : $city.val();
        const state = record ? record.state : $state.val();
        const zipCode = record ? record.zip_code : $zipCode.val();

        const nameParts = [firstName, lastName].filter(Boolean);
        const locationParts = [address, city, state, zipCode].filter(Boolean);

        $summaryName.text(nameParts.length ? nameParts.join(' ') : '—');
        $summaryEmail.find('.summary-text').text(email || '—');
        $summaryPhone.find('.summary-text').text(phoneNumber || '—');
        $summaryLocation.find('.summary-text').text(locationParts.length ? locationParts.join(', ') : '—');
    }

    /**
     * Add the page event listeners.
     */
    function addEventListeners() {
        /**
         * Event: Admin Username "Blur"
         *
         * When the admin leaves the username input field we will need to check if the username
         * is not taken by another record in the system.
         *
         * @param {jQuery.Event} event
         */
        $admins.on('blur', '#username', (event) => {
            const $input = $(event.currentTarget);

            if ($input.prop('readonly') === true || $input.val() === '') {
                return;
            }

            const adminId = $input.parents().eq(2).find('.record-id').val();

            if (!adminId) {
                return;
            }

            const username = $input.val();

            App.Http.Account.validateUsername(adminId, username).done((response) => {
                if (response.is_valid === 'false') {
                    $input.addClass('is-invalid');
                    $input.attr('already-exists', 'true');
                    $input.parents().eq(3).find('.form-message').text(lang('username_already_exists'));
                    $input.parents().eq(3).find('.form-message').show();
                } else {
                    $input.removeClass('is-invalid');
                    $input.attr('already-exists', 'false');
                    if ($input.parents().eq(3).find('.form-message').text() === lang('username_already_exists')) {
                        $input.parents().eq(3).find('.form-message').hide();
                    }
                }
            });
        });

        /**
         * Event: Filter Admins Form "Submit"
         *
         * Filter the admin records with the given key string.
         *
         * @param {jQuery.Event} event
         */
        $admins.on('submit', '#filter-admins form', (event) => {
            event.preventDefault();
            const key = $('#filter-admins .key').val();
            $('#filter-admins .selected').removeClass('selected');
            App.Pages.Admins.resetForm();
            App.Pages.Admins.filter(key);
        });

        /**
         * Event: Filter Admin Row "Click"
         *
         * Display the selected admin data to the user.
         */
        $admins.on('click', '.admin-row', (event) => {
            if ($('#filter-admins .filter').prop('disabled')) {
                $('#filter-admins .results').css('color', '#AAA');
                return; // exit because we are currently on edit mode
            }

            const adminId = $(event.currentTarget).attr('data-id');

            const admin = filterResults.find((filterResult) => Number(filterResult.id) === Number(adminId));

            App.Pages.Admins.display(admin);
            $('#filter-admins .selected').removeClass('selected');
            $(event.currentTarget).addClass('selected');
            $('#edit-admin, #delete-admin').prop('disabled', false);
            setRecordDetailsVisible(true);
            updateProfileUrl(admin?.slug);
        });

        /**
         * Event: Add New Admin Button "Click"
         */
        $admins.on('click', '#add-admin', () => {
            App.Pages.Admins.resetForm();
            setRecordDetailsVisible(true);
            $('#admin-actions-group').addClass('d-none').removeClass('d-flex');
            $('#admin-save-cancel-group').addClass('d-flex').removeClass('d-none');
            $admins.find('.record-details').find('input, select, textarea').prop('disabled', false);
            $admins.find('.record-details .form-label span').prop('hidden', false);
            $('#password, #password-confirm').addClass('required');
            $('#filter-admins button').prop('disabled', true);
            $('#filter-admins .results').css('color', '#AAA');
        });

        /**
         * Event: Edit Admin Button "Click"
         */
        $admins.on('click', '#edit-admin', () => {
            $('#admin-actions-group').addClass('d-none').removeClass('d-flex');
            $('#admin-save-cancel-group').addClass('d-flex').removeClass('d-none');
            $admins.find('.record-details').find('input, select, textarea').prop('disabled', false);
            $admins.find('.record-details .form-label span').prop('hidden', false);
            $('#password, #password-confirm').removeClass('required');
            $('#filter-admins button').prop('disabled', true);
            $('#filter-admins .results').css('color', '#AAA');
        });

        /**
         * Event: Delete Admin Button "Click"
         */
        $admins.on('click', '#delete-admin', () => {
            const adminId = $id.val();

            const buttons = [
                {
                    text: lang('cancel'),
                    click: (event, messageModal) => {
                        messageModal.hide();
                    },
                },
                {
                    text: lang('delete'),
                    click: (event, messageModal) => {
                        App.Pages.Admins.remove(adminId);
                        messageModal.hide();
                    },
                },
            ];

            App.Utils.Message.show(lang('delete_admin'), lang('delete_record_prompt'), buttons);
        });

        /**
         * Event: Save Admin Button "Click"
         */
        $admins.on('click', '#save-admin', () => {
            const admin = {
                first_name: $firstName.val(),
                last_name: $lastName.val(),
                email: $email.val(),
                mobile_number: $mobileNumber.val(),
                phone_number: $phoneNumber.val(),
                address: $address.val(),
                city: $city.val(),
                state: $state.val(),
                zip_code: $zipCode.val(),
                notes: $notes.val(),
                language: $language.val(),
                timezone: $timezone.val(),
                ldap_dn: $ldapDn.val(),
                settings: {
                    username: $username.val(),
                    notifications: Number($notifications.prop('checked')),
                    calendar_view: $calendarView.val(),
                },
            };

            // Include password if changed.
            if ($password.val() !== '') {
                admin.settings.password = $password.val();
            }

            // Include id if changed.
            if ($id.val() !== '') {
                admin.id = $id.val();
            }

            if (!App.Pages.Admins.validate()) {
                return;
            }

            App.Pages.Admins.save(admin);
        });

        /**
         * Event: Cancel Admin Button "Click"
         *
         * Cancel add or edit of an admin record.
         */
        $admins.on('click', '#cancel-admin', () => {
            const id = $id.val();

            App.Pages.Admins.resetForm();

            if (id) {
                App.Pages.Admins.select(id, true);
            }
        });
    }

    /**
     * Save admin record to database.
     *
     * @param {Object} admin Contains the admin record data. If an 'id' value is provided
     * then the update operation is going to be executed.
     */
    function save(admin) {
        App.Http.Admins.save(admin).then((response) => {
            App.Layouts.Backend.displayNotification(lang('admin_saved'));
            App.Pages.Admins.resetForm();
            $('#filter-admins .key').val('');
            App.Pages.Admins.filter('', response.id, true);
        });
    }

    /**
     * Delete an admin record from database.
     *
     * @param {Number} id Record id to be deleted.
     */
    function remove(id) {
        App.Http.Admins.destroy(id).then(() => {
            App.Layouts.Backend.displayNotification(lang('admin_deleted'));
            App.Pages.Admins.resetForm();
            App.Pages.Admins.filter($('#filter-admins .key').val());
        });
    }

    /**
     * Validates an admin record.
     *
     * @return {Boolean} Returns the validation result.
     */
    function validate() {
        $admins.find('.is-invalid').removeClass('is-invalid');

        try {
            // Validate required fields.
            let missingRequired = false;

            $admins.find('.required').each((index, requiredField) => {
                if (!$(requiredField).val()) {
                    $(requiredField).addClass('is-invalid');
                    missingRequired = true;
                }
            });

            if (missingRequired) {
                throw new Error(lang('fields_are_required'));
            }

            // Validate passwords.
            if ($password.val() !== $passwordConfirmation.val()) {
                $('#password, #password-confirm').addClass('is-invalid');
                throw new Error(lang('passwords_mismatch'));
            }

            if ($password.val().length < vars('min_password_length') && $password.val() !== '') {
                $('#password, #password-confirm').addClass('is-invalid');
                throw new Error(lang('password_length_notice').replace('$number', vars('min_password_length')));
            }

            // Validate user email.
            if (!App.Utils.Validation.email($email.val())) {
                $email.addClass('is-invalid');
                throw new Error(lang('invalid_email'));
            }

            // Validate phone number.
            const phoneNumber = $phoneNumber.val();

            if (phoneNumber && !App.Utils.Validation.phone(phoneNumber)) {
                $phoneNumber.addClass('is-invalid');
                throw new Error(lang('invalid_phone'));
            }

            // Validate mobile number.
            const mobileNumber = $mobileNumber.val();

            if (mobileNumber && !App.Utils.Validation.phone(mobileNumber)) {
                $mobileNumber.addClass('is-invalid');
                throw new Error(lang('invalid_phone'));
            }

            // Check if username exists
            if ($username.attr('already-exists') === 'true') {
                $username.addClass('is-invalid');
                throw new Error(lang('username_already_exists'));
            }

            return true;
        } catch (error) {
            $admins.find('.form-message').addClass('alert-danger').text(error.message).show();
            return false;
        }
    }

    /**
     * Resets the admin form back to its initial state.
     */
    function resetForm() {
        $('#filter-admins .selected').removeClass('selected');
        $('#filter-admins button').prop('disabled', false);
        $('#filter-admins .results').css('color', '');

        $('#admin-actions-group').addClass('d-flex').removeClass('d-none');
        $('#admin-save-cancel-group').addClass('d-none').removeClass('d-flex');
        $admins.find('.record-details').find('input, select, textarea').val('').prop('disabled', true);
        $admins.find('.record-details .form-label span').prop('hidden', true);
        $admins.find('.record-details #calendar-view').val('default');
        $admins.find('.record-details #language').val(vars('default_language'));
        $admins.find('.record-details #timezone').val(vars('default_timezone'));
        $admins.find('.record-details #notifications').prop('checked', true);
        $('#edit-admin, #delete-admin').prop('disabled', true);

        updateAdminSummary();

        $('#admins .is-invalid').removeClass('is-invalid');
        $('#admins .form-message').hide();
        setRecordDetailsVisible(false);

        if (userFilesManager) {
            userFilesManager.reset();
        }
        if (userFormsManager) {
            userFormsManager.reset();
        }
    }

    /**
     * Display a admin record into the admin form.
     *
     * @param {Object} admin Contains the admin record data.
     */
    function display(admin) {
        $id.val(admin.id);
        $firstName.val(admin.first_name);
        $lastName.val(admin.last_name);
        $email.val(admin.email);
        $mobileNumber.val(admin.mobile_number);
        $phoneNumber.val(admin.phone_number);
        $address.val(admin.address);
        $city.val(admin.city);
        $state.val(admin.state);
        $zipCode.val(admin.zip_code);
        $notes.val(admin.notes);
        $language.val(admin.language);
        $timezone.val(admin.timezone);
        $ldapDn.val(admin.ldap_dn);

        $username.val(admin.settings.username);
        $calendarView.val(admin.settings.calendar_view);
        $notifications.prop('checked', Boolean(Number(admin.settings.notifications)));

        updateAdminSummary();

        if (userFilesManager) {
            userFilesManager.refresh();
        }
        if (userFormsManager) {
            userFormsManager.refresh();
        }
    }

    /**
     * Filters admin records by a keyword string.
     *
     * @param {String} keyword This string is used to filter the admin records of the database.
     * @param {Number} [selectId] (OPTIONAL = undefined) This record id will be selected when
     * the filter operation is finished.
     * @param {Boolean} [show] (OPTIONAL = false) If true the selected record data are going
     * to be displayed on the details column (requires a selected record though).
     */
    function filter(keyword, selectId = null, show = false) {
        App.Http.Admins.search(keyword, filterLimit).then((response) => {
            filterResults = response;

            $filterAdmins.find('.results').empty();

            response.forEach((admin) => {
                $filterAdmins.find('.results').append(App.Pages.Admins.getFilterHtml(admin)).append($('<hr/>'));
            });

            if (!response.length) {
                $filterAdmins.find('.results').append(
                    $('<div/>', {
                        'class': 'flex h-full flex-1 flex-col items-center justify-center text-center py-8',
                        'html': [
                            $('<div/>', {
                                'class': 'mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400',
                                'html': '<i class="fas fa-search text-xl"></i>',
                            }),
                            $('<div/>', {
                                'class': 'text-sm font-medium text-slate-900',
                                'text': lang('no_records_found'),
                            }),
                            $('<div/>', {
                                'class': 'mt-1 text-xs text-slate-500',
                                'text': 'Try adjusting your search terms',
                            }),
                        ],
                    }),
                );
            } else if (response.length === filterLimit) {
                $('<button/>', {
                    'type': 'button',
                    'class': 'btn btn-outline-secondary w-100 load-more text-center',
                    'text': lang('load_more'),
                    'click': () => {
                        filterLimit += 20;
                        App.Pages.Admins.filter(keyword, selectId, show);
                    },
                }).appendTo('#filter-admins .results');
            }

            if (pendingSlug) {
                const slugToSelect = pendingSlug;
                pendingSlug = null;
                selectBySlug(slugToSelect);
                return;
            }

            if (response.length) {
                const defaultId = selectId ?? response[0].id;
                const shouldShow = show || !selectId;
                App.Pages.Admins.select(defaultId, shouldShow);
            } else {
                setRecordDetailsVisible(false);
            }
        });
    }

    /**
     * Get an admin row html code that is going to be displayed on the filter results list.
     *
     * @param {Object} admin Contains the admin record data.
     *
     * @return {String} The html code that represents the record on the filter results list.
     */
    function getFilterHtml(admin) {
        const name = admin.first_name + ' ' + admin.last_name;

        let info = admin.email;

        info = admin.mobile_number ? info + ', ' + admin.mobile_number : info;

        info = admin.phone_number ? info + ', ' + admin.phone_number : info;

        return $('<div/>', {
            'class': 'admin-row entry',
            'data-id': admin.id,
            'data-slug': admin.slug || undefined,
            'html': [
                $('<strong/>', {
                    'text': name,
                }),
                $('<br/>'),
                $('<small/>', {
                    'class': 'text-muted',
                    'text': info,
                }),
                $('<br/>'),
            ],
        });
    }

    /**
     * Select a specific record from the current filter results. If the admin id does not exist
     * in the list then no record will be selected.
     *
     * @param {Number} id The record id to be selected from the filter results.
     * @param {Boolean} show Optional (false), if true then the method will display the record
     * on the form.
     */
    function select(id, show = false) {
        $filterAdmins.find('.selected').removeClass('selected');

        $filterAdmins.find('.admin-row[data-id="' + id + '"]').addClass('selected');

        if (show) {
            const admin = filterResults.find((filterResult) => Number(filterResult.id) === Number(id));

            App.Pages.Admins.display(admin);

            $('#edit-admin, #delete-admin').prop('disabled', false);
            setRecordDetailsVisible(true);
        }
    }

    function selectBySlug(slug) {
        if (!slug || typeof App.Http.Admins.findBySlug !== 'function') {
            return;
        }

        App.Http.Admins.findBySlug(slug)
            .then((admin) => {
                App.Pages.Admins.display(admin);
                $('#edit-admin, #delete-admin').prop('disabled', false);
                setRecordDetailsVisible(true);
                updateProfileUrl(admin?.slug, true);
                if (admin?.slug) {
                    $filterAdmins.find('.selected').removeClass('selected');
                    $filterAdmins.find('.entry[data-slug="' + admin.slug + '"]').addClass('selected');
                }
            })
            .fail(() => {
                App.Layouts.Backend.displayNotification(lang('no_records_found'));
            });
    }

    function updateProfileUrl(slug, replace = false) {
        if (!slug) {
            return;
        }

        const url = App.Utils.Url.siteUrl(`admins/profile/${slug}`);

        if (replace) {
            window.history.replaceState({ slug }, '', url);
            return;
        }

        window.history.pushState({ slug }, '', url);
    }

    /**
     * Initialize the module.
     */
    function initialize() {
        App.Pages.Admins.resetForm();
        userFilesManager = App.Components.UserFiles.create($adminFilesPanel, {
            userType: 'admin',
            getUserId: () => $id.val(),
            canUpload: Number($adminFilesPanel.data('can-upload')) === 1,
            canDelete: Number($adminFilesPanel.data('can-delete')) === 1,
        });
        if ($adminFormsPanel.length) {
            userFormsManager = App.Components.UserForms.create($adminFormsPanel, {
                userType: 'admin',
                getUserId: () => $id.val(),
                canReset: Number($adminFormsPanel.data('can-reset')) === 1,
            });
        }
        pendingSlug = vars('selected_record_slug') || null;
        App.Pages.Admins.filter('');
        App.Pages.Admins.addEventListeners();
    }

    document.addEventListener('DOMContentLoaded', initialize);

    return {
        filter,
        save,
        remove,
        validate,
        getFilterHtml,
        resetForm,
        display,
        select,
        selectBySlug,
        addEventListeners,
    };
})();
