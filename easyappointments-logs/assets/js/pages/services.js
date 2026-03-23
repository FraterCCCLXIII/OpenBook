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
 * Services page.
 *
 * This module implements the functionality of the services page.
 */
App.Pages.Services = (function () {
    const $services = $('#services');
    const $id = $('#id');
    const $name = $('#name');
    const $duration = $('#duration');
    const $price = $('#price');
    const $downPaymentType = $('#down-payment-type');
    const $downPaymentValue = $('#down-payment-value');
    const $currency = $('#currency');
    const $serviceCategoryId = $('#service-category-id');
    const $availabilitiesType = $('#availabilities-type');
    const $attendantsNumber = $('#attendants-number');
    const $isPrivate = $('#is-private');
    const $serviceAreaOnly = $('#service-area-only');
    const $location = $('#location');
    const $description = $('#description');
    const $filterServices = $('#filter-services');
    const $color = $('#color');
    let filterResults = {};
    let filterLimit = 20;

    function setRecordDetailsVisible(visible) {
        const $recordDetails = $services.find('.record-details');

        if (visible) {
            $recordDetails.show();
        } else {
            $recordDetails.hide();
        }
    }

    /**
     * Add page event listeners.
     */
    function addEventListeners() {
        /**
         * Event: Filter Services Form "Submit"
         *
         * @param {jQuery.Event} event
         */
        $services.on('submit', '#filter-services form', (event) => {
            event.preventDefault();
            const key = $filterServices.find('.key').val();
            $filterServices.find('.selected').removeClass('selected');
            filterLimit = 20;
            App.Pages.Services.resetForm();
            App.Pages.Services.filter(key);
        });

        /**
         * Event: Filter Service Row "Click"
         *
         * Display the selected service data to the user.
         */
        $services.on('click', '.service-row', (event) => {
            if ($filterServices.find('.filter').prop('disabled')) {
                $filterServices.find('.results').css('color', '#AAA');
                return; // exit because we are on edit mode
            }

            const serviceId = $(event.currentTarget).attr('data-id');

            const service = filterResults.find((filterResult) => Number(filterResult.id) === Number(serviceId));

            // Add dedicated provider link.
            const dedicatedUrl = App.Utils.Url.siteUrl('?service=' + encodeURIComponent(service.id));

            const $link = $('<a/>', {
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

            $services.find('.record-details h4').find('a').remove().end().append($link);

            App.Pages.Services.display(service);
            $filterServices.find('.selected').removeClass('selected');
            $(event.currentTarget).addClass('selected');
            $('#edit-service, #delete-service').prop('disabled', false);
            setRecordDetailsVisible(true);
        });

        /**
         * Event: Add New Service Button "Click"
         */
        $services.on('click', '#add-service', () => {
            App.Pages.Services.resetForm();
            setRecordDetailsVisible(true);
            $('#service-details-title').text('Add New Service');
            $('#service-actions-group').addClass('d-none').removeClass('d-flex');
            $('#service-save-cancel-group').addClass('d-flex').removeClass('d-none');
            $services.find('.record-details').find('input, select, textarea').prop('disabled', false);
            $services.find('.record-details .form-label span').prop('hidden', false);
            $filterServices.find('button').prop('disabled', true);
            $filterServices.find('.results').css('color', '#AAA');
            App.Components.ColorSelection.enable($color);

            // Default values
            $name.val('Service');
            $duration.val('30');
            $price.val('0');
            $downPaymentType.val('none');
            $downPaymentValue.val('0');
            $currency.val('');
            $serviceCategoryId.val('');
            $availabilitiesType.val('flexible');
            $attendantsNumber.val('1');
            $serviceAreaOnly.prop('checked', false);
        });

        /**
         * Event: Cancel Service Button "Click"
         *
         * Cancel add or edit of a service record.
         */
        $services.on('click', '#cancel-service', () => {
            const id = $id.val();

            App.Pages.Services.resetForm();

            if (id !== '') {
                App.Pages.Services.select(id, true);
            }
        });

        /**
         * Event: Save Service Button "Click"
         */
        $services.on('click', '#save-service', () => {
            const service = {
                name: $name.val(),
                duration: $duration.val(),
                price: $price.val(),
                down_payment_type: $downPaymentType.val(),
                down_payment_value: $downPaymentValue.val() || 0,
                currency: $currency.val(),
                description: $description.val(),
                location: $location.val(),
                color: App.Components.ColorSelection.getColor($color),
                availabilities_type: $availabilitiesType.val(),
                attendants_number: $attendantsNumber.val(),
                is_private: Number($isPrivate.prop('checked')),
                service_area_only: Number($serviceAreaOnly.prop('checked')),
                id_service_categories: $serviceCategoryId.val() || undefined,
            };

            if ($id.val() !== '') {
                service.id = $id.val();
            }

            if (!App.Pages.Services.validate()) {
                return;
            }

            App.Pages.Services.save(service);
        });

        /**
         * Event: Edit Service Button "Click"
         */
        $services.on('click', '#edit-service', () => {
            $('#service-actions-group').addClass('d-none').removeClass('d-flex');
            $('#service-save-cancel-group').addClass('d-flex').removeClass('d-none');
            $services.find('.record-details').find('input, select, textarea').prop('disabled', false);
            $services.find('.record-details .form-label span').prop('hidden', false);
            $filterServices.find('button').prop('disabled', true);
            $filterServices.find('.results').css('color', '#AAA');
            App.Components.ColorSelection.enable($color);
        });

        /**
         * Event: Delete Service Button "Click"
         */
        $services.on('click', '#delete-service', () => {
            const serviceId = $id.val();
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
                        App.Pages.Services.remove(serviceId);
                        messageModal.hide();
                    },
                },
            ];

            App.Utils.Message.show(lang('delete_service'), lang('delete_record_prompt'), buttons);
        });
    }

    /**
     * Save service record to database.
     *
     * @param {Object} service Contains the service record data. If an 'id' value is provided
     * then the update operation is going to be executed.
     */
    function save(service) {
        App.Http.Services.save(service).then((response) => {
            App.Layouts.Backend.displayNotification(lang('service_saved'));
            App.Pages.Services.resetForm();
            $filterServices.find('.key').val('');
            App.Pages.Services.filter('', response.id, true);
        });
    }

    /**
     * Delete a service record from database.
     *
     * @param {Number} id Record ID to be deleted.
     */
    function remove(id) {
        App.Http.Services.destroy(id).then(() => {
            App.Layouts.Backend.displayNotification(lang('service_deleted'));
            App.Pages.Services.resetForm();
            App.Pages.Services.filter($filterServices.find('.key').val());
        });
    }

    /**
     * Validates a service record.
     *
     * @return {Boolean} Returns the validation result.
     */
    function validate() {
        $services.find('.is-invalid').removeClass('is-invalid');
        $services.find('.form-message').removeClass('alert-danger').hide();

        try {
            // Validate required fields.
            let missingRequired = false;

            $services.find('.required').each((index, requiredField) => {
                if (!$(requiredField).val()) {
                    $(requiredField).addClass('is-invalid');
                    missingRequired = true;
                }
            });

            if (missingRequired) {
                throw new Error(lang('fields_are_required'));
            }

            // Validate the duration.
            if (Number($duration.val()) < vars('event_minimum_duration')) {
                $duration.addClass('is-invalid');
                throw new Error(lang('invalid_duration'));
            }

            const price = Number($price.val() || 0);
            const downPaymentType = ($downPaymentType.val() || 'none').toLowerCase();
            const downPaymentValue = Number($downPaymentValue.val() || 0);

            if (downPaymentValue < 0) {
                $downPaymentValue.addClass('is-invalid');
                throw new Error('Down payment value cannot be negative.');
            }

            if (downPaymentType === 'fixed' && downPaymentValue > price) {
                $downPaymentValue.addClass('is-invalid');
                throw new Error('Fixed down payment cannot exceed service price.');
            }

            if (downPaymentType === 'percent' && downPaymentValue > 100) {
                $downPaymentValue.addClass('is-invalid');
                throw new Error('Percent down payment cannot exceed 100.');
            }

            return true;
        } catch (error) {
            $services.find('.form-message').addClass('alert-danger').text(error.message).show();
            return false;
        }
    }

    /**
     * Resets the service tab form back to its initial state.
     */
    function resetForm() {
        $filterServices.find('.selected').removeClass('selected');
        $filterServices.find('button').prop('disabled', false);
        $filterServices.find('.results').css('color', '');

        $services.find('.record-details').find('input, select, textarea').val('').prop('disabled', true);
        $services.find('.record-details .form-label span').prop('hidden', true);
        $services.find('.record-details #is-private').prop('checked', false);
        $services.find('.record-details #service-area-only').prop('checked', false);
        $services.find('.record-details h4 a').remove();

        $('#service-actions-group').addClass('d-flex').removeClass('d-none');
        $('#service-save-cancel-group').addClass('d-none').removeClass('d-flex');
        $('#edit-service, #delete-service').prop('disabled', true);

        $services.find('.record-details .is-invalid').removeClass('is-invalid');
        $services.find('.record-details .form-message').hide();
        $('#service-details-title').text(lang('details'));

        App.Components.ColorSelection.disable($color);
        setRecordDetailsVisible(false);
    }

    /**
     * Display a service record into the service form.
     *
     * @param {Object} service Contains the service record data.
     */
    function display(service) {
        $id.val(service.id);
        $name.val(service.name);
        $duration.val(service.duration);
        $price.val(service.price);
        $downPaymentType.val(service.down_payment_type || 'none');
        $downPaymentValue.val(service.down_payment_value ?? 0);
        $currency.val(service.currency);
        $description.val(service.description);
        $location.val(service.location);
        $availabilitiesType.val(service.availabilities_type);
        $attendantsNumber.val(service.attendants_number);
        $isPrivate.prop('checked', service.is_private);
        $serviceAreaOnly.prop('checked', service.service_area_only);
        App.Components.ColorSelection.setColor($color, service.color);

        const serviceCategoryId = service.id_service_categories !== null ? service.id_service_categories : '';
        $serviceCategoryId.val(serviceCategoryId);
    }

    /**
     * Filters service records depending on a string keyword.
     *
     * @param {String} keyword This is used to filter the service records of the database.
     * @param {Number} selectId Optional, if set then after the filter operation the record with this
     * ID will be selected (but not displayed).
     * @param {Boolean} show Optional (false), if true then the selected record will be displayed on the form.
     */
    function filter(keyword, selectId = null, show = false) {
        App.Http.Services.search(keyword, filterLimit).then((response) => {
            filterResults = response;

            $filterServices.find('.results').empty();

            response.forEach((service) => {
                $filterServices.find('.results').append(App.Pages.Services.getFilterHtml(service)).append($('<hr/>'));
            });

            if (response.length === 0) {
                $filterServices.find('.results').append(
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
                        App.Pages.Services.filter(keyword, selectId, show);
                    },
                }).appendTo('#filter-services .results');
            }

            if (response.length) {
                const defaultId = selectId ?? response[0].id;
                const shouldShow = show || !selectId;
                App.Pages.Services.select(defaultId, shouldShow);
            } else {
                setRecordDetailsVisible(false);
            }
        });
    }

    /**
     * Get Filter HTML
     *
     * Get a service row HTML code that is going to be displayed on the filter results list.
     *
     * @param {Object} service Contains the service record data.
     *
     * @return {String} The HTML code that represents the record on the filter results list.
     */
    function getFilterHtml(service) {
        const name = service.name;

        const info = service.duration + ' min - ' + service.price + ' ' + service.currency;

        return $('<div/>', {
            'class': 'service-row entry',
            'data-id': service.id,
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
     * Select a specific record from the current filter results. If the service id does not exist
     * in the list then no record will be selected.
     *
     * @param {Number} id The record id to be selected from the filter results.
     * @param {Boolean} show Optional (false), if true then the method will display the record on the form.
     */
    function select(id, show = false) {
        $filterServices.find('.selected').removeClass('selected');

        $filterServices.find('.service-row[data-id="' + id + '"]').addClass('selected');

        if (show) {
            const service = filterResults.find((filterResult) => Number(filterResult.id) === Number(id));

            App.Pages.Services.display(service);

            $('#edit-service, #delete-service').prop('disabled', false);
            setRecordDetailsVisible(true);
        }
    }

    /**
     * Update the service-category list box.
     *
     * Use this method every time a change is made to the service categories db table.
     */
    function updateAvailableServiceCategories() {
        App.Http.ServiceCategories.search('', 999).then((response) => {
            $serviceCategoryId.empty();

            $serviceCategoryId.append(new Option('', '')).val('');

            response.forEach((serviceCategory) => {
                $serviceCategoryId.append(new Option(serviceCategory.name, serviceCategory.id));
            });
        });
    }

    /**
     * Initialize the module.
     */
    function initialize() {
        App.Pages.Services.resetForm();
        App.Pages.Services.filter('');
        App.Pages.Services.addEventListeners();
        updateAvailableServiceCategories();
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
        addEventListeners,
    };
})();
