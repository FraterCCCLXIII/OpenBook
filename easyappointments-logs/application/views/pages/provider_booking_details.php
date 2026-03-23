<?php extend('layouts/backend_layout'); ?>

<?php section('content'); ?>

<?php
    $appointment = vars('appointment');
    $service = vars('service');
    $customer = vars('customer');
    $provider = vars('provider');
    $duration_minutes = vars('duration_minutes');
    $address = vars('address');
    $status_label = vars('status_label');
    $status_class = vars('status_class');
?>

<div class="container-fluid backend-page" id="provider-booking-details-page">
    <div class="row">
        <div class="col-12 col-lg-8">
            <div class="mb-4 d-flex flex-wrap justify-content-between gap-3">
                <a href="<?= site_url('provider/bookings') ?>" class="btn btn-outline-secondary">
                    <i class="fas fa-arrow-left me-2"></i>
                    Back to Bookings
                </a>
                <a href="<?= site_url('calendar/reschedule/' . e($appointment['hash'])) ?>"
                   class="btn btn-primary">
                    <?= lang('edit') ?>
                </a>
            </div>

            <div class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white p-4">
                <div class="text-lg font-medium text-slate-900">
                    Appointment Details
                </div>
                <div class="mt-4 grid grid-cols-3 gap-4 text-sm text-slate-700">
                    <div>
                        <div class="text-xs font-medium uppercase text-slate-400">Booking ID</div>
                        <div><?= e($appointment['id']) ?></div>
                    </div>
                    <div>
                        <div class="text-xs font-medium uppercase text-slate-400">Booking Code</div>
                        <div><?= e($appointment['hash']) ?></div>
                    </div>
                    <div>
                        <div class="text-xs font-medium uppercase text-slate-400">
                            <?= lang('service') ?>
                        </div>
                        <div><?= e($service['name'] ?? '—') ?></div>
                    </div>
                    <div>
                        <div class="text-xs font-medium uppercase text-slate-400">
                            <?= lang('date') ?>
                        </div>
                        <div><?= e(format_date($appointment['start_datetime'])) ?></div>
                    </div>
                    <div>
                        <div class="text-xs font-medium uppercase text-slate-400">Time</div>
                        <div><?= e(format_time($appointment['start_datetime'])) ?></div>
                    </div>
                    <div>
                        <div class="text-xs font-medium uppercase text-slate-400">
                            <?= lang('duration') ?>
                        </div>
                        <div><?= e($duration_minutes) ?> min</div>
                    </div>
                    <div>
                        <div class="text-xs font-medium uppercase text-slate-400">
                            <?= lang('status') ?>
                        </div>
                        <div>
                            <span class="inline-flex rounded-full px-3 py-1 text-xs font-medium <?= e($status_class) ?>">
                                <?= e($status_label) ?>
                            </span>
                        </div>
                    </div>
                    <div>
                        <div class="text-xs font-medium uppercase text-slate-400">
                            <?= lang('provider') ?>
                        </div>
                        <div>
                            <?= e(trim(($provider['first_name'] ?? '') . ' ' . ($provider['last_name'] ?? ''))) ?>
                        </div>
                    </div>
                    <div>
                        <div class="text-xs font-medium uppercase text-slate-400">
                            <?= lang('customer') ?>
                        </div>
                        <div>
                            <?= e(trim(($customer['first_name'] ?? '') . ' ' . ($customer['last_name'] ?? ''))) ?>
                        </div>
                    </div>
                    <div class="col-span-3">
                        <div class="text-xs font-medium uppercase text-slate-400">
                            <?= lang('address') ?>
                        </div>
                        <div><?= e($address ?: '—') ?></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php end_section('content'); ?>
