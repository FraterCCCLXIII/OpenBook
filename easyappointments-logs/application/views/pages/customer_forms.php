<?php extend('layouts/booking_layout'); ?>

<?php section('content'); ?>

<div class="wizard-frame booking-section px-4 sm:px-5">
    <div class="frame-container">
        <h2 class="frame-title">My Forms</h2>

        <div class="mt-6 w-full overflow-hidden rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white">
            <table class="w-full text-left text-sm" id="customer-forms-table">
                <thead class="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500 border-b border-[var(--bs-border-color,#e2e8f0)]">
                <tr>
                    <th class="px-4 py-3">Form</th>
                    <th class="px-4 py-3">Status</th>
                    <th class="px-4 py-3 text-right">Action</th>
                </tr>
                </thead>
                <tbody id="customer-forms-body" class="divide-y divide-[var(--bs-border-color,#e2e8f0)]">
                    <!-- JS -->
                </tbody>
            </table>
        </div>
    </div>
</div>

<?php end_section('content'); ?>

<?php section('scripts'); ?>

<script src="<?= asset_url('assets/js/http/customer_forms_http_client.js') ?>"></script>
<script src="<?= asset_url('assets/js/pages/customer_forms.js') ?>"></script>

<?php end_section('scripts'); ?>
