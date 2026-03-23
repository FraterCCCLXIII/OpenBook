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
 * Account service areas page.
 */
App.Pages.AccountServiceAreas = (function () {
    const $saveServiceAreas = $('#save-service-areas');
    const $serviceAreaZipsContainer = $('#account-service-area-zips');
    const $serviceAreaAll = $('#account-service-area-all');
    let serviceAreaZipIds = [];

    function renderServiceAreas() {
        $serviceAreaZipsContainer.empty();

        const serviceAreaZips = vars('service_area_zips') || [];
        const selectedZipIds = vars('service_area_zip_ids') || [];
        serviceAreaZipIds = serviceAreaZips.map((zip) => Number(zip.id));

        const isAllSelected = serviceAreaZipIds.length && selectedZipIds.length >= serviceAreaZipIds.length;
        $serviceAreaAll.prop('checked', isAllSelected);

        serviceAreaZips.forEach((zip) => {
            const checkboxId = `account-service-area-zip-${zip.id}`;
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
                            'checked': isAllSelected || selectedZipIds.includes(Number(zip.id)),
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

        syncServiceAreaInputs();
    }

    function syncServiceAreaInputs() {
        const isAllSelected = $serviceAreaAll.prop('checked');
        $serviceAreaZipsContainer.find('input:checkbox').prop('disabled', isAllSelected);
    }

    function serialize() {
        if ($serviceAreaAll.prop('checked')) {
            return [...serviceAreaZipIds];
        }

        const selected = [];
        $serviceAreaZipsContainer.find('input:checkbox').each((index, checkboxEl) => {
            if ($(checkboxEl).prop('checked')) {
                selected.push($(checkboxEl).attr('data-id'));
            }
        });

        return selected;
    }

    function onSaveClick() {
        const selected = serialize();
        App.Http.Account.saveServiceAreas(selected).done(() => {
            App.Layouts.Backend.displayNotification(lang('settings_saved'));
        });
    }

    function addEventListeners() {
        $saveServiceAreas.on('click', onSaveClick);

        $serviceAreaAll.on('change', () => {
            const isChecked = $serviceAreaAll.prop('checked');
            $serviceAreaZipsContainer.find('input:checkbox')
                .prop('checked', isChecked)
                .prop('disabled', isChecked);
        });

        $serviceAreaZipsContainer.on('change', 'input:checkbox', () => {
            const total = $serviceAreaZipsContainer.find('input:checkbox').length;
            const selected = $serviceAreaZipsContainer.find('input:checkbox:checked').length;
            $serviceAreaAll.prop('checked', total > 0 && selected === total);
            syncServiceAreaInputs();
        });
    }

    function initialize() {
        renderServiceAreas();
        addEventListeners();
    }

    document.addEventListener('DOMContentLoaded', initialize);

    return {};
})();
