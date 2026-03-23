<?php
/**
 * Local variables.
 *
 * @var string $privacy_policy_content
 */
?>

<div id="privacy-policy-modal" class="booking-modal" role="dialog" aria-modal="true"
     aria-hidden="true" aria-labelledby="privacy-policy-title">
    <div class="booking-modal-panel">
        <div class="flex items-start justify-between gap-4">
            <h4 id="privacy-policy-title" class="text-lg font-medium text-slate-900">
                <?= lang('privacy_policy') ?>
            </h4>
            <button type="button" class="text-slate-400 hover:text-slate-600"
                    data-modal-close="privacy-policy-modal" aria-label="<?= lang('close') ?>">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="mt-4 max-h-[60vh] overflow-y-auto text-sm text-slate-700">
            <?= pure_html($privacy_policy_content) ?>
        </div>
        <div class="mt-6 flex justify-end">
            <button type="button"
                    class="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
                    data-modal-close="privacy-policy-modal">
                <?= lang('close') ?>
            </button>
        </div>
    </div>
</div>
