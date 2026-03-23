<?php
/**
 * Local variables.
 *
 * @var string $cookie_notice_content
 */
?>
<div id="cookie-notice-modal" class="booking-modal" role="dialog" aria-modal="true"
     aria-hidden="true" aria-labelledby="cookie-notice-title">
    <div class="booking-modal-panel">
        <div class="flex items-start justify-between gap-4">
            <h4 id="cookie-notice-title" class="text-lg font-medium text-slate-900">
                <?= lang('cookie_notice') ?>
            </h4>
            <button type="button" class="text-slate-400 hover:text-slate-600"
                    data-modal-close="cookie-notice-modal" aria-label="<?= lang('close') ?>">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="mt-4 max-h-[60vh] overflow-y-auto text-sm text-slate-700">
            <?= pure_html($cookie_notice_content) ?>
        </div>
        <div class="mt-6 flex justify-end">
            <button type="button"
                    class="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
                    data-modal-close="cookie-notice-modal">
                <?= lang('close') ?>
            </button>
        </div>
    </div>
</div>
