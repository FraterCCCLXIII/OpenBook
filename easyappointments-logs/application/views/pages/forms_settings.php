<?php extend('layouts/backend_layout'); ?>

<?php section('content'); ?>

<div id="forms-settings" class="container backend-page">
    <div class="row settings-layout">
        <div class="col-sm-3 settings-nav-panel ps-0">
            <?php component('settings_nav'); ?>
        </div>
        <div class="col-sm-9 settings-content">
            <div class="d-flex flex-wrap align-items-center justify-content-between mb-4 pb-2 border-bottom-0">
                <h4 class="text-slate-900 mb-3 text-lg font-medium">Forms</h4>
                <a href="<?= site_url('forms_settings/create') ?>" class="btn btn-outline-secondary">
                    <i class="fas fa-plus-square me-2"></i>
                    New Form
                </a>
            </div>

            <div>
                <div class="mb-3">
                    <input type="text" id="forms-search" class="form-control" placeholder="Search forms">
                </div>
                <div id="forms-list" class="d-flex flex-column gap-2">
                    <!-- JS -->
                </div>
            </div>
        </div>
    </div>
</div>

<?php end_section('content'); ?>

<?php section('scripts'); ?>

<script src="<?= asset_url('assets/js/http/forms_http_client.js') ?>"></script>
<script src="<?= asset_url('assets/js/pages/forms_settings_list.js') ?>"></script>

<?php end_section('scripts'); ?>
