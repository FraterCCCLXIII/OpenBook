<?php
/**
 * Local variables.
 *
 * @var bool $disabled (false)
 * @var array $values ([])
 * @var string|null $name_prefix (null)
 * @var bool $show_all (false)
 * @var array|null $fields (null)
 */

$disabled = $disabled ?? false;
$values = $values ?? [];
$name_prefix = $name_prefix ?? null;
$show_all = $show_all ?? false;
$fields = $fields ?? null;
?>

<?php if (is_array($fields)): ?>
    <?php foreach ($fields as $field): ?>
        <?php
        $display = (bool) ($field['is_displayed'] ?? true);
        if (!$display && !$show_all) {
            continue;
        }
        $hidden_class = !$display ? ' d-none custom-field-hidden' : '';
        $field_id = (int) ($field['id'] ?? 0);
        $field_type = $field['field_type'] ?? 'input';
        $options = $field['options'] ?? [];
        if (is_string($options)) {
            $decoded = json_decode($options, true);
            if (is_array($decoded)) {
                $options = $decoded;
            } else {
                $options = preg_split('/\r\n|\r|\n/', $options);
            }
        }
        if (!is_array($options)) {
            $options = [];
        }
        $options = array_values(array_filter(array_map('trim', $options), fn ($option) => $option !== ''));
        $raw_value = $values[$field_id] ?? '';
        if (!is_array($raw_value) && is_string($raw_value)) {
            $decoded_value = json_decode($raw_value, true);
            if (is_array($decoded_value)) {
                $raw_value = $decoded_value;
            }
        }
        $selected_values = is_array($raw_value) ? $raw_value : [];
        $selected_value = is_array($raw_value) ? '' : $raw_value;
        $label_for = in_array($field_type, ['radio', 'checkboxes'], true) ? '' : 'custom-field-' . $field_id;
        ?>
        <div class="mb-3 custom-field-item<?= $hidden_class ?>"
             data-custom-field-id="<?= $field_id ?>"
             data-field-type="<?= e($field_type) ?>">
            <label <?= $label_for ? 'for="' . e($label_for) . '"' : '' ?> class="form-label">
                <?= $field['label'] ? e($field['label']) : lang('custom_field') ?>
                <?php if (!empty($field['is_required'])): ?>
                    <span class="text-danger" <?= $disabled ? 'hidden' : '' ?>>*</span>
                <?php endif; ?>
            </label>
            <?php if ($field_type === 'dropdown'): ?>
                <select id="custom-field-<?= $field_id ?>"
                        class="<?= !empty($field['is_required']) ? 'required' : '' ?> form-select custom-field-input"
                        data-custom-field-id="<?= $field_id ?>"
                        data-field-type="dropdown"
                        <?= $name_prefix ? 'name="' . e($name_prefix) . '[' . $field_id . ']"' : '' ?>
                        <?= $disabled ? 'disabled' : '' ?>>
                    <option value=""></option>
                    <?php foreach ($options as $index => $option): ?>
                        <option value="<?= e($option) ?>" <?= (string) $selected_value === (string) $option ? 'selected' : '' ?>>
                            <?= e($option) ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            <?php elseif ($field_type === 'radio'): ?>
                <div class="d-flex flex-column gap-2">
                    <?php foreach ($options as $index => $option): ?>
                        <?php $option_id = 'custom-field-' . $field_id . '-option-' . $index; ?>
                        <div class="form-check">
                            <input type="radio"
                                   id="<?= e($option_id) ?>"
                                   class="<?= !empty($field['is_required']) ? 'required' : '' ?> form-check-input custom-field-input"
                                   name="<?= $name_prefix ? e($name_prefix) . '[' . $field_id . ']' : 'custom_field_' . $field_id ?>"
                                   value="<?= e($option) ?>"
                                   data-custom-field-id="<?= $field_id ?>"
                                   data-field-type="radio"
                                   <?= (string) $selected_value === (string) $option ? 'checked' : '' ?>
                                   <?= $disabled ? 'disabled' : '' ?>/>
                            <label class="form-check-label" for="<?= e($option_id) ?>"><?= e($option) ?></label>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php elseif ($field_type === 'checkboxes'): ?>
                <div class="d-flex flex-column gap-2">
                    <?php foreach ($options as $index => $option): ?>
                        <?php $option_id = 'custom-field-' . $field_id . '-option-' . $index; ?>
                        <div class="form-check">
                            <input type="checkbox"
                                   id="<?= e($option_id) ?>"
                                   class="<?= !empty($field['is_required']) ? 'required' : '' ?> form-check-input custom-field-input"
                                   name="<?= $name_prefix ? e($name_prefix) . '[' . $field_id . '][]' : 'custom_field_' . $field_id . '[]' ?>"
                                   value="<?= e($option) ?>"
                                   data-custom-field-id="<?= $field_id ?>"
                                   data-field-type="checkboxes"
                                   <?= in_array((string) $option, array_map('strval', $selected_values), true) ? 'checked' : '' ?>
                                   <?= $disabled ? 'disabled' : '' ?>/>
                            <label class="form-check-label" for="<?= e($option_id) ?>"><?= e($option) ?></label>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php elseif ($field_type === 'date'): ?>
                <input type="date"
                       id="custom-field-<?= $field_id ?>"
                       class="<?= !empty($field['is_required']) ? 'required' : '' ?> form-control custom-field-input"
                       data-custom-field-id="<?= $field_id ?>"
                       data-field-type="date"
                       <?= $name_prefix ? 'name="' . e($name_prefix) . '[' . $field_id . ']"' : '' ?>
                       value="<?= e($selected_value) ?>"
                       <?= $disabled ? 'disabled' : '' ?>/>
            <?php else: ?>
                <input type="text"
                       id="custom-field-<?= $field_id ?>"
                       class="<?= !empty($field['is_required']) ? 'required' : '' ?> form-control custom-field-input"
                       maxlength="255"
                       data-custom-field-id="<?= $field_id ?>"
                       data-field-type="input"
                       <?= $name_prefix ? 'name="' . e($name_prefix) . '[' . $field_id . ']"' : '' ?>
                       value="<?= e($selected_value) ?>"
                       <?= $disabled ? 'disabled' : '' ?>/>
            <?php endif; ?>
        </div>
    <?php endforeach; ?>
<?php else: ?>
    <?php for ($i = 1; $i <= 5; $i++): ?>
        <?php
        $display = (bool) setting('display_custom_field_' . $i);
        if (!$display && !$show_all) {
            continue;
        }
        $hidden_class = !$display ? ' d-none custom-field-hidden' : '';
        ?>
            <div class="mb-3 custom-field-item<?= $hidden_class ?>"
                 data-custom-field-index="<?= $i ?>"
                 data-field-type="input">
                <label for="custom-field-<?= $i ?>" class="form-label">
                    <?= setting('label_custom_field_' . $i) ?: lang('custom_field') . ' #' . $i ?>
                    <?php if (setting('require_custom_field_' . $i)): ?>
                        <span class="text-danger" <?= $disabled ? 'hidden' : '' ?>>*</span>
                    <?php endif; ?>
                </label>
                <input type="text" id="custom-field-<?= $i ?>"
                       class="<?= setting('require_custom_field_' . $i) ? 'required' : '' ?> form-control"
                       maxlength="120"
                       <?= $name_prefix ? 'name="' . e($name_prefix) . '[custom_field_' . $i . ']"' : '' ?>
                       value="<?= e($values['custom_field_' . $i] ?? '') ?>"
                       <?= $disabled ? 'disabled' : '' ?>/>
            </div>
    <?php endfor; ?>
<?php endif; ?>
