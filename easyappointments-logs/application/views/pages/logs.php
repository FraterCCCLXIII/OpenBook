<?php extend('layouts/backend_layout'); ?>

<?php section('content'); ?>
<div id="logs-page" class="container backend-page">
    <div class="row mb-4">
        <div class="col-12">
            <h2 class="backend-page-title mb-0">Logs</h2>
            <p class="text-muted mb-0 mt-2">Audit activity across appointments, customers, and billing actions.</p>
        </div>
    </div>

    <div class="row mb-3 g-2">
        <div class="col-12 col-md-2">
            <label for="logs-start-date" class="form-label small text-muted mb-1">Start Date</label>
            <input type="date" id="logs-start-date" class="form-control form-control-sm">
        </div>
        <div class="col-12 col-md-2">
            <label for="logs-end-date" class="form-label small text-muted mb-1">End Date</label>
            <input type="date" id="logs-end-date" class="form-control form-control-sm">
        </div>
        <div class="col-12 col-md-2">
            <label for="logs-action" class="form-label small text-muted mb-1">Action</label>
            <input type="text" id="logs-action" class="form-control form-control-sm" placeholder="appointment.update">
        </div>
        <div class="col-12 col-md-2">
            <label for="logs-customer-id" class="form-label small text-muted mb-1">Customer ID</label>
            <input type="number" id="logs-customer-id" min="1" class="form-control form-control-sm">
        </div>
        <div class="col-12 col-md-2">
            <label for="logs-appointment-id" class="form-label small text-muted mb-1">Appointment ID</label>
            <input type="number" id="logs-appointment-id" min="1" class="form-control form-control-sm">
        </div>
        <div class="col-12 col-md-2 d-flex align-items-end">
            <button id="logs-apply-filters" class="btn btn-primary btn-sm w-100">Apply</button>
        </div>
    </div>

    <div class="row">
        <div class="col-12">
            <div class="rounded-xl border border-[var(--bs-border-color,#e2e8f0)] bg-white shadow-sm overflow-hidden">
                <div class="table-responsive">
                    <table class="table table-hover mb-0">
                        <thead class="bg-light">
                        <tr>
                            <th class="ps-4">Timestamp</th>
                            <th>Actor</th>
                            <th>Action</th>
                            <th>Entity</th>
                            <th>Customer</th>
                            <th>Appointment</th>
                            <th>Source</th>
                            <th class="pe-4">Details</th>
                        </tr>
                        </thead>
                        <tbody id="logs-table-body">
                        <tr>
                            <td colspan="8" class="text-center py-4 text-muted">Loading activity...</td>
                        </tr>
                        </tbody>
                    </table>
                </div>
                <div class="p-3 border-top d-flex justify-content-between align-items-center">
                    <small id="logs-pagination-meta" class="text-muted">0 results</small>
                    <div class="d-flex gap-2">
                        <button id="logs-prev-page" class="btn btn-outline-secondary btn-sm">Previous</button>
                        <button id="logs-next-page" class="btn btn-outline-secondary btn-sm">Next</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<?php end_section('content'); ?>

<?php section('scripts'); ?>
<script src="<?= asset_url('assets/js/components/activity_timeline.js') ?>"></script>
<script src="<?= asset_url('assets/js/pages/logs.js') ?>"></script>
<?php end_section('scripts'); ?>
