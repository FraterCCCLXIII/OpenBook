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
 * Account availability page.
 */
App.Pages.AccountAvailability = (function () {
    const $saveAvailability = $('#save-availability');
    const $resetWorkingPlan = $('#reset-working-plan');
    let workingPlanManager;

    function parseJson(value, fallback) {
        if (!value) {
            return fallback;
        }

        try {
            return JSON.parse(value);
        } catch (error) {
            return fallback;
        }
    }

    function setupWorkingPlan() {
        const companyWorkingPlan = parseJson(vars('company_working_plan'), {});
        const workingPlan = parseJson(vars('working_plan'), companyWorkingPlan);
        const workingPlanExceptions = parseJson(vars('working_plan_exceptions'), {});

        workingPlanManager.setup(workingPlan);
        workingPlanManager.setupWorkingPlanExceptions(workingPlanExceptions);
        workingPlanManager.timepickers(false);
    }

    function onSaveAvailabilityClick() {
        const workingPlan = JSON.stringify(workingPlanManager.get());
        const workingPlanExceptions = JSON.stringify(workingPlanManager.getWorkingPlanExceptions());

        App.Http.Account.saveAvailability(workingPlan, workingPlanExceptions).done(() => {
            App.Layouts.Backend.displayNotification(lang('settings_saved'));
        });
    }

    function onResetWorkingPlanClick() {
        const companyWorkingPlan = parseJson(vars('company_working_plan'), {});

        $('.breaks tbody').empty();
        $('.working-plan-exceptions tbody').empty();
        $('.work-start, .work-end').val('');

        workingPlanManager.setup(companyWorkingPlan);
        workingPlanManager.timepickers(false);
    }

    function addEventListeners() {
        $saveAvailability.on('click', onSaveAvailabilityClick);
        $resetWorkingPlan.on('click', onResetWorkingPlanClick);
    }

    function initialize() {
        workingPlanManager = new App.Utils.WorkingPlan();
        workingPlanManager.addEventListeners();

        setupWorkingPlan();
        addEventListeners();
    }

    document.addEventListener('DOMContentLoaded', initialize);

    return {};
})();
