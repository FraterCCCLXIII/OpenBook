<?php extend('layouts/booking_layout'); ?>

<?php section('content'); ?>
<div class="wizard-frame booking-section">
    <div class="frame-container">
        <h2 class="frame-title">My Bookings</h2>

        <div class="flex justify-center mt-6">
            <ul class="booking-tab-list" id="bookings-tabs" role="tablist">
            <li class="nav-item" role="presentation">
                <button class="booking-tab active" id="current-tab" data-bs-toggle="pill" data-bs-target="#current"
                        type="button" role="tab">
                    Current
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="booking-tab" id="past-tab" data-bs-toggle="pill" data-bs-target="#past" type="button"
                        role="tab">
                    Past
                </button>
            </li>
            </ul>
        </div>

        <div class="tab-content mt-6" id="bookings-tabs-content">
            <?php
            $current_appointments = [];
            $past_appointments = [];
            $now = time();

            foreach (vars('appointments') as $row) {
                if (strtotime($row['appointment']['start_datetime']) >= $now) {
                    $current_appointments[] = $row;
                } else {
                    $past_appointments[] = $row;
                }
            }
            ?>

            <div class="tab-pane fade show active" id="current" role="tabpanel">
                <?php if (empty($current_appointments)): ?>
                    <div class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                        You have no upcoming appointments.
                    </div>
                <?php else: ?>
                    <div class="overflow-x-auto rounded-xl border border-[var(--bs-border-color,#e2e8f0)]">
                        <table class="w-full min-w-[480px] text-left text-sm">
                            <thead class="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                            <tr>
                                <th class="px-4 py-3">Service</th>
                                <th class="px-4 py-3">Provider</th>
                                <th class="px-4 py-3">Date & Time</th>
                                <th class="px-4 py-3">Status</th>
                                <th class="px-4 py-3 text-right"></th>
                            </tr>
                            </thead>
                            <tbody class="divide-y divide-[var(--bs-border-color,#e2e8f0)]">
                            <?php foreach ($current_appointments as $row): ?>
                                <?php
                                $appointment = $row['appointment'];
                                $service = $row['service'];
                                $provider = $row['provider'];
                                ?>
                                <tr class="bg-white border-b border-[var(--bs-border-color,#e2e8f0)] last:border-b-0">
                                    <td class="px-4 py-3 font-medium text-slate-900"><?= e($service['name'] ?? '-') ?></td>
                                    <td class="px-4 py-3 text-slate-700">
                                        <?= e(($provider['first_name'] ?? '') . ' ' . ($provider['last_name'] ?? '')) ?>
                                    </td>
                                    <td class="px-4 py-3 text-slate-700">
                                        <?= e(format_date_time($appointment['start_datetime'])) ?>
                                    </td>
                                    <td class="px-4 py-3">
                                        <span class="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                                            <?= e($appointment['status'] ?? '-') ?>
                                        </span>
                                    </td>
                                    <td class="px-4 py-3 text-right">
                                        <a href="<?= site_url('booking/reschedule/' . $appointment['hash']) ?>"
                                           class="inline-flex items-center rounded-xl border border-[var(--bs-border-color,#e2e8f0)] px-3 py-2 text-sm font-medium text-slate-700 hover:border-[var(--bs-border-color,#e2e8f0)] hover:text-slate-900">
                                            Edit
                                        </a>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                <?php endif; ?>
            </div>

            <div class="tab-pane fade" id="past" role="tabpanel">
                <?php if (empty($past_appointments)): ?>
                    <div class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                        You have no past appointments.
                    </div>
                <?php else: ?>
                    <div class="overflow-x-auto rounded-xl border border-[var(--bs-border-color,#e2e8f0)]">
                        <table class="w-full min-w-[480px] text-left text-sm">
                            <thead class="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                            <tr>
                                <th class="px-4 py-3">Service</th>
                                <th class="px-4 py-3">Provider</th>
                                <th class="px-4 py-3">Date & Time</th>
                                <th class="px-4 py-3">Status</th>
                            </tr>
                            </thead>
                            <tbody class="divide-y divide-[var(--bs-border-color,#e2e8f0)]">
                            <?php foreach ($past_appointments as $row): ?>
                                <?php
                                $appointment = $row['appointment'];
                                $service = $row['service'];
                                $provider = $row['provider'];
                                ?>
                                <tr class="bg-white border-b border-[var(--bs-border-color,#e2e8f0)] last:border-b-0">
                                    <td class="px-4 py-3 font-medium text-slate-900"><?= e($service['name'] ?? '-') ?></td>
                                    <td class="px-4 py-3 text-slate-700">
                                        <?= e(($provider['first_name'] ?? '') . ' ' . ($provider['last_name'] ?? '')) ?>
                                    </td>
                                    <td class="px-4 py-3 text-slate-700">
                                        <?= e(format_date_time($appointment['start_datetime'])) ?>
                                    </td>
                                    <td class="px-4 py-3">
                                        <span class="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                            <?= e($appointment['status'] ?? '-') ?>
                                        </span>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>
<?php end_section('content'); ?>
