<?php extend('layouts/booking_layout'); ?>

<?php section('content'); ?>
<div>
    <div class="frame-container">
        <h2 class="frame-title">Welcome <?= e(vars('customer')['first_name'] ?? '') ?>!</h2>

        <div class="flex flex-col gap-4 mt-6">
            <a href="<?= site_url('booking') ?>" class="booking-card !flex flex-col items-start p-6 no-underline">
                <div class="text-slate-400 mb-2">
                    <i data-lucide="calendar-plus" class="w-7 h-7"></i>
                </div>
                <div class="text-left">
                    <div class="font-bold text-xl mb-0.5">
                        Book Session
                    </div>
                    <div class="booking-card-subtitle text-sm">
                        Schedule a new appointment
                    </div>
                </div>
            </a>

            <a href="<?= site_url('customer/bookings') ?>" class="booking-card !flex flex-col items-start p-6 no-underline">
                <div class="text-slate-400 mb-2">
                    <i data-lucide="list" class="w-7 h-7"></i>
                </div>
                <div class="text-left">
                    <div class="font-bold text-xl mb-0.5">
                        My Bookings
                    </div>
                    <div class="booking-card-subtitle text-sm">
                        View and manage your sessions
                    </div>
                </div>
            </a>

            <?php if (vars('show_onboarding', false)): ?>
                <div class="booking-card !flex flex-col items-start p-6">
                    <div class="text-left w-full">
                        <div class="font-bold text-xl mb-3">
                            Getting Started
                        </div>
                        <ul class="flex flex-col gap-2" aria-label="Onboarding checklist">
                            <?php foreach (vars('onboarding_items', []) as $item): ?>
                                <?php
                                    $is_complete = !empty($item['complete']);
                                    $icon = $is_complete ? 'check-circle' : 'circle';
                                    $icon_class = $is_complete ? 'text-success' : 'text-slate-300';
                                    $text_class = $is_complete ? 'line-through text-slate-400' : 'text-slate-700';
                                ?>
                                <li class="flex items-center gap-2">
                                    <i data-lucide="<?= $icon ?>" class="w-4 h-4 <?= $icon_class ?>"></i>
                                    <?php if (!empty($item['url']) && !$is_complete): ?>
                                        <a class="text-sm <?= $text_class ?> hover:underline" href="<?= e($item['url']) ?>">
                                            <?= e($item['label'] ?? '') ?>
                                        </a>
                                    <?php else: ?>
                                        <span class="text-sm <?= $text_class ?>">
                                            <?= e($item['label'] ?? '') ?>
                                        </span>
                                    <?php endif; ?>
                                </li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>

<?php end_section('content'); ?>
