<?php
/**
 * Local variables.
 *
 * @var bool $manage_mode
 * @var string $display_terms_and_conditions
 * @var string $display_privacy_policy
 */
?>

<div id="wizard-frame-5" class="wizard-frame booking-section" style="display:none;">
    <div class="frame-container">
        <h2 class="frame-title booking-frame-title"><?= lang('appointment_confirmation') ?></h2>

        <div class="frame-content mt-6">
            <div class="booking-frame-content">
                <div id="appointment-details" class="mb-4 text-left">
                    <!-- JS -->
                </div>

                <div id="customer-details" class="text-left">
                    <!-- JS -->
                </div>
            </div>
        </div>

        <?php slot('after_details'); ?>

        <?php if (setting('require_captcha')): ?>
            <div class="frame-content mt-6">
                <div class="booking-frame-content">
                    <label class="captcha-title inline-flex items-center gap-2 text-sm font-medium text-slate-700"
                           for="captcha-text">
                        CAPTCHA
                        <button class="booking-link text-sm" type="button">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </label>
                    <img class="captcha-image mt-3" src="<?= site_url('captcha') ?>" alt="CAPTCHA">
                    <input id="captcha-text" class="captcha-text form-control mt-3" type="text" value=""/>
                    <span id="captcha-hint" class="help-block" style="opacity:0">&nbsp;</span>
                </div>
            </div>
        <?php endif; ?>

        <?php slot('after_captcha'); ?>
    </div>

    <div class="frame-content mt-6 text-sm">
        <div class="booking-frame-content">
            <?php if ($display_terms_and_conditions): ?>
                <div class="mb-4 flex items-start gap-2">
                    <input type="checkbox" class="required form-check-input mt-1" id="accept-to-terms-and-conditions">
                    <label class="form-check-label" for="accept-to-terms-and-conditions">
                        <?= strtr(lang('read_and_agree_to_terms_and_conditions'), [
                            '{$link}' => '<a href="#" class="booking-link" data-modal-open="terms-and-conditions-modal">',
                            '{/$link}' => '</a>',
                        ]) ?>
                    </label>
                </div>
            <?php endif; ?>

            <?php if ($display_privacy_policy): ?>
                <div class="mb-4 flex items-start gap-2">
                    <input type="checkbox" class="required form-check-input mt-1" id="accept-to-privacy-policy">
                    <label class="form-check-label" for="accept-to-privacy-policy">
                        <?= strtr(lang('read_and_agree_to_privacy_policy'), [
                            '{$link}' => '<a href="#" class="booking-link" data-modal-open="privacy-policy-modal">',
                            '{/$link}' => '</a>',
                        ]) ?>
                    </label>
                </div>
            <?php endif; ?>

            <?php slot('after_select_policies'); ?>
        </div>
    </div>

    <div class="command-buttons mt-6">
        <div class="booking-frame-content">
            <form id="book-appointment-form" class="w-full" method="post">
                <button id="book-appointment-submit" type="button" class="booking-button">
                    <i class="fas fa-check-square mr-2"></i>
                    <?= $manage_mode ? lang('update') : lang('confirm') ?>
                </button>
                <input type="hidden" name="csrfToken"/>
                <input type="hidden" name="post_data"/>
            </form>
        </div>
    </div>
</div>
