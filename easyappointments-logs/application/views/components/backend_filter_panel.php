<?php
/**
 * @var string $filter_id
 * @var string $title
 * @var string|null $add_button_id
 * @var string $container_classes
 * @var string $search_form_classes
 * @var string $search_group_classes
 * @var string $results_classes
 * @var string $add_label
 * @var string $add_icon_classes
 */
?>

<div id="<?= e($filter_id) ?>" class="<?= e($container_classes ?? 'filter-records column col-12 col-md-5 backend-sticky-panel backend-list-panel') ?>">
    <div class="d-flex justify-content-between align-items-center mb-3 backend-list-panel-header">
        <h2 class="backend-page-title mb-0 text-left">
            <?= e($title) ?>
        </h2>

        <?php if (!empty($add_button_id)): ?>
            <div class="ea-button-group">
                <button id="<?= e($add_button_id) ?>" class="btn btn-primary btn-sm">
                    <i class="<?= e($add_icon_classes ?? 'fas fa-plus-square me-2') ?>"></i>
                    <?= e($add_label ?? lang('add')) ?>
                </button>
            </div>
        <?php endif; ?>
    </div>

    <?php slot('after_page_title'); ?>

    <form class="<?= e($search_form_classes ?? 'mb-3 backend-list-panel-search') ?>">
        <div class="<?= e($search_group_classes ?? 'input-group mb-0') ?>">
            <input type="text" class="key form-control" aria-label="keyword">

            <button class="filter btn btn-outline-secondary" type="submit" data-tippy-content="<?= lang('filter') ?>">
                <i class="fas fa-search"></i>
            </button>
        </div>
    </form>

    <div class="<?= e($results_classes ?? 'results backend-list-panel-results') ?>">
        <!-- JS -->
    </div>
</div>
