<?php
/**
 * Local variables.
 *
 * @var string $company_name
 */
?>

<div id="header" class="mb-6 mt-4">
    <div id="steps" class="flex items-center justify-center gap-3">
        <div id="step-1" class="book-step active-step"
             data-tippy-content="<?= lang('select_service') ?>">
            <strong>1</strong>
        </div>

        <div id="step-2" class="book-step"
             data-tippy-content="<?= lang('select_provider') ?>">
            <strong>2</strong>
        </div>
        <div id="step-3" class="book-step"
             data-tippy-content="<?= lang('appointment_date_and_time') ?>">
            <strong>3</strong>
        </div>
        <div id="step-4" class="book-step"
             data-tippy-content="<?= lang('customer_information') ?>">
            <strong>4</strong>
        </div>
        <div id="step-5" class="book-step"
             data-tippy-content="<?= lang('appointment_confirmation') ?>">
            <strong>5</strong>
        </div>
    </div>
</div>
