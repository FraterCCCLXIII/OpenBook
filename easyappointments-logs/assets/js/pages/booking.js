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
 * Booking page.
 *
 * This module implements the functionality of the booking page
 *
 * Old Name: FrontendBook
 */
App.Pages.Booking = (function () {
    const $selectDate = $('#select-date');
    const $selectService = $('#select-service');
    const $selectProvider = $('#select-provider');
    const $serviceCardList = $('#service-card-list');
    const $providerCardList = $('#provider-card-list');
    const $providerCardContainer = $('#provider-card-container');
    const $selectTimezone = $('#select-timezone');
    const $firstName = $('#first-name');
    const $lastName = $('#last-name');
    const $email = $('#email');
    const $phoneNumber = $('#phone-number');
    const $address = $('#address');
    const $city = $('#city');
    const $zipCode = $('#zip-code');
    const $notes = $('#notes');
    const $captchaTitle = $('.captcha-title');
    const $availableHours = $('#available-hours');
    const $bookAppointmentSubmit = $('#book-appointment-submit');
    const $deletePersonalInformation = $('#delete-personal-information');
    const $displayBookingSelection = $('.display-booking-selection');
    const $serviceAreaZipRequired = $('#service-area-zip-required');
    const $serviceAreaNoProviders = $('#service-area-no-providers');
    const $serviceAreaAddZip = $('#service-area-add-zip');
    const $serviceAreaUpdateAddress = $('#service-area-update-address');
    const tippy = window.tippy;
    const moment = window.moment;

    /**
     * Custom Date Picker logic.
     */
    const customDatePicker = {
        $monthsContainer: $('#months-container'),
        $datesContainer: $('#dates-container'),
        currentMonth: moment().month(),
        currentYear: moment().year(),
        selectedDay: moment().date(),

        monthNames: [
            lang('january_short'), lang('february_short'), lang('march_short'),
            lang('april_short'), lang('may_short'), lang('june_short'),
            lang('july_short'), lang('august_short'), lang('september_short'),
            lang('october_short'), lang('november_short'), lang('december_short')
        ],

        dayNames: [
            lang('sunday_short'), lang('monday_short'), lang('tuesday_short'),
            lang('wednesday_short'), lang('thursday_short'), lang('friday_short'),
            lang('saturday_short')
        ],

        initialize: function () {
            this.addEventListeners();
            this.update();
        },

        update: function () {
            this.$monthsContainer.empty();
            this.$datesContainer.empty();

            const $selectedDateParagraph = $('#selected-date');
            const flatpickr = $selectDate[0]?._flatpickr;

            if (!flatpickr) {
                return;
            }

            const minDate = moment(flatpickr.config.minDate);
            const maxDate = moment(flatpickr.config.maxDate);
            const disabledDates = flatpickr.config.disable.map(d => moment(d).format('YYYY-MM-DD'));

            // Update selected date paragraph
            $selectedDateParagraph.text(lang('select_time'));

            // Render Months
            this.monthNames.forEach((month, index) => {
                const monthDate = moment([this.currentYear, index, 1]);
                const isPast = monthDate.isBefore(minDate, 'month');
                const isFuture = monthDate.isAfter(maxDate, 'month');

                const $monthDiv = $('<div/>', {
                    'class': 'month' + (index === this.currentMonth ? ' selected' : '') + (isPast || isFuture ? ' disabled' : ''),
                    'text': month,
                    'data-index': index
                });
                this.$monthsContainer.append($monthDiv);
            });

            // Render Dates
            const numDays = moment([this.currentYear, this.currentMonth]).daysInMonth();
            for (let i = 1; i <= numDays; i++) {
                const dateMoment = moment([this.currentYear, this.currentMonth, i]);
                const dateString = dateMoment.format('YYYY-MM-DD');
                const isPast = dateMoment.isBefore(minDate, 'day');
                const isFuture = dateMoment.isAfter(maxDate, 'day');
                const isDisabled = disabledDates.includes(dateString);
                const dayName = this.dayNames[dateMoment.day()];

                const $dateDiv = $('<div/>', {
                    'class': 'date' + (i === this.selectedDay ? ' selected' : '') + (isPast || isFuture || isDisabled ? ' disabled' : ''),
                    'data-day': i,
                    'html': `<span class="day-name">${dayName}</span><span class="day-number">${i}</span>`
                });
                this.$datesContainer.append($dateDiv);
            }

            this.centerSelectedMonth();

            this.centerSelectedDate();
        },

        addEventListeners: function () {
            let isScrolling = false;
            let startX, startY;

            const handlePointerDown = (event) => {
                isScrolling = false;
                startX = event.clientX;
                startY = event.clientY;
            };

            const handlePointerMove = (event) => {
                if (Math.abs(event.clientX - startX) > 5 || Math.abs(event.clientY - startY) > 5) {
                    isScrolling = true;
                }
            };

            this.$monthsContainer.on('pointerdown', handlePointerDown);
            this.$monthsContainer.on('pointermove', handlePointerMove);
            this.$monthsContainer.on('click', '.month', (event) => {
                const $target = $(event.currentTarget);
                if (!isScrolling && !$target.hasClass('disabled')) {
                    this.currentMonth = parseInt($target.data('index'), 10);
                    this.selectedDay = null; // Reset day when month changes
                    this.update();

                    // Load unavailable dates for the new month
                    const displayedMonthMoment = moment([this.currentYear, this.currentMonth, 1]);
                    App.Http.Booking.getUnavailableDates(
                        $selectProvider.val(),
                        $selectService.val(),
                        displayedMonthMoment.format('YYYY-MM-DD')
                    );
                }
            });

            this.$datesContainer.on('pointerdown', handlePointerDown);
            this.$datesContainer.on('pointermove', handlePointerMove);
            this.$datesContainer.on('click', '.date', (event) => {
                const $target = $(event.currentTarget);
                if (!isScrolling && !$target.hasClass('disabled')) {
                    this.selectedDay = parseInt($target.data('day'), 10);
                    this.update();

                    const selectedDate = moment([this.currentYear, this.currentMonth, this.selectedDay]);
                    App.Utils.UI.setDateTimePickerValue($selectDate, selectedDate.toDate());
                    App.Http.Booking.getAvailableHours(selectedDate.format('YYYY-MM-DD'));
                    App.Pages.Booking.updateConfirmFrame();
                }
            });
        },

        centerSelectedMonth: function () {
            const monthsContainer = this.$monthsContainer.get(0);
            const selectedMonth = this.$monthsContainer.find('.month.selected').get(0);

            if (!monthsContainer || !selectedMonth) {
                return;
            }

            const containerWidth = monthsContainer.clientWidth;
            const maxScrollLeft = Math.max(0, monthsContainer.scrollWidth - containerWidth);
            const containerRect = monthsContainer.getBoundingClientRect();
            const monthRect = selectedMonth.getBoundingClientRect();

            // Calculate month position relative to the scroll container viewport
            // and convert it to a scrollLeft target.
            const targetScrollLeft =
                monthsContainer.scrollLeft +
                (monthRect.left - containerRect.left) -
                (containerWidth / 2) +
                (monthRect.width / 2);
            const clampedScrollLeft = Math.max(0, Math.min(targetScrollLeft, maxScrollLeft));

            this.$monthsContainer.stop().animate({ scrollLeft: clampedScrollLeft }, 250);
        },

        centerSelectedDate: function () {
            const datesContainer = this.$datesContainer.get(0);
            const selectedDate = this.$datesContainer.find('.date.selected').get(0);

            if (!datesContainer || !selectedDate) {
                return;
            }

            const containerWidth = datesContainer.clientWidth;
            const maxScrollLeft = Math.max(0, datesContainer.scrollWidth - containerWidth);
            const containerRect = datesContainer.getBoundingClientRect();
            const dateRect = selectedDate.getBoundingClientRect();

            // Center the selected day (which is also the next available day on initial load)
            // and clamp to valid scroll bounds.
            const targetScrollLeft =
                datesContainer.scrollLeft +
                (dateRect.left - containerRect.left) -
                (containerWidth / 2) +
                (dateRect.width / 2);
            const clampedScrollLeft = Math.max(0, Math.min(targetScrollLeft, maxScrollLeft));

            this.$datesContainer.stop().animate({ scrollLeft: clampedScrollLeft }, 250);
        },
    };

    /**
     * Determines the functionality of the page.
     *
     * @type {Boolean}
     */
    let manageMode = vars('manage_mode') || false;
    let serviceAreaProviderIds = null;

    const wizardState = {
        storageKey: `EasyAppointments.BookingWizardStep.${window.location.pathname}`,
        minStep: 1,
        maxStep: 5,
        get: function () {
            try {
                const stored = window.sessionStorage.getItem(this.storageKey);
                const step = Number.parseInt(stored, 10);
                if (Number.isInteger(step) && step >= this.minStep && step <= this.maxStep) {
                    return step;
                }
            } catch (error) {
                return null;
            }
            return null;
        },
        set: function (step) {
            if (!Number.isInteger(step)) {
                return;
            }
            try {
                window.sessionStorage.setItem(this.storageKey, String(step));
            } catch (error) {
                // Ignore storage failures (private mode, etc.)
            }
        },
    };

    /**
     * Detect the month step.
     *
     * @param previousDateTimeMoment
     * @param nextDateTimeMoment
     *
     * @returns {Number}
     */
    function detectDatepickerMonthChangeStep(previousDateTimeMoment, nextDateTimeMoment) {
        return previousDateTimeMoment.isAfter(nextDateTimeMoment) ? -1 : 1;
    }

    /**
     * Initialize the module.
     */
    function initialize() {
        if (Boolean(Number(vars('display_cookie_notice'))) && window?.cookieconsent) {
            cookieconsent.initialise({
                palette: {
                    popup: {
                        background: '#ffffffbd',
                        text: '#666666',
                    },
                    button: {
                        background: '#429a82',
                        text: '#ffffff',
                    },
                },
                content: {
                    message: lang('website_using_cookies_to_ensure_best_experience'),
                    dismiss: 'OK',
                },
            });

            const $cookieNoticeLink = $('.cc-link');

            $cookieNoticeLink.replaceWith(
                $('<a/>', {
                    'data-modal-open': 'cookie-notice-modal',
                    'href': '#',
                    'class': 'cc-link',
                    'text': $cookieNoticeLink.text(),
                }),
            );
        }

        manageMode = vars('manage_mode');

        // Initialize page's components (tooltips, date pickers etc).
        tippy('[data-tippy-content]');

        let monthTimeout;

        App.Utils.UI.initializeDatePicker($selectDate, {
            inline: true,
            minDate: moment().subtract(1, 'day').set({hours: 23, minutes: 59, seconds: 59}).toDate(),
            maxDate: moment().add(vars('future_booking_limit'), 'days').toDate(),
            onChange: (selectedDates) => {
                App.Http.Booking.getAvailableHours(moment(selectedDates[0]).format('YYYY-MM-DD'));
                App.Pages.Booking.updateConfirmFrame();
                updateCustomDatePicker();
            },

            onMonthChange: (selectedDates, dateStr, instance) => {
                $selectDate.parent().fadeTo(400, 0.3); // Change opacity during loading

                if (monthTimeout) {
                    clearTimeout(monthTimeout);
                }

                monthTimeout = setTimeout(() => {
                    const previousMoment = moment(instance.selectedDates[0]);

                    const displayedMonthMoment = moment(
                        instance.currentYearElement.value +
                            '-' +
                            String(Number(instance.monthsDropdownContainer.value) + 1).padStart(2, '0') +
                            '-01',
                    );

                    const monthChangeStep = detectDatepickerMonthChangeStep(previousMoment, displayedMonthMoment);

                    App.Http.Booking.getUnavailableDates(
                        $selectProvider.val(),
                        $selectService.val(),
                        displayedMonthMoment.format('YYYY-MM-DD'),
                        monthChangeStep,
                    );
                }, 500);
            },

            onYearChange: (selectedDates, dateStr, instance) => {
                setTimeout(() => {
                    const previousMoment = moment(instance.selectedDates[0]);

                    const displayedMonthMoment = moment(
                        instance.currentYearElement.value +
                            '-' +
                            (Number(instance.monthsDropdownContainer.value) + 1) +
                            '-01',
                    );

                    const monthChangeStep = detectDatepickerMonthChangeStep(previousMoment, displayedMonthMoment);

                    App.Http.Booking.getUnavailableDates(
                        $selectProvider.val(),
                        $selectService.val(),
                        displayedMonthMoment.format('YYYY-MM-DD'),
                        monthChangeStep,
                    );
                }, 500);
            },
        });

        App.Utils.UI.setDateTimePickerValue($selectDate, new Date());

        customDatePicker.initialize();

        const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const isTimezoneSupported = $selectTimezone.find(`option[value="${browserTimezone}"]`).length > 0;
        $selectTimezone.val(isTimezoneSupported ? browserTimezone : 'UTC');

        // Bind the event handlers (might not be necessary every time we use this class).
        addEventListeners();

        optimizeContactInfoDisplay();

        applyCustomFieldValues(vars('custom_field_values') || {});

        const serviceOptionCount = $selectService.find('option').length;

        if (serviceOptionCount === 2) {
            $selectService.find('option[value=""]').remove();
            const firstServiceId = $selectService.find('option:first').attr('value');
            $selectService.val(firstServiceId).trigger('change');
        }

        // If the manage mode is true, the appointment data should be loaded by default.
        if (manageMode) {
            applyAppointmentData(vars('appointment_data'), vars('provider_data'), vars('customer_data'));

            $('#wizard-frame-1')
                .css({
                    'visibility': 'visible',
                    'display': 'none',
                })
                .fadeIn();
        } else {
            // Check if a specific service was selected (via URL parameter).
            const selectedServiceId = App.Utils.Url.queryParam('service');

            if (selectedServiceId && $selectService.find('option[value="' + selectedServiceId + '"]').length > 0) {
                $selectService.val(selectedServiceId);
            }

            $selectService.trigger('change'); // Load the available hours.

            // Check if a specific provider was selected.
            const selectedProviderId = App.Utils.Url.queryParam('provider');

            if (selectedProviderId && $selectProvider.find('option[value="' + selectedProviderId + '"]').length === 0) {
                // Select a service of this provider in order to make the provider available in the select box.
                for (const index in vars('available_providers')) {
                    const provider = vars('available_providers')[index];
                    const providerServiceIds = normalizeProviderServiceIds(provider);

                    if (Number(provider.id) === Number(selectedProviderId) && providerServiceIds.length > 0) {
                        $selectService.val(providerServiceIds[0]).trigger('change');
                    }
                }
            }

            if (selectedProviderId && $selectProvider.find('option[value="' + selectedProviderId + '"]').length > 0) {
                $selectProvider.val(selectedProviderId).trigger('change');
            }

            if (
                (selectedServiceId && selectedProviderId) ||
                (vars('available_services').length === 1 && vars('available_providers').length === 1)
            ) {
                if (!selectedServiceId) {
                    $selectService.val(vars('available_services')[0].id).trigger('change');
                }

                if (!selectedProviderId) {
                    $selectProvider.val(vars('available_providers')[0].id).trigger('change');
                }

                $('.active-step').removeClass('active-step');
                $('#step-3').addClass('active-step');
                $('#wizard-frame-1').hide();
                $('#wizard-frame-2').hide();
                $('#wizard-frame-3').fadeIn();
                wizardState.set(3);
                updateNextButtons();

                const $bookSteps = $(document).find('.book-step');
                $bookSteps.eq(0).hide();
                $bookSteps.eq(1).hide();

                $(document).find('.button-back:first').css('visibility', 'hidden');

                updateStepIndicators();
            } else {
                $('#wizard-frame-1')
                    .css({
                        'visibility': 'visible',
                        'display': 'none',
                    })
                    .fadeIn();
            }

            prefillFromQueryParam('#first-name', 'first_name');
            prefillFromQueryParam('#last-name', 'last_name');
            prefillFromQueryParam('#email', 'email');
            prefillFromQueryParam('#phone-number', 'phone');
            prefillFromQueryParam('#address', 'address');
            prefillFromQueryParam('#city', 'city');
            prefillFromQueryParam('#zip-code', 'zip');
            prefillFromCustomerAccount();
        }

        restoreWizardStep();
        updateNextButtons();
    }

    function prefillFromCustomerAccount() {
        if (!vars('customer_logged_in')) {
            return;
        }

        const customerData = vars('customer_data');

        if (!customerData) {
            return;
        }

        $firstName.val($firstName.val() || customerData.first_name || '');
        $lastName.val($lastName.val() || customerData.last_name || '');
        $email.val($email.val() || customerData.email || '');
        $phoneNumber.val($phoneNumber.val() || customerData.phone_number || '');
        $address.val($address.val() || customerData.address || '');
        $city.val($city.val() || customerData.city || '');
        $zipCode.val($zipCode.val() || customerData.zip_code || '');

        $email.prop('readonly', true).attr('aria-readonly', 'true');
    }

    function syncServiceCardSelection(serviceId) {
        const normalizedServiceId = String(serviceId || '');

        $serviceCardList.find('.service-card').each((index, cardEl) => {
            const $card = $(cardEl);
            const cardServiceId = String($card.data('serviceId') || '');
            const isSelected = normalizedServiceId !== '' && cardServiceId === normalizedServiceId;

            $card.toggleClass('active', isSelected);
            $card.attr('aria-checked', isSelected ? 'true' : 'false');
        });
    }

    function syncProviderCardSelection(providerId) {
        const normalizedProviderId = String(providerId || '');

        $providerCardList.find('.provider-card').each((index, cardEl) => {
            const $card = $(cardEl);
            const cardProviderId = String($card.data('providerId') || '');
            const isSelected = normalizedProviderId !== '' && cardProviderId === normalizedProviderId;

            $card.toggleClass('active', isSelected);
            $card.attr('aria-checked', isSelected ? 'true' : 'false');
        });
    }

    function areRequiredFieldsFilled() {
        let isValid = true;
        const checkedGroups = new Set();

        $('#wizard-frame-4 .required:visible').each((index, requiredField) => {
            const $requiredField = $(requiredField);
            const fieldType = ($requiredField.attr('type') || '').toLowerCase();
            const fieldId = $requiredField.data('custom-field-id') || $requiredField.attr('name');

            if (fieldType === 'checkbox' || fieldType === 'radio') {
                if (!fieldId || checkedGroups.has(fieldId)) {
                    return;
                }

                const $group = $('#wizard-frame-4')
                    .find(`[data-custom-field-id="${fieldId}"][type="${fieldType}"]`);
                if (!$group.filter(':checked').length) {
                    isValid = false;
                    return false;
                }
                checkedGroups.add(fieldId);
                return;
            }

            if (!$requiredField.val()) {
                isValid = false;
                return false;
            }
        });

        return isValid;
    }

    function isNextEnabledForStep(stepIndex) {
        if (stepIndex === 1) {
            return Boolean($selectService.val());
        }

        if (stepIndex === 2) {
            return Boolean($selectProvider.val());
        }

        if (stepIndex === 3) {
            return Boolean($('.selected-hour').length);
        }

        if (stepIndex === 4) {
            return areRequiredFieldsFilled();
        }

        return true;
    }

    function updateNextButtons() {
        $('.button-next').each((index, buttonEl) => {
            const $button = $(buttonEl);
            const stepIndex = Number($button.data('step_index'));
            const isEnabled = isNextEnabledForStep(stepIndex);

            $button.prop('disabled', !isEnabled);
            $button.toggleClass('disabled', !isEnabled);
            $button.attr('aria-disabled', (!isEnabled).toString());
        });
    }

    function updateStepIndicators() {
        $(document).find('.book-step:visible').each((index, bookStepEl) => {
            $(bookStepEl).find('strong').text(index + 1);
        });
    }

    function getHighestRestorableStep() {
        let maxStep = 1;

        $('#step-4').show();

        if (!isNextEnabledForStep(1)) {
            updateStepIndicators();
            return maxStep;
        }

        maxStep = 2;

        if (!isNextEnabledForStep(2)) {
            updateStepIndicators();
            return maxStep;
        }

        maxStep = 3;

        if (!isNextEnabledForStep(3)) {
            updateStepIndicators();
            return maxStep;
        }

        maxStep = 4;

        // Skip step 4 (Customer Information) if the profile is complete.
        if (vars('customer_logged_in') && vars('customer_data')) {
            const customer = vars('customer_data');
            const isComplete = customer.first_name && customer.last_name && customer.address;
            if (isComplete) {
                maxStep = 5;

                // Hide step 4 in the breadcrumbs if it's skipped.
                $('#step-4').hide();
                updateStepIndicators();
                return maxStep;
            }
        }

        if (!isNextEnabledForStep(4)) {
            updateStepIndicators();
            return maxStep;
        }

        updateStepIndicators();
        return 5;
    }

    function getCurrentWizardStep() {
        const $activeStep = $('.book-step.active-step');
        if ($activeStep.length) {
            const activeId = $activeStep.attr('id') || '';
            if (activeId.startsWith('step-')) {
                const activeStep = Number.parseInt(activeId.replace('step-', ''), 10);
                if (Number.isInteger(activeStep)) {
                    return activeStep;
                }
            }
        }

        const $visibleFrame = $('.wizard-frame:visible').first();
        if ($visibleFrame.length) {
            const frameId = $visibleFrame.attr('id') || '';
            if (frameId.startsWith('wizard-frame-')) {
                const frameStep = Number.parseInt(frameId.replace('wizard-frame-', ''), 10);
                if (Number.isInteger(frameStep)) {
                    return frameStep;
                }
            }
        }

        return null;
    }

    function showWizardStep(stepIndex, { animate } = {}) {
        const targetIndex = Number.parseInt(stepIndex, 10);

        if (!Number.isInteger(targetIndex)) {
            return false;
        }

        const $targetFrame = $('#wizard-frame-' + targetIndex);
        if (!$targetFrame.length) {
            return false;
        }

        if (targetIndex === 1) {
            $('#wizard-frame-1').css('visibility', 'visible');
        }

        $('.wizard-frame').hide();
        $('.active-step').removeClass('active-step');
        $('#step-' + targetIndex).addClass('active-step');
        updateCompletedSteps(targetIndex);

        if (animate) {
            $targetFrame.fadeIn();
        } else {
            $targetFrame.show();
        }

        return true;
    }

    function updateCompletedSteps(activeIndex) {
        $('.book-step').each(function () {
            const stepIndex = parseInt(this.id.replace('step-', ''));
            $(this).toggleClass('completed-step', stepIndex < activeIndex);
        });
    }

    function restoreWizardStep() {
        const storedStep = wizardState.get();
        const currentStep = getCurrentWizardStep();
        const maxStep = getHighestRestorableStep();
        let targetStep = storedStep || currentStep || 1;

        if (targetStep > maxStep) {
            targetStep = maxStep;
        }

        // If targetStep is 4 but profile is complete, jump to 5.
        if (targetStep === 4 && vars('customer_logged_in') && vars('customer_data')) {
            const customer = vars('customer_data');
            const isComplete = customer.first_name && customer.last_name && customer.address;
            if (isComplete) {
                targetStep = 5;
                App.Pages.Booking.updateConfirmFrame();
            }
        }

        if (targetStep <= 2 && !$('#step-' + targetStep).is(':visible')) {
            targetStep = currentStep || 1;
        }

        if (showWizardStep(targetStep, { animate: false })) {
            wizardState.set(targetStep);
        }
    }

    function clearWizardState() {
        try {
            window.sessionStorage.removeItem(wizardState.storageKey);
        } catch (error) {
            // Ignore storage failures (private mode, etc.)
        }
    }

    function renderProviderCards() {
        $providerCardList.empty();

        const providerOptions = $selectProvider.find('option').filter((index, option) => $(option).val() !== '');

        providerOptions.each((index, option) => {
            const $option = $(option);
            const providerId = $option.val();
            const providerName = $option.text();

            $('<button/>', {
                type: 'button',
                class: 'booking-card provider-card',
                'data-provider-id': providerId,
                role: 'radio',
                'aria-checked': 'false',
                text: providerName,
            }).appendTo($providerCardList);
        });

        syncProviderCardSelection($selectProvider.val());
        updateNextButtons();
    }

    function getSelectedService() {
        const serviceId = $selectService.val();
        if (!serviceId) {
            return null;
        }

        return (vars('available_services') || []).find(
            (service) => Number(service.id) === Number(serviceId),
        );
    }

    function isServiceAreaOnlyService(service) {
        if (!service) {
            return false;
        }

        const value =
            service.service_area_only ??
            service.serviceAreaOnly ??
            service.service_area ??
            service.serviceArea ??
            null;

        if (typeof value === 'boolean') {
            return value;
        }

        if (typeof value === 'number') {
            return value === 1;
        }

        if (typeof value === 'string') {
            const normalized = value.trim().toLowerCase();
            return normalized === '1' || normalized === 'true' || normalized === 'yes';
        }

        return false;
    }

    function normalizeProviderServiceIds(provider) {
        const rawServices = provider?.services;

        if (Array.isArray(rawServices)) {
            return rawServices
                .map((service) => {
                    if (typeof service === 'object' && service !== null) {
                        return service.id ?? service.id_services ?? service.service_id ?? null;
                    }
                    return service;
                })
                .map((serviceId) => Number(serviceId))
                .filter((serviceId) => Number.isFinite(serviceId));
        }

        if (typeof rawServices === 'string') {
            try {
                const parsed = JSON.parse(rawServices);
                if (Array.isArray(parsed)) {
                    return parsed
                        .map((serviceId) => Number(serviceId))
                        .filter((serviceId) => Number.isFinite(serviceId));
                }
            } catch (error) {
                // Ignore JSON parse failures and fall back to CSV parsing.
            }

            return rawServices
                .split(',')
                .map((serviceId) => Number(serviceId.trim()))
                .filter((serviceId) => Number.isFinite(serviceId));
        }

        return [];
    }

    function updateServiceAreaProviders(serviceId) {
        const service = getSelectedService();
        if (!service || !isServiceAreaOnlyService(service)) {
            serviceAreaProviderIds = null;
            updateServiceAreaScreens();
            return $.Deferred().resolve().promise();
        }

        const zipCode = ($zipCode.val() || '').trim();
        if (!zipCode) {
            serviceAreaProviderIds = [];
            updateServiceAreaScreens();
            return $.Deferred().resolve().promise();
        }

        const countryCode = vars('default_service_area_country') || 'US';
        return App.Http.Booking.serviceAreaProviders(serviceId, zipCode, countryCode).then((response) => {
            serviceAreaProviderIds = response.provider_ids || [];
            updateServiceAreaScreens();
        });
    }

    function renderProvidersForService(serviceId) {
        $selectProvider.empty();
        $selectProvider.append(new Option(lang('please_select'), ''));

        vars('available_providers').forEach((provider) => {
            const providerServiceIds = normalizeProviderServiceIds(provider);
            const canServeService = providerServiceIds.some(
                (providerServiceId) => Number(providerServiceId) === Number(serviceId),
            );

            if (!canServeService) {
                return;
            }

            if (Array.isArray(serviceAreaProviderIds)) {
                const providerId = Number(provider.id);
                if (!serviceAreaProviderIds.includes(providerId)) {
                    return;
                }
            }

            $selectProvider.append(new Option(provider.first_name + ' ' + provider.last_name, provider.id));
        });

        const providerOptionCount = $selectProvider.find('option').length;

        if (providerOptionCount === 2) {
            $selectProvider.find('option[value=""]').remove();
        }

        const service = getSelectedService();
        const allowAnyProvider = !service || !isServiceAreaOnlyService(service);
        if (providerOptionCount > 2 && allowAnyProvider && Boolean(Number(vars('display_any_provider')))) {
            $(new Option(lang('any_provider'), 'any-provider')).insertAfter($selectProvider.find('option:first'));
        }

        renderProviderCards();
        updateServiceAreaScreens();
    }

    function updateServiceAreaScreens() {
        const service = getSelectedService();
        const isServiceAreaOnly = isServiceAreaOnlyService(service);
        const zipCode = ($zipCode.val() || '').trim();

        if (!isServiceAreaOnly) {
            $serviceAreaZipRequired.addClass('hidden');
            $serviceAreaNoProviders.addClass('hidden');
            $providerCardList.removeClass('hidden');
            return;
        }

        if (!zipCode) {
            $serviceAreaZipRequired.removeClass('hidden');
            $serviceAreaNoProviders.addClass('hidden');
            $providerCardList.addClass('hidden');
            return;
        }

        if (Array.isArray(serviceAreaProviderIds) && serviceAreaProviderIds.length === 0) {
            $serviceAreaZipRequired.addClass('hidden');
            $serviceAreaNoProviders.removeClass('hidden');
            $providerCardList.addClass('hidden');
            return;
        }

        $serviceAreaZipRequired.addClass('hidden');
        $serviceAreaNoProviders.addClass('hidden');
        $providerCardList.removeClass('hidden');
    }

    function prefillFromQueryParam(field, param) {
        const $target = $(field);

        if (!$target.length) {
            return;
        }

        $target.val(App.Utils.Url.queryParam(param));
    }

    /**
     * Remove empty columns and center elements if needed.
     */
    function optimizeContactInfoDisplay() {
        // If a column has only one control shown then move the control to the other column.

        const $firstCol = $('#wizard-frame-4 .field-col:first');
        const $firstColControls = $firstCol.find('.form-control');
        const $secondCol = $('#wizard-frame-4 .field-col:last');
        const $secondColControls = $secondCol.find('.form-control');

        if ($firstColControls.length === 1 && $secondColControls.length > 1) {
            $firstColControls.each((index, controlEl) => {
                $(controlEl).parent().insertBefore($secondColControls.first().parent());
            });
        }

        if ($secondColControls.length === 1 && $firstColControls.length > 1) {
            $secondColControls.each((index, controlEl) => {
                $(controlEl).parent().insertAfter($firstColControls.last().parent());
            });
        }

        // Hide columns that do not have any controls displayed.

        const $fieldCols = $(document).find('#wizard-frame-4 .field-col');

        $fieldCols.each((index, fieldColEl) => {
            const $fieldCol = $(fieldColEl);

            if (!$fieldCol.find('.form-control').length) {
                $fieldCol.hide();
            }
        });
    }

    /**
     * Add the page event listeners.
     */
    function addEventListeners() {
        /**
         * Event: Timezone "Changed"
         */
        $selectTimezone.on('change', () => {
            const date = App.Utils.UI.getDateTimePickerValue($selectDate);

            if (!date) {
                return;
            }

            App.Http.Booking.getAvailableHours(moment(date).format('YYYY-MM-DD'));

            App.Pages.Booking.updateConfirmFrame();
        });

        /**
         * Event: Selected Provider "Changed"
         *
         * Whenever the provider changes the available appointment date - time periods must be updated.
         */
        $selectProvider.on('change', (event) => {
            const $target = $(event.target);

            const todayDateTimeObject = new Date();
            const todayDateTimeMoment = moment(todayDateTimeObject);

            App.Utils.UI.setDateTimePickerValue($selectDate, todayDateTimeObject);

            App.Http.Booking.getUnavailableDates(
                $target.val(),
                $selectService.val(),
                todayDateTimeMoment.format('YYYY-MM-DD'),
            );

            App.Pages.Booking.updateConfirmFrame();
            syncProviderCardSelection($selectProvider.val());
            updateNextButtons();
        });

        /**
         * Event: Selected Service "Changed"
         *
         * When the user clicks on a service, its available providers should
         * become visible.
         */
        $selectService.on('change', (event) => {
            const $target = $(event.target);
            const serviceId = $selectService.val();
            const shouldShowProviders = Boolean(serviceId);

            if ($providerCardContainer.length) {
                $providerCardContainer.toggleClass('hidden', !shouldShowProviders);
                $providerCardContainer.attr('aria-hidden', (!shouldShowProviders).toString());
            }

            updateServiceAreaProviders(serviceId).then(() => {
                renderProvidersForService(serviceId);

                App.Http.Booking.getUnavailableDates(
                    $selectProvider.val(),
                    $target.val(),
                    moment(App.Utils.UI.getDateTimePickerValue($selectDate)).format('YYYY-MM-DD'),
                );
            });

            App.Pages.Booking.updateConfirmFrame();

            App.Pages.Booking.updateServiceDescription(serviceId);
            syncServiceCardSelection(serviceId);
            updateNextButtons();
        });

        $zipCode.on('input', () => {
            const serviceId = $selectService.val();
            if (!serviceId) {
                return;
            }

            updateServiceAreaProviders(serviceId).then(() => {
                renderProvidersForService(serviceId);
            });
        });

        if ($serviceAreaAddZip.length) {
            $serviceAreaAddZip.on('click', () => {
                if (showWizardStep(4, { animate: true })) {
                    wizardState.set(4);
                }
            });
        }

        if ($serviceAreaUpdateAddress.length) {
            $serviceAreaUpdateAddress.on('click', () => {
                if (showWizardStep(4, { animate: true })) {
                    wizardState.set(4);
                }
            });
        }

        $serviceCardList.on('click', '.service-card', (event) => {
            const $card = $(event.currentTarget);
            const serviceId = $card.data('serviceId');

            if (!serviceId) {
                return;
            }

            $selectService.val(serviceId).trigger('change');
        });

        $providerCardList.on('click', '.provider-card', (event) => {
            const $card = $(event.currentTarget);
            const providerId = $card.data('providerId');

            if (!providerId) {
                return;
            }

            $selectProvider.val(providerId).trigger('change');
        });

        /**
         * Event: Next Step Button "Clicked"
         *
         * This handler is triggered every time the user pressed the "next" button on the book wizard.
         * Some special tasks might be performed, depending on the current wizard step.
         */
        $('.button-next').on('click', (event) => {
            const $target = $(event.currentTarget);

            // If we are on the first step and there is no service selected do not continue with the next step.
            if ($target.attr('data-step_index') === '1' && !$selectService.val()) {
                return;
            }

            // If we are on the 2nd step and there is no provider selected do not continue with the next step.
            if ($target.attr('data-step_index') === '2' && !$selectProvider.val()) {
                return;
            }

            // If we are on the 3rd step then the user should have an appointment hour selected.
            if ($target.attr('data-step_index') === '3') {
                if (!$('.selected-hour').length) {
                    if (!$('#select-hour-prompt').length) {
                        $('<div/>', {
                            'id': 'select-hour-prompt',
                            'class': 'text-danger mb-4',
                            'text': lang('appointment_hour_missing'),
                        }).prependTo('#available-hours');
                    }
                    return;
                }
            }

            // If we are on the 4th step then we will need to validate the user's input before proceeding to the next
            // step.
            if ($target.attr('data-step_index') === '4') {
                if (!App.Pages.Booking.validateCustomerForm()) {
                    return; // Validation failed, do not continue.
                } else {
                    App.Pages.Booking.updateConfirmFrame();
                }
            }

            // Display the next step tab (uses jquery animation effect).
            let nextTabIndex = parseInt($target.attr('data-step_index')) + 1;

            // Skip step 4 (Customer Information) if the profile is complete.
            if (nextTabIndex === 4 && vars('customer_logged_in') && vars('customer_data')) {
                const customer = vars('customer_data');
                const isComplete = customer.first_name && customer.last_name && customer.address;
                if (isComplete) {
                    nextTabIndex = 5;
                    App.Pages.Booking.updateConfirmFrame();
                }
            }

            $target.closest('.wizard-frame').fadeOut(() => {
                $('.active-step').removeClass('active-step');
                $('#step-' + nextTabIndex).addClass('active-step');
                updateCompletedSteps(nextTabIndex);
                $('#wizard-frame-' + nextTabIndex).fadeIn();
                updateNextButtons();
                wizardState.set(nextTabIndex);
            });

            // Scroll to the top of the page. On a small screen, especially on a mobile device, this is very useful.
            const scrollingElement = document.scrollingElement || document.body;
            if (window.innerHeight < scrollingElement.scrollHeight) {
                scrollingElement.scrollTop = 0;
            }
        });

        /**
         * Event: Back Step Button "Clicked"
         *
         * This handler is triggered every time the user pressed the "back" button on the
         * book wizard.
         */
        $(document).on('click', '.button-back, #top-nav-back-button', (event) => {
            const $activeFrame = $('.wizard-frame:visible');
            const frameId = $activeFrame.attr('id');

            // Only intercept if we are in the booking wizard (frames 2, 3, 4, 5)
            if (frameId && frameId.startsWith('wizard-frame-') && frameId !== 'wizard-frame-1') {
                event.preventDefault();
                event.stopPropagation();

                const currentStepIndex = parseInt(frameId.replace('wizard-frame-', ''));
                let prevTabIndex = currentStepIndex - 1;

                // Skip step 4 (Customer Information) if the profile is complete when going back.
                if (prevTabIndex === 4 && vars('customer_logged_in') && vars('customer_data')) {
                    const customer = vars('customer_data');
                    const isComplete = customer.first_name && customer.last_name && customer.address;
                    if (isComplete) {
                        prevTabIndex = 3;
                        App.Pages.Booking.updateConfirmFrame();
                    }
                }

                $activeFrame.fadeOut(() => {
                    $('.active-step').removeClass('active-step');
                    $('#step-' + prevTabIndex).addClass('active-step');
                    updateCompletedSteps(prevTabIndex);
                    $('#wizard-frame-' + prevTabIndex).fadeIn();
                    updateNextButtons();
                    wizardState.set(prevTabIndex);
                });
            }
            // If we are on the first frame of the booking wizard, we want to go back to the dashboard
            else if (frameId === 'wizard-frame-1') {
                event.preventDefault();
                window.location.href = App.Utils.Url.siteUrl('dashboard');
            }
            // Otherwise, let the default behavior happen (history.back or link)
        });

        /**
         * Event: Available Hour "Click"
         *
         * Triggered whenever the user clicks on an available hour for his appointment.
         */
        $availableHours.on('click', '.available-hour', (event) => {
            $availableHours.find('.selected-hour').removeClass('selected-hour');
            $(event.target).addClass('selected-hour');
            App.Pages.Booking.updateConfirmFrame();
            updateNextButtons();
        });

        $('#wizard-frame-4').on('input change', '.required', () => {
            updateNextButtons();
        });

        if (manageMode) {
            /**
             * Event: Cancel Appointment Button "Click"
             *
             * When the user clicks the "Cancel" button this form is going to be submitted. We need
             * the user to confirm this action because once the appointment is cancelled, it will be
             * deleted from the database.
             *
             * @param {jQuery.Event} event
             */
            $('#cancel-appointment').on('click', () => {
                const $cancelAppointmentForm = $('#cancel-appointment-form');

                let $cancellationReason;

                const buttons = [
                    {
                        text: lang('close'),
                        click: (event, messageModal) => {
                            messageModal.hide();
                        },
                    },
                    {
                        text: lang('confirm'),
                        click: () => {
                            if ($cancellationReason.val() === '') {
                                $cancellationReason.css('border', '2px solid #DC3545');
                                return;
                            }
                            $cancelAppointmentForm.find('#hidden-cancellation-reason').val($cancellationReason.val());
                            $cancelAppointmentForm.submit();
                        },
                    },
                ];

                App.Utils.Message.show(
                    lang('cancel_appointment_title'),
                    lang('write_appointment_removal_reason'),
                    buttons,
                );

                $cancellationReason = $('<textarea/>', {
                    'class': 'form-control mt-2',
                    'id': 'cancellation-reason',
                    'rows': '3',
                    'css': {
                        'width': '100%',
                    },
                }).appendTo('#message-modal .modal-body');

                return false;
            });

            $deletePersonalInformation.on('click', () => {
                const buttons = [
                    {
                        text: lang('cancel'),
                        click: (event, messageModal) => {
                            messageModal.hide();
                        },
                    },
                    {
                        text: lang('delete'),
                        click: () => {
                            App.Http.Booking.deletePersonalInformation(vars('customer_token'));
                        },
                    },
                ];

                App.Utils.Message.show(
                    lang('delete_personal_information'),
                    lang('delete_personal_information_prompt'),
                    buttons,
                );
            });
        }

        /**
         * Event: Book Appointment Form "Submit"
         *
         * Before the form is submitted to the server we need to make sure that in the meantime the selected appointment
         * date/time wasn't reserved by another customer or event.
         *
         * @param {jQuery.Event} event
         */
        $bookAppointmentSubmit.on('click', () => {
            const $acceptToTermsAndConditions = $('#accept-to-terms-and-conditions');

            $acceptToTermsAndConditions.removeClass('is-invalid');

            if ($acceptToTermsAndConditions.length && !$acceptToTermsAndConditions.prop('checked')) {
                $acceptToTermsAndConditions.addClass('is-invalid');
                return;
            }

            const $acceptToPrivacyPolicy = $('#accept-to-privacy-policy');

            $acceptToPrivacyPolicy.removeClass('is-invalid');

            if ($acceptToPrivacyPolicy.length && !$acceptToPrivacyPolicy.prop('checked')) {
                $acceptToPrivacyPolicy.addClass('is-invalid');
                return;
            }

            App.Http.Booking.registerAppointment();
        });

        /**
         * Event: Refresh captcha image.
         */
        $captchaTitle.on('click', 'button', () => {
            $('.captcha-image').attr('src', App.Utils.Url.siteUrl('captcha?' + Date.now()));
        });

        $selectDate.on('mousedown', '.ui-datepicker-calendar td', () => {
            setTimeout(() => {
                App.Http.Booking.applyPreviousUnavailableDates();
            }, 300);
        });
    }

    /**
     * This function validates the customer's data input. The user cannot continue without passing all the validation
     * checks.
     *
     * @return {Boolean} Returns the validation result.
     */
    function validateCustomerForm() {
        $('#wizard-frame-4 .is-invalid').removeClass('is-invalid');
        $('#wizard-frame-4 label.text-danger').removeClass('text-danger');

        // Validate required fields.
        let missingRequiredField = false;

        $('.required').each((index, requiredField) => {
            if (!$(requiredField).val()) {
                $(requiredField).addClass('is-invalid');
                missingRequiredField = true;
            }
        });

        if (missingRequiredField) {
            $('#form-message').text(lang('fields_are_required'));
            return false;
        }

        // Validate email address.
        if ($email.val() && !App.Utils.Validation.email($email.val())) {
            $email.addClass('is-invalid');
            $('#form-message').text(lang('invalid_email'));
            return false;
        }

        // Validate phone number.
        const phoneNumber = $phoneNumber.val();

        if (phoneNumber && !App.Utils.Validation.phone(phoneNumber)) {
            $phoneNumber.addClass('is-invalid');
            $('#form-message').text(lang('invalid_phone'));
            return false;
        }

        return true;
    }

    /**
     * Every time this function is executed, it updates the confirmation page with the latest
     * customer settings and input for the appointment booking.
     */
    function updateConfirmFrame() {
        const serviceId = $selectService.val();
        const providerId = $selectProvider.val();

        $displayBookingSelection.text(`${lang('service')} │ ${lang('provider')}`); // Notice: "│" is a custom ASCII char

        const serviceOptionText = serviceId ? $selectService.find('option:selected').text() : lang('service');
        const providerOptionText = providerId ? $selectProvider.find('option:selected').text() : lang('provider');

        if (serviceId || providerId) {
            $displayBookingSelection.text(`${serviceOptionText} │ ${providerOptionText}`);
        }

        if (!$availableHours.find('.selected-hour').text()) {
            return; // No time is selected, skip the rest of this function...
        }

        // Render the appointment details

        const service = vars('available_services').find(
            (availableService) => Number(availableService.id) === Number(serviceId),
        );

        if (!service) {
            return; // Service was not found
        }

        const selectedDateObject = App.Utils.UI.getDateTimePickerValue($selectDate);
        const selectedDateMoment = moment(selectedDateObject);
        const selectedDate = selectedDateMoment.format('YYYY-MM-DD');
        const selectedTime = $availableHours.find('.selected-hour').text();

        let formattedSelectedDate = '';

        if (selectedDateObject) {
            formattedSelectedDate =
                App.Utils.Date.format(selectedDate, vars('date_format'), vars('time_format'), false) +
                ' ' +
                selectedTime;
        }

        const timezoneOptionText = $selectTimezone.find('option:selected').text();

        const serviceHeadline = providerOptionText
            ? `${serviceOptionText} × ${providerOptionText}`
            : serviceOptionText;
        const servicePrice = Number(service.price || 0);
        const downPaymentType = (service.down_payment_type || 'none').toLowerCase();
        const downPaymentValue = Number(service.down_payment_value || 0);
        let dueNow = servicePrice;

        if (downPaymentType === 'fixed') {
            dueNow = Math.min(servicePrice, Math.max(0, downPaymentValue));
        } else if (downPaymentType === 'percent') {
            dueNow = Math.min(servicePrice, Math.max(0, (servicePrice * downPaymentValue) / 100));
        }

        const dueAtCompletion = Math.max(0, servicePrice - dueNow);

        $('#appointment-details').html(`
            <div class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-slate-50 p-4 text-left">
                <div class="space-y-2">
                    <div class="text-xl font-medium text-slate-900">
                        ${serviceHeadline}
                    </div>
                    <div class="flex items-center gap-2 text-sm text-slate-700">
                        <i class="fas fa-calendar-day text-slate-400"></i>
                        ${formattedSelectedDate}
                    </div>
                    <div class="flex items-center gap-2 text-sm text-slate-700">
                        <i class="fas fa-clock text-slate-400"></i>
                        ${service.duration} ${lang('minutes')}
                    </div>
                    <div class="flex items-center gap-2 text-sm text-slate-700">
                        <i class="fas fa-globe text-slate-400"></i>
                        ${timezoneOptionText}
                    </div>
                    <div class="flex items-center gap-2 text-sm text-slate-700" ${!servicePrice ? 'hidden' : ''}>
                        <i class="fas fa-cash-register text-slate-400"></i>
                        Total: ${servicePrice.toFixed(2)} ${service.currency}
                    </div>
                    <div class="flex items-center gap-2 text-sm text-slate-700" ${!servicePrice ? 'hidden' : ''}>
                        <i class="fas fa-credit-card text-slate-400"></i>
                        Due now: ${dueNow.toFixed(2)} ${service.currency}
                    </div>
                    <div class="flex items-center gap-2 text-sm text-slate-700" ${!servicePrice ? 'hidden' : ''}>
                        <i class="fas fa-hourglass-half text-slate-400"></i>
                        Due at completion: ${dueAtCompletion.toFixed(2)} ${service.currency}
                    </div>
                </div>
            </div>
        `);

        // Render the customer information

        const firstName = App.Utils.String.escapeHtml($firstName.val());
        const lastName = App.Utils.String.escapeHtml($lastName.val());
        const fullName = `${firstName} ${lastName}`.trim();
        const email = App.Utils.String.escapeHtml($email.val());
        const phoneNumber = App.Utils.String.escapeHtml($phoneNumber.val());
        const address = App.Utils.String.escapeHtml($address.val());
        const city = App.Utils.String.escapeHtml($city.val());
        const zipCode = App.Utils.String.escapeHtml($zipCode.val());

        const addressParts = [];

        if (city) {
            addressParts.push(city);
        }

        if (zipCode) {
            addressParts.push(zipCode);
        }

        $('#customer-details').html(`
            <div class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-slate-50 p-4 text-left">
                <div class="space-y-2">
                    <div class="text-xl font-medium text-slate-900">
                        ${lang('contact_info')}
                    </div>
                    <div class="text-sm font-medium text-slate-500" ${!fullName ? 'hidden' : ''}>
                        ${fullName}
                    </div>
                    <div class="text-sm text-slate-700" ${!email ? 'hidden' : ''}>
                        ${email}
                    </div>
                    <div class="text-sm text-slate-700" ${!phoneNumber ? 'hidden' : ''}>
                        ${phoneNumber}
                    </div>
                    <div class="text-sm text-slate-700" ${!address ? 'hidden' : ''}>
                        ${address}
                    </div>
                    <div class="text-sm text-slate-700" ${!addressParts.length ? 'hidden' : ''}>
                        ${addressParts.join(', ')}
                    </div>
                </div>
            </div>
        `);

        // Update appointment form data for submission to server when the user confirms the appointment.

        const data = {};

        data.customer = {
            last_name: $lastName.val(),
            first_name: $firstName.val(),
            email: $email.val(),
            phone_number: $phoneNumber.val(),
            address: $address.val(),
            city: $city.val(),
            zip_code: $zipCode.val(),
            timezone: $selectTimezone.val(),
            custom_fields: getCustomFieldPayload(),
        };

        data.appointment = {
            start_datetime:
                moment(App.Utils.UI.getDateTimePickerValue($selectDate)).format('YYYY-MM-DD') +
                ' ' +
                moment($('.selected-hour').data('value'), 'HH:mm').format('HH:mm') +
                ':00',
            end_datetime: calculateEndDatetime(),
            notes: $notes.val(),
            is_unavailability: false,
            id_users_provider: $selectProvider.val(),
            id_services: $selectService.val(),
        };

        data.manage_mode = Number(manageMode);

        if (manageMode) {
            data.appointment.id = vars('appointment_data').id;
            data.customer.id = vars('customer_data').id;
        }

        $('input[name="post_data"]').val(JSON.stringify(data));
    }

    /**
     * This method calculates the end datetime of the current appointment.
     *
     * End datetime is depending on the service and start datetime fields.
     *
     * @return {String} Returns the end datetime in string format.
     */
    function calculateEndDatetime() {
        // Find selected service duration.
        const serviceId = $selectService.val();

        const service = vars('available_services').find(
            (availableService) => Number(availableService.id) === Number(serviceId),
        );

        // Add the duration to the start datetime.
        const selectedDate = moment(App.Utils.UI.getDateTimePickerValue($selectDate)).format('YYYY-MM-DD');

        const selectedHour = $('.selected-hour').data('value'); // HH:mm

        const startMoment = moment(selectedDate + ' ' + selectedHour);

        let endMoment;

        if (service.duration && startMoment) {
            endMoment = startMoment.clone().add({'minutes': parseInt(service.duration)});
        } else {
            endMoment = moment();
        }

        return endMoment.format('YYYY-MM-DD HH:mm:ss');
    }

    /**
     * This method applies the appointment's data to the wizard so
     * that the user can start making changes on an existing record.
     *
     * @param {Object} appointment Selected appointment's data.
     * @param {Object} provider Selected provider's data.
     * @param {Object} customer Selected customer's data.
     *
     * @return {Boolean} Returns the operation result.
     */
    function applyAppointmentData(appointment, provider, customer) {
        try {
            // Select Service & Provider
            $selectService.val(appointment.id_services).trigger('change');
            $selectProvider.val(appointment.id_users_provider);

            // Set Appointment Date
            const startMoment = moment(appointment.start_datetime);
            App.Utils.UI.setDateTimePickerValue($selectDate, startMoment.toDate());
            App.Http.Booking.getAvailableHours(startMoment.format('YYYY-MM-DD'));

            // Update unavailable dates while in manage mode

            App.Http.Booking.getUnavailableDates(
                appointment.id_users_provider,
                appointment.id_services,
                startMoment.format('YYYY-MM-DD'),
            );

            // Apply Customer's Data
            $lastName.val(customer.last_name);
            $firstName.val(customer.first_name);
            $email.val(customer.email);
            $phoneNumber.val(customer.phone_number);
            $address.val(customer.address);
            $city.val(customer.city);
            $zipCode.val(customer.zip_code);
            if (customer.timezone) {
                $selectTimezone.val(customer.timezone);
            }
            const appointmentNotes = appointment.notes !== null ? appointment.notes : '';
            $notes.val(appointmentNotes);

            applyCustomFieldValues(vars('custom_field_values') || {});

            App.Pages.Booking.updateConfirmFrame();

            return true;
        } catch (exc) {
            return false;
        }
    }

    function parseMultiValue(value) {
        if (Array.isArray(value)) {
            return value.map((item) => String(item));
        }
        if (typeof value === 'string' && value) {
            try {
                const decoded = JSON.parse(value);
                if (Array.isArray(decoded)) {
                    return decoded.map((item) => String(item));
                }
            } catch (error) {
                return [value];
            }
        }
        return [];
    }

    function getCustomFieldPayload() {
        const values = {};
        $('#wizard-frame-4 .custom-field-item[data-custom-field-id]').each((index, item) => {
            const $item = $(item);
            const fieldId = $item.data('custom-field-id');
            const fieldType = $item.data('field-type') || 'input';

            if (!fieldId) {
                return;
            }

            if (fieldType === 'checkboxes') {
                const selected = $item
                    .find('input[type="checkbox"]:checked')
                    .map((_, input) => $(input).val())
                    .get();
                values[fieldId] = selected;
                return;
            }

            if (fieldType === 'radio') {
                values[fieldId] = $item.find('input[type="radio"]:checked').val() || '';
                return;
            }

            if (fieldType === 'dropdown') {
                values[fieldId] = $item.find('select').val() || '';
                return;
            }

            if (fieldType === 'date') {
                values[fieldId] = $item.find('input[type="date"]').val() || '';
                return;
            }

            values[fieldId] = $item.find('.custom-field-input').val() || '';
        });
        return values;
    }

    function applyCustomFieldValues(values) {
        if (!values) {
            return;
        }
        $('#wizard-frame-4 .custom-field-item[data-custom-field-id]').each((index, item) => {
            const $item = $(item);
            const fieldId = $item.data('custom-field-id');
            const fieldType = $item.data('field-type') || 'input';

            if (!fieldId || !Object.prototype.hasOwnProperty.call(values, fieldId)) {
                return;
            }

            const incoming = values[fieldId];

            if (fieldType === 'checkboxes') {
                const selected = parseMultiValue(incoming);
                $item.find('input[type="checkbox"]').each((_, input) => {
                    const $input = $(input);
                    $input.prop('checked', selected.includes(String($input.val())));
                });
                return;
            }

            if (fieldType === 'radio') {
                $item.find('input[type="radio"]').each((_, input) => {
                    const $input = $(input);
                    $input.prop('checked', String($input.val()) === String(incoming));
                });
                return;
            }

            if (fieldType === 'dropdown') {
                $item.find('select').val(incoming);
                return;
            }

            if (fieldType === 'date') {
                $item.find('input[type="date"]').val(incoming);
                return;
            }

            $item.find('.custom-field-input').val(incoming);
        });
    }

    /**
     * Update the service description and information.
     *
     * This method updates the HTML content with a brief description of the
     * user selected service (only if available in db). This is useful for the
     * customers upon selecting the correct service.
     *
     * @param {Number} serviceId The selected service record id.
     */
    function updateServiceDescription(serviceId) {
        const $serviceDescription = $('#service-description');

        $serviceDescription.empty();

        const service = vars('available_services').find(
            (availableService) => Number(availableService.id) === Number(serviceId),
        );

        if (!service) {
            return; // Service not found
        }

        // Render the additional service information

        // Render the service description

        if (service.description?.length) {
            const escapedDescription = App.Utils.String.escapeHtml(service.description);

            const multiLineDescription = escapedDescription.replaceAll('\n', '<br/>');

            $(`
                <div class="text-muted">
                    ${multiLineDescription}
                </div>
            `).appendTo($serviceDescription);
        }
    }

    function updateCustomDatePicker() {
        const selectedDate = App.Utils.UI.getDateTimePickerValue($selectDate);
        if (selectedDate) {
            const m = moment(selectedDate);
            customDatePicker.currentMonth = m.month();
            customDatePicker.currentYear = m.year();
            customDatePicker.selectedDay = m.date();
        }
        customDatePicker.update();
    }

    document.addEventListener('DOMContentLoaded', initialize);

    return {
        manageMode,
        clearWizardState,
        updateConfirmFrame,
        updateServiceDescription,
        validateCustomerForm,
        updateCustomDatePicker,
    };
})();
