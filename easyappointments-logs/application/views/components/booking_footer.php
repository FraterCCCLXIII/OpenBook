<?php
/**
 * Local variables.
 *
 * @var bool $display_login_button
 */
?>

<div id="frame-footer" class="mt-6 text-center">
    <div class="flex justify-center gap-4 text-sm text-slate-500">
        <?php if (vars('display_terms_and_conditions') === '1'): ?>
            <a href="#" class="booking-link" data-modal-open="terms-and-conditions-modal">
                <?= lang('terms_and_conditions') ?>
            </a>
        <?php endif; ?>

        <?php if (vars('display_privacy_policy') === '1'): ?>
            <a href="#" class="booking-link" data-modal-open="privacy-policy-modal">
                <?= lang('privacy_policy') ?>
            </a>
        <?php endif; ?>
    </div>
</div>
