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
 * Providers page.
 *
 * This module implements the functionality of the providers page.
 */
App.Pages.Providers = (function () {
    const $providers = $('#providers');
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
    const $isPrivate = $('#is-private');
    const $notes = $('#notes');
    const $language = $('#language');
    const $timezone = $('#timezone');
    const $ldapDn = $('#ldap-dn');
    const $username = $('#username');
    const $password = $('#password');
    const $passwordConfirmation = $('#password-confirm');
    const $notifications = $('#notifications');
    const $calendarView = $('#calendar-view');
    const $serviceAreaZipsContainer = $('#provider-service-area-zips');
    const $serviceAreaAll = $('#provider-service-area-all');
    const $filterProviders = $('#filter-providers');
    const $summaryName = $('#provider-summary-name');
    const $summaryEmail = $('#provider-summary-email');
    const $summaryPhone = $('#provider-summary-phone');
    const $summaryLocation = $('#provider-summary-location');
    const $bookingsPanel = $('#provider-bookings');
    const $bookingsTableBody = $bookingsPanel.find('tbody');
    const $providerFilesPanel = $('#provider-files-panel .user-files-panel');
    const $providerFormsPanel = $('#provider-forms-panel .user-forms-panel');
    let filterResults = {};
    let filterLimit = 20;
    let pendingSlug = null;
    let workingPlanManager;
    let userFilesManager;
    let userFormsManager;
    let serviceAreaZipIds = [];

    function setRecordDetailsVisible(visible, source = 'unknown') {
        const $recordDetails = $providers.find('.record-details');

        if (visible) {
            $recordDetails.show();
        } else {
            $recordDetails.hide();
        }

        const isVisible = $recordDetails.is(':visible');
        console.debug('[Providers] record-details visibility', {
            source,
            requested: visible,
            actual: isVisible,
        });
    }

    function updateProviderSummary(record = null) {
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

    function formatBookingDate(dateTime) {
        try {
            return App.Utils.Date.format(dateTime, vars('date_format'), vars('time_format'), true);
        } catch (error) {
            return '—';
        }
    }

    function getBookingStatusBadge(status) {
        const normalized = (status || '').toString().toLowerCase();
        let badgeClass = 'bg-slate-100 text-slate-700';

        if (['booked', 'confirmed', 'approved'].includes(normalized)) {
            badgeClass = 'bg-emerald-50 text-emerald-700';
        } else if (['cancelled', 'canceled', 'rejected'].includes(normalized)) {
            badgeClass = 'bg-rose-50 text-rose-700';
        } else if (['completed', 'done', 'finished'].includes(normalized)) {
            badgeClass = 'bg-blue-50 text-blue-700';
        } else if (['pending'].includes(normalized)) {
            badgeClass = 'bg-amber-50 text-amber-700';
        }

        return $('<span/>', {
            'class': `inline-flex rounded-full px-3 py-1 text-xs font-medium ${badgeClass}`,
            'text': status ? status.charAt(0).toUpperCase() + status.slice(1) : '—',
        });
    }

    function renderBookings(bookings) {
        $bookingsTableBody.empty();

        if (!bookings.length) {
            $('<tr/>', {
                'html': $('<td/>', {
                    'class': 'px-4 py-6 text-center text-slate-500',
                    'colspan': 5,
                    'text': lang('no_records_found'),
                }),
            }).appendTo($bookingsTableBody);
            return;
        }

        bookings.forEach((booking) => {
            const editUrl = booking.hash ? App.Utils.Url.siteUrl(`calendar/reschedule/${booking.hash}`) : null;

            const $row = $('<tr/>', {
                'class': 'bg-white border-b border-[var(--bs-border-color,#e2e8f0)] last:border-b-0',
                'data-id': booking.id,
            });

            $('<td/>', {
                'class': 'px-4 py-3 font-medium text-slate-900',
                'text': booking.service_name || '—',
            }).appendTo($row);

            const customerNameParts = [booking.customer_first_name, booking.customer_last_name].filter(Boolean);
            const customerName = customerNameParts.length
                ? customerNameParts.join(' ')
                : booking.customer_name || '—';

            $('<td/>', {
                'class': 'px-4 py-3 text-slate-700',
                'text': customerName,
            }).appendTo($row);

            $('<td/>', {
                'class': 'px-4 py-3 text-slate-700',
                'text': formatBookingDate(booking.start_datetime),
            }).appendTo($row);

            $('<td/>', {
                'class': 'px-4 py-3',
                'html': getBookingStatusBadge(booking.status),
            }).appendTo($row);

            $('<td/>', {
                'class': 'px-4 py-3 text-right',
                'html': editUrl
                    ? $('<a/>', {
                          'href': editUrl,
                          'class':
                              'customer-appointment-edit inline-flex items-center rounded-xl border border-[var(--bs-border-color,#e2e8f0)] px-3 py-2 text-sm font-medium text-slate-700 hover:border-[var(--bs-border-color,#e2e8f0)] hover:text-slate-900',
                          'text': lang('edit'),
                      })
                    : '',
            }).appendTo($row);

            $row.appendTo($bookingsTableBody);
        });
    }

    function syncServiceAreaInputs() {
        const isAllSelected = $serviceAreaAll.prop('checked');
        const isAllDisabled = $serviceAreaAll.prop('disabled');
        $serviceAreaZipsContainer.find('input:checkbox').prop('disabled', isAllSelected || isAllDisabled);
    }

    function loadBookings(providerId) {
        if (!providerId) {
            renderBookings([]);
            return;
        }

        if (!App.Http || !App.Http.Providers || typeof App.Http.Providers.bookings !== 'function') {
            App.Http = App.Http || {};
            App.Http.Providers = App.Http.Providers || {};
            App.Http.Providers.bookings = (id) => {
                const url = App.Utils.Url.siteUrl('providers/bookings');
                const data = {
                    csrf_token: vars('csrf_token'),
                    provider_id: id,
                };
                return $.post(url, data);
            };
        }

        $bookingsTableBody.empty();
        $('<tr/>', {
            'html': $('<td/>', {
                'class': 'px-4 py-6 text-center text-slate-500',
                'colspan': 5,
                'text': 'Loading...',
            }),
        }).appendTo($bookingsTableBody);

        App.Http.Providers.bookings(providerId).then((response) => {
            renderBookings(Array.isArray(response) ? response : []);
        });
    }

    /**
     * Add the page event listeners.
     */
    function addEventListeners() {
        /**
         * Event: Filter Providers Form "Submit"
         *
         * Filter the provider records with the given key string.
         *
         * @param {jQuery.Event} event
         */
        $providers.on('submit', '#filter-providers form', (event) => {
            event.preventDefault();
            const key = $('#filter-providers .key').val();
            $('.selected').removeClass('selected');
            App.Pages.Providers.resetForm();
            App.Pages.Providers.filter(key);
        });

        /**
         * Event: Filter Provider Row "Click"
         *
         * Display the selected provider data to the user.
         */
        $providers.on('click', '.provider-row', (event) => {
            if ($filterProviders.find('.filter').prop('disabled')) {
                $filterProviders.find('.results').css('color', '#AAA');
                return; // Exit because we are currently on edit mode.
            }

            const providerId = $(event.currentTarget).attr('data-id');
            const provider = filterResults.find((filterResult) => Number(filterResult.id) === Number(providerId));

            App.Pages.Providers.select(providerId, true);
            updateProfileUrl(provider?.slug);
        });

        /**
         * Event: Add New Provider Button "Click"
         */
        $providers.on('click', '#add-provider', () => {
            App.Pages.Providers.resetForm();
            setRecordDetailsVisible(true, 'add-provider');
            $filterProviders.find('button').prop('disabled', true);
            $filterProviders.find('.results').css('color', '#AAA');
            $('#provider-actions-group').addClass('d-none').removeClass('d-flex');
            $('#provider-save-cancel-group').addClass('d-flex').removeClass('d-none');
            $providers.find('.record-details').find('input, select, textarea').prop('disabled', false);
            $providers.find('.record-details .form-label span').prop('hidden', false);
            $('#password, #password-confirm').addClass('required');
            $providers
                .find(
                    '.add-break, .edit-break, .delete-break, .add-working-plan-exception, .edit-working-plan-exception, .delete-working-plan-exception, #reset-working-plan',
                )
                .prop('disabled', false);
            $('#provider-services input:checkbox').prop('disabled', false);
            $serviceAreaAll.prop('disabled', false);
            syncServiceAreaInputs();

            // Apply default working plan
            const companyWorkingPlan = JSON.parse(vars('company_working_plan'));
            workingPlanManager.setup(companyWorkingPlan);
            workingPlanManager.timepickers(false);
        });

        /**
         * Event: Edit Provider Button "Click"
         */
        $providers.on('click', '#edit-provider', () => {
            $('#provider-actions-group').addClass('d-none').removeClass('d-flex');
            $('#provider-save-cancel-group').addClass('d-flex').removeClass('d-none');
            $filterProviders.find('button').prop('disabled', true);
            $filterProviders.find('.results').css('color', '#AAA');
            $providers.find('.record-details').find('input, select, textarea').prop('disabled', false);
            $providers.find('.record-details .form-label span').prop('hidden', false);
            $('#password, #password-confirm').removeClass('required');
            $('#provider-services input:checkbox').prop('disabled', false);
            $serviceAreaAll.prop('disabled', false);
            syncServiceAreaInputs();
            $providers
                .find(
                    '.add-break, .edit-break, .delete-break, .add-working-plan-exception, .edit-working-plan-exception, .delete-working-plan-exception, #reset-working-plan',
                )
                .prop('disabled', false);
            $('#providers input:checkbox').prop('disabled', false);
            workingPlanManager.timepickers(false);
        });

        /**
         * Event: Delete Provider Button "Click"
         */
        $providers.on('click', '#delete-provider', () => {
            const providerId = $id.val();

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
                        App.Pages.Providers.remove(providerId);
                        messageModal.hide();
                    },
                },
            ];

            App.Utils.Message.show(lang('delete_provider'), lang('delete_record_prompt'), buttons);
        });

        /**
         * Event: Save Provider Button "Click"
         */
        $providers.on('click', '#save-provider', () => {
            const provider = {
                first_name: $firstName.val(),
                last_name: $lastName.val(),
                email: $email.val(),
                mobile_number: $mobileNumber.val(),
                phone_number: $phoneNumber.val(),
                address: $address.val(),
                city: $city.val(),
                state: $state.val(),
                zip_code: $zipCode.val(),
                is_private: Number($isPrivate.prop('checked')),
                notes: $notes.val(),
                language: $language.val(),
                timezone: $timezone.val(),
                ldap_dn: $ldapDn.val(),
                settings: {
                    username: $username.val(),
                    working_plan: JSON.stringify(workingPlanManager.get()),
                    working_plan_exceptions: JSON.stringify(workingPlanManager.getWorkingPlanExceptions()),
                    notifications: Number($notifications.prop('checked')),
                    calendar_view: $calendarView.val(),
                },
            };

            // Include provider services.
            provider.services = [];
            $('#provider-services input:checkbox').each((index, checkboxEl) => {
                if ($(checkboxEl).prop('checked')) {
                    provider.services.push($(checkboxEl).attr('data-id'));
                }
            });

            if ($serviceAreaAll.prop('checked')) {
                provider.service_area_zip_ids = [...serviceAreaZipIds];
            } else {
                provider.service_area_zip_ids = [];
                $serviceAreaZipsContainer.find('input:checkbox').each((index, checkboxEl) => {
                    if ($(checkboxEl).prop('checked')) {
                        provider.service_area_zip_ids.push($(checkboxEl).attr('data-id'));
                    }
                });
            }

            // Include password if changed.
            if ($password.val() !== '') {
                provider.settings.password = $password.val();
            }

            // Include id if changed.
            if ($id.val() !== '') {
                provider.id = $id.val();
            }

            if (!App.Pages.Providers.validate()) {
                return;
            }

            App.Pages.Providers.save(provider);
        });

        /**
         * Event: Cancel Provider Button "Click"
         *
         * Cancel add or edit of an provider record.
         */
        $providers.on('click', '#cancel-provider', () => {
            const id = $('#filter-providers .selected').attr('data-id');
            App.Pages.Providers.resetForm();
            if (id) {
                App.Pages.Providers.select(id, true);
            }
        });

        /**
         * Event: Reset Working Plan Button "Click".
         */
        $providers.on('click', '#reset-working-plan', () => {
            $('.breaks tbody').empty();
            $('.working-plan-exceptions tbody').empty();
            $('.work-start, .work-end').val('');
            const companyWorkingPlan = JSON.parse(vars('company_working_plan'));
            workingPlanManager.setup(companyWorkingPlan);
            workingPlanManager.timepickers(false);
        });

        $providers.on('change', '#provider-service-area-all', (event) => {
            const isChecked = $(event.currentTarget).prop('checked');
            $serviceAreaZipsContainer.find('input:checkbox')
                .prop('checked', isChecked)
                .prop('disabled', isChecked);
        });

        $providers.on('change', '#provider-service-area-zips input:checkbox', () => {
            const total = $serviceAreaZipsContainer.find('input:checkbox').length;
            const selected = $serviceAreaZipsContainer.find('input:checkbox:checked').length;
            const isAllSelected = total > 0 && selected === total;
            $serviceAreaAll.prop('checked', isAllSelected);
            syncServiceAreaInputs();
        });

        $providers.on('click', '#provider-tabs [data-bs-toggle="pill"]', (event) => {
            const target = event.currentTarget;
            const targetId = target?.getAttribute('data-bs-target') || target?.getAttribute('href');
            console.debug('[Providers] tab click', {
                targetId,
                id: target?.id,
            });
            setRecordDetailsVisible(true, 'tab-click');
        });
    }

    /**
     * Save provider record to database.
     *
     * @param {Object} provider Contains the provider record data. If an 'id' value is provided
     * then the update operation is going to be executed.
     */
    function save(provider) {
        App.Http.Providers.save(provider).then((response) => {
            App.Layouts.Backend.displayNotification(lang('provider_saved'));
            App.Pages.Providers.resetForm();
            $('#filter-providers .key').val('');
            App.Pages.Providers.filter('', response.id, true);
        });
    }

    /**
     * Delete a provider record from database.
     *
     * @param {Number} id Record id to be deleted.
     */
    function remove(id) {
        App.Http.Providers.destroy(id).then(() => {
            App.Layouts.Backend.displayNotification(lang('provider_deleted'));
            App.Pages.Providers.resetForm();
            App.Pages.Providers.filter($('#filter-providers .key').val());
        });
    }

    /**
     * Validates a provider record.
     *
     * @return {Boolean} Returns the validation result.
     */
    function validate() {
        $providers.find('.is-invalid').removeClass('is-invalid');
        $providers.find('.form-message').removeClass('alert-danger').hide();

        try {
            // Validate required fields.
            let missingRequired = false;

            $providers.find('.required').each((index, requiredFieldEl) => {
                if (!$(requiredFieldEl).val()) {
                    $(requiredFieldEl).addClass('is-invalid');
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
            $('#providers .form-message').addClass('alert-danger').text(error.message).show();
            return false;
        }
    }

    /**
     * Resets the provider tab form back to its initial state.
     */
    function resetForm() {
        $filterProviders.find('button').prop('disabled', false);
        $filterProviders.find('.results').css('color', '');

        $('#provider-actions-group').addClass('d-flex').removeClass('d-none');
        $('#provider-save-cancel-group').addClass('d-none').removeClass('d-flex');
        $providers.find('.record-details h4 a').remove();
        $providers.find('.record-details').find('input, select, textarea').val('').prop('disabled', true);
        $providers.find('.record-details .form-label span').prop('hidden', true);
        $providers.find('.record-details #calendar-view').val('default');
        $providers.find('.record-details #language').val(vars('default_language'));
        $providers.find('.record-details #timezone').val(vars('default_timezone'));
        $providers.find('.record-details #is-private').prop('checked', false);
        $providers.find('.record-details #notifications').prop('checked', true);
        $serviceAreaAll.prop('disabled', true).prop('checked', false);
        $serviceAreaZipsContainer.find('input:checkbox').prop('checked', false).prop('disabled', true);
        $providers.find('.add-break, .add-working-plan-exception, #reset-working-plan').prop('disabled', true);

        workingPlanManager.timepickers(true);
        $providers.find('#providers .working-plan input:checkbox').prop('disabled', true);
        $('.breaks').find('.edit-break, .delete-break').prop('disabled', true);
        $('.working-plan-exceptions')
            .find('.edit-working-plan-exception, .delete-working-plan-exception')
            .prop('disabled', true);

        $providers.find('.record-details .is-invalid').removeClass('is-invalid');
        $providers.find('.record-details .form-message').hide();

        $('#edit-provider, #delete-provider').prop('disabled', true);
        $('#provider-services input:checkbox').prop('disabled', true).prop('checked', false);
        $('#provider-services a').remove();
        $('#providers .working-plan tbody').empty();
        $('#providers .breaks tbody').empty();
        $('#providers .working-plan-exceptions tbody').empty();
        renderBookings([]);
        updateProviderSummary();
        setRecordDetailsVisible(false, 'reset-form');

        if (userFilesManager) {
            userFilesManager.reset();
        }
        if (userFormsManager) {
            userFormsManager.reset();
        }
    }

    /**
     * Display a provider record into the provider form.
     *
     * @param {Object} provider Contains the provider record data.
     */
    function display(provider) {
        $id.val(provider.id);
        $firstName.val(provider.first_name);
        $lastName.val(provider.last_name);
        $email.val(provider.email);
        $mobileNumber.val(provider.mobile_number);
        $phoneNumber.val(provider.phone_number);
        $address.val(provider.address);
        $city.val(provider.city);
        $state.val(provider.state);
        $zipCode.val(provider.zip_code);
        $isPrivate.prop('checked', provider.is_private);
        $notes.val(provider.notes);
        $language.val(provider.language);
        $timezone.val(provider.timezone);
        $ldapDn.val(provider.ldap_dn);

        $username.val(provider.settings.username);
        $calendarView.val(provider.settings.calendar_view);
        $notifications.prop('checked', Boolean(Number(provider.settings.notifications)));
        const providerZipIds = provider.service_area_zip_ids || [];
        const isAllSelected = serviceAreaZipIds.length && providerZipIds.length >= serviceAreaZipIds.length;
        $serviceAreaAll.prop('disabled', true).prop('checked', isAllSelected);
        $serviceAreaZipsContainer.find('input:checkbox').each((index, checkboxEl) => {
            const $checkbox = $(checkboxEl);
            const zipId = Number($checkbox.attr('data-id'));
            $checkbox.prop('checked', isAllSelected || providerZipIds.includes(zipId));
        });
        syncServiceAreaInputs();
        updateProviderSummary();

        if (userFilesManager) {
            userFilesManager.refresh();
        }
        if (userFormsManager) {
            userFormsManager.refresh();
        }

        // Add dedicated provider link.
        let dedicatedUrl = App.Utils.Url.siteUrl('?provider=' + encodeURIComponent(provider.id));
        let $link = $('<a/>', {
            'href': dedicatedUrl,
            'target': '_blank',
            'html': [
                $('<i/>', {
                    'class': 'fas fa-link me-2',
                }),

                $('<span/>', {
                    'text': lang('booking_link'),
                }),
            ],
        });

        $providers.find('.details-view h4').find('a').remove().end().append($link);

        $('#provider-services a').remove();
        $('#provider-services input:checkbox').prop('checked', false);

        provider.services.forEach((providerServiceId) => {
            const $checkbox = $('#provider-services input[data-id="' + providerServiceId + '"]');

            if (!$checkbox.length) {
                return;
            }

            $checkbox.prop('checked', true);

            // Add dedicated service-provider link.
            dedicatedUrl = App.Utils.Url.siteUrl(
                '?provider=' + encodeURIComponent(provider.id) + '&service=' + encodeURIComponent(providerServiceId),
            );

            $link = $('<a/>', {
                'href': dedicatedUrl,
                'target': '_blank',
                'html': [
                    $('<i/>', {
                        'class': 'fas fa-link me-2',
                    }),

                    $('<span/>', {
                        'text': lang('booking_link'),
                    }),
                ],
            });

            $checkbox.parent().append($link);
        });

        // Display working plan
        let workingPlan = null;
        try {
            workingPlan = JSON.parse(provider.settings.working_plan);
        } catch (error) {
            try {
                workingPlan = JSON.parse(vars('company_working_plan'));
            } catch (fallbackError) {
                workingPlan = null;
            }
        }
        if (workingPlan) {
            workingPlanManager.setup(workingPlan);
        }
        $('.working-plan').find('input').prop('disabled', true);
        $('.breaks').find('.edit-break, .delete-break').prop('disabled', true);
        $providers.find('.working-plan-exceptions tbody').empty();
        let workingPlanExceptions = [];
        try {
            workingPlanExceptions = JSON.parse(provider.settings.working_plan_exceptions || '[]');
        } catch (error) {
            workingPlanExceptions = [];
        }
        workingPlanManager.setupWorkingPlanExceptions(workingPlanExceptions);
        $('.working-plan-exceptions')
            .find('.edit-working-plan-exception, .delete-working-plan-exception')
            .prop('disabled', true);
        $providers.find('.working-plan input:checkbox').prop('disabled', true);

        loadBookings(provider.id);
    }

    /**
     * Filters provider records depending a string keyword.
     *
     * @param {string} keyword This is used to filter the provider records of the database.
     * @param {numeric} selectId Optional, if set, when the function is complete a result row can be set as selected.
     * @param {bool} show Optional (false), if true the selected record will be also displayed.
     */
    function filter(keyword, selectId = null, show = false) {
        App.Http.Providers.search(keyword, filterLimit).then((response) => {
            filterResults = response;

            $filterProviders.find('.results').empty();
            response.forEach((provider) => {
                $('#filter-providers .results').append(App.Pages.Providers.getFilterHtml(provider)).append($('<hr/>'));
            });

            if (!response.length) {
                $filterProviders.find('.results').append(
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
                        App.Pages.Providers.filter(keyword, selectId, show);
                    },
                }).appendTo('#filter-providers .results');
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
                App.Pages.Providers.select(defaultId, shouldShow);
            } else {
                setRecordDetailsVisible(false, 'filter-empty');
            }
        });
    }

    /**
     * Get an provider row html code that is going to be displayed on the filter results list.
     *
     * @param {Object} provider Contains the provider record data.
     *
     * @return {String} The html code that represents the record on the filter results list.
     */
    function getFilterHtml(provider) {
        const name = provider.first_name + ' ' + provider.last_name;

        let info = provider.email;

        info = provider.mobile_number ? info + ', ' + provider.mobile_number : info;

        info = provider.phone_number ? info + ', ' + provider.phone_number : info;

        return $('<div/>', {
            'class': 'provider-row entry',
            'data-id': provider.id,
            'data-slug': provider.slug || undefined,
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
     * Select and display a providers filter result on the form.
     *
     * @param {Number} id Record id to be selected.
     * @param {Boolean} show Optional (false), if true the record will be displayed on the form.
     */
    function select(id, show = false) {
        // Select record in filter results.
        $filterProviders.find('.selected').removeClass('selected');
        $filterProviders.find('.provider-row[data-id="' + id + '"]').addClass('selected');

        // Display record in form (if display = true).
        if (show) {
            App.Http.Providers.find(id)
                .then((provider) => {
                    App.Pages.Providers.display(provider);
                    $('#edit-provider, #delete-provider').prop('disabled', false);
                    setRecordDetailsVisible(true, 'select-show');
                })
                .fail(() => {
                    App.Layouts.Backend.displayNotification(lang('no_records_found'));
                });
        }
    }

    function selectBySlug(slug) {
        if (!slug || typeof App.Http.Providers.findBySlug !== 'function') {
            return;
        }

        App.Http.Providers.findBySlug(slug)
            .then((provider) => {
                App.Pages.Providers.display(provider);
                $('#edit-provider, #delete-provider').prop('disabled', false);
                setRecordDetailsVisible(true, 'selectBySlug-show');
                updateProfileUrl(provider?.slug, true);
                if (provider?.slug) {
                    $filterProviders.find('.selected').removeClass('selected');
                    $filterProviders.find('.entry[data-slug="' + provider.slug + '"]').addClass('selected');
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

        const url = App.Utils.Url.siteUrl(`providers/profile/${slug}`);

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
        workingPlanManager = new App.Utils.WorkingPlan();
        workingPlanManager.addEventListeners();

        App.Pages.Providers.resetForm();
        const recordDetailsElement = $providers.find('.record-details')[0];
        if (recordDetailsElement) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes') {
                        const target = mutation.target;
                        console.debug('[Providers] record-details attribute change', {
                            attributeName: mutation.attributeName,
                            className: target.className,
                            style: target.getAttribute('style'),
                            isVisible: $(target).is(':visible'),
                        });
                    }
                });
            });
            observer.observe(recordDetailsElement, { attributes: true, attributeFilter: ['style', 'class'] });
        }
        userFilesManager = App.Components.UserFiles.create($providerFilesPanel, {
            userType: 'provider',
            getUserId: () => $id.val(),
            canUpload: Number($providerFilesPanel.data('can-upload')) === 1,
            canDelete: Number($providerFilesPanel.data('can-delete')) === 1,
        });
        if ($providerFormsPanel.length) {
            userFormsManager = App.Components.UserForms.create($providerFormsPanel, {
                userType: 'provider',
                getUserId: () => $id.val(),
                canReset: Number($providerFormsPanel.data('can-reset')) === 1,
            });
        }
        pendingSlug = vars('selected_record_slug') || null;
        App.Pages.Providers.filter('');
        App.Pages.Providers.addEventListeners();

        vars('services').forEach((service) => {
            const checkboxId = `provider-service-${service.id}`;

            $('<div/>', {
                'class': 'checkbox',
                'html': [
                    $('<div/>', {
                        'class': 'checkbox form-check',
                        'html': [
                            $('<input/>', {
                                'id': checkboxId,
                                'class': 'form-check-input',
                                'type': 'checkbox',
                                'data-id': service.id,
                                'prop': {
                                    'disabled': true,
                                },
                            }),
                            $('<label/>', {
                                'class': 'form-check-label',
                                'text': service.name,
                                'for': checkboxId,
                            }),
                        ],
                    }),
                ],
            }).appendTo('#provider-services');
        });

        $serviceAreaZipsContainer.empty();
        const serviceAreaZips = vars('service_area_zips') || [];
        serviceAreaZipIds = serviceAreaZips.map((zip) => Number(zip.id));
        serviceAreaZips.forEach((zip) => {
            const checkboxId = `provider-service-area-zip-${zip.id}`;
            const label = zip.display_label ? ` - ${zip.display_label}` : '';
            $('<div/>', {
                'class': 'form-check',
                'html': [
                    $('<input/>', {
                        'id': checkboxId,
                        'class': 'form-check-input',
                        'type': 'checkbox',
                        'data-id': zip.id,
                        'prop': {
                            'disabled': true,
                        },
                    }),
                    $('<label/>', {
                        'class': 'form-check-label',
                        'for': checkboxId,
                        'text': `${zip.postal_code}${label}`,
                    }),
                ],
            }).appendTo($serviceAreaZipsContainer);
        });
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
