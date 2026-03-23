<?php
/**
 * Company logo.
 *
 * Local variables.
 *
 * @var string $company_name
 * @var string $company_logo
 * @var int|string|null $height
 * @var string|null $class
 */

$logo_height = $height ?? 32;
$logo_class = $class ?? '';
$logo_style = is_numeric($logo_height) ? "height: {$logo_height}px;" : "height: {$logo_height};";
?>

<?php if (!empty($company_logo)): ?>
    <img src="<?= e($company_logo) ?>" alt="<?= e($company_name) ?>" style="<?= e($logo_style) ?>"
         class="<?= e($logo_class) ?>">
<?php else: ?>
    <svg role="img" aria-label="<?= e($company_name) ?>" xmlns="http://www.w3.org/2000/svg"
         viewBox="0 0 242.23 242.23" style="<?= e($logo_style) ?>" class="<?= e($logo_class) ?>">
        <path fill="currentColor"
              d="M242.23,55.9h0c0,30.87-25.03,55.9-55.9,55.9h-82.12C46.66,111.8,0,65.14,0,7.59V0s186.33,0,186.33,0c30.87,0,55.9,25.03,55.9,55.9Z"/>
        <path fill="currentColor"
              d="M242.23,186.33h0c0-30.87-25.03-55.9-55.9-55.9h-82.12C46.66,130.43,0,177.09,0,234.65v7.59s186.33,0,186.33,0c30.87,0,55.9-25.03,55.9-55.9Z"/>
    </svg>
<?php endif; ?>
