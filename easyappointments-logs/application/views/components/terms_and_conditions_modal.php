<?php
/**
 * Local variables.
 *
 * @var string $terms_and_conditions_content
 */
?>

<div id="terms-and-conditions-modal" class="booking-modal" role="dialog" aria-modal="true"
     aria-hidden="true" aria-labelledby="terms-and-conditions-title">
    <div class="booking-modal-panel">
        <div class="flex items-start justify-between gap-4">
            <h4 id="terms-and-conditions-title" class="text-lg font-medium text-slate-900">
                <?= lang('terms_and_conditions') ?>
            </h4>
            <button type="button" class="text-slate-400 hover:text-slate-600"
                    data-modal-close="terms-and-conditions-modal" aria-label="<?= lang('close') ?>">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="mt-4 max-h-[60vh] overflow-y-auto text-sm text-slate-700">
            <?= pure_html($terms_and_conditions_content) ?>
        </div>
        <div class="mt-6 flex justify-end">
            <button type="button"
                    class="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
                    data-modal-close="terms-and-conditions-modal">
                <?= lang('close') ?>
            </button>
        </div>
    </div>
</div>
