<?php
/**
 * Local variables.
 *
 * @var string $page_title
 */
?>

<nav id="booking-top-nav" class="sticky top-0 z-50 border-b border-[var(--bs-border-color,#e2e8f0)] bg-white/90 backdrop-blur"
     aria-label="Booking">
    <div class="flex w-full items-center px-4 py-3">
        <div class="flex w-1/3 items-center justify-start">
            <?php if (vars('page_title') === 'Dashboard' || vars('page_title') === 'Customer Login'): ?>
                <a href="https://usegoodness.com"
                   class="inline-flex items-center rounded-xl border border-[var(--bs-border-color,#e2e8f0)] px-3 py-1 text-sm text-slate-600 hover:border-[var(--bs-border-color,#e2e8f0)] hover:text-slate-800">
                    <i class="fas fa-arrow-left mr-2"
                       style="width: 14px; height: 14px; font-size: 14px; display: inline-flex; align-items: center; justify-content: center;"></i>
                    Return to Site
                </a>
            <?php else: ?>
                <a href="<?= site_url('dashboard') ?>" id="top-nav-back-button"
                   class="inline-flex h-9 items-center rounded-xl border border-[var(--bs-border-color,#e2e8f0)] px-4 py-1 text-base leading-none text-slate-600 hover:border-[var(--bs-border-color,#e2e8f0)] hover:text-slate-800">
                    <i class="fas fa-arrow-left mr-2"
                       style="width: 16px; height: 16px; font-size: 16px; display: inline-flex; align-items: center; justify-content: center;"></i>
                    Back
                </a>
            <?php endif; ?>
        </div>
        <div class="flex w-1/3 justify-center text-slate-900">
            <?php component('company_logo', [
                'company_logo' => vars('company_logo'),
                'company_name' => vars('company_name'),
                'height' => 32,
                'class' => 'block h-8 w-auto',
            ]); ?>
        </div>
        <div class="flex w-1/3 justify-end">
            <?php if (customer_logged_in()): ?>
                <div class="flex items-center gap-3">
                    <div class="relative">
                        <button class="inline-flex items-center gap-2 rounded-full px-2 py-1 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                type="button"
                                id="customer-account-dropdown"
                                data-dropdown-toggle="customer-account-dropdown-menu"
                                aria-expanded="false" aria-controls="customer-account-dropdown-menu">
                            <i class="fas fa-user-circle"
                               style="width: 18px; height: 18px; font-size: 18px; display: inline-flex; align-items: center; justify-content: center;"></i>
                            <i class="fas fa-chevron-down"
                               style="width: 8px; height: 8px; font-size: 8px; display: inline-flex; align-items: center; justify-content: center;"></i>
                        </button>
                        <ul id="customer-account-dropdown-menu" class="booking-dropdown booking-dropdown-animated hidden" role="menu"
                            aria-labelledby="customer-account-dropdown">
                            <li>
                                <a class="block rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
                                   href="<?= site_url('dashboard') ?>">
                                    Dashboard
                                </a>
                            </li>
                            <li>
                                <a class="block rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
                                   href="<?= site_url('customer/bookings') ?>">
                                    My Bookings
                                </a>
                            </li>
                            <li>
                                <a class="block rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
                                   href="<?= site_url('customer/account') ?>">
                                    Account Settings
                                </a>
                            </li>
                            <?php if (vars('show_customer_forms_link', false)): ?>
                                <li>
                                    <a class="block rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
                                       href="<?= site_url('customer/forms') ?>">
                                        Forms
                                    </a>
                                </li>
                            <?php endif; ?>
                            <?php if (filter_var(setting('display_language_selector', '1'), FILTER_VALIDATE_BOOLEAN)): ?>
                            <li>
                                <hr class="my-2 border-[var(--bs-border-color,#e2e8f0)]">
                            </li>
                            <li class="px-3 py-2">
                                <small class="mb-1 block text-xs text-slate-500">Language</small>
                                <select id="select-language" class="form-select">
                                    <?php foreach (vars('available_languages') as $available_language): ?>
                                        <option value="<?= $available_language ?>"
                                            <?= config('language') === $available_language ? 'selected' : '' ?>>
                                            <?= ucfirst($available_language) ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </li>
                            <li>
                                <hr class="my-2 border-[var(--bs-border-color,#e2e8f0)]">
                            </li>
                            <?php endif; ?>
                            <li>
                                <a class="block rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
                                   href="<?= site_url('customer/logout') ?>">
                                    Logout
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            <?php else: ?>
                <?php if (filter_var(setting('display_language_selector', '1'), FILTER_VALIDATE_BOOLEAN)): ?>
                <div class="relative">
                    <button class="inline-flex items-center text-slate-600 hover:text-slate-900" type="button"
                            id="language-dropdown" data-dropdown-toggle="language-dropdown-menu"
                            aria-expanded="false" aria-controls="language-dropdown-menu">
                        <i class="fas fa-language"
                           style="width: 14px; height: 14px; font-size: 14px; display: inline-flex; align-items: center; justify-content: center;"></i>
                    </button>
                    <ul id="language-dropdown-menu" class="booking-dropdown booking-dropdown-animated hidden" role="menu"
                        aria-labelledby="language-dropdown">
                        <li class="px-3 py-2">
                            <small class="mb-1 block text-xs text-slate-500">Language</small>
                            <select id="select-language" class="form-select">
                                <?php foreach (vars('available_languages') as $available_language): ?>
                                    <option value="<?= $available_language ?>"
                                        <?= config('language') === $available_language ? 'selected' : '' ?>>
                                        <?= ucfirst($available_language) ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </li>
                    </ul>
                </div>
                <?php endif; ?>
            <?php endif; ?>
        </div>
    </div>
</nav>
