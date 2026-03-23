<?php
/**
 * Local variables.
 *
 * @var string $subject
 * @var string $message
 * @var array $settings
 */
?>
<html lang="en">
<head>
    <title><?= $subject ?> | Easy!Appointments</title>
</head>
<body style="font: 13px arial, helvetica, tahoma;">

<div class="email-container" style="width: 650px; border: 1px solid var(--bs-border-color, #e2e8f0); border-radius: 16px; margin: 30px auto; overflow: hidden;">
    <div id="header" style="padding: 18px 15px; text-align: center;">
        <?php if (!empty($settings['company_logo_email_png'])): ?>
            <img src="<?= e($settings['company_logo_email_png']) ?>" alt="<?= e($settings['company_name']) ?>"
                 style="height: 28px; display: inline-block;">
        <?php else: ?>
            <strong id="logo" style="color: #0f172a; font-size: 20px; display: inline-block;">
                <?= e($settings['company_name']) ?>
            </strong>
        <?php endif; ?>
    </div>

    <div id="content" style="padding: 10px 15px; min-height: 400px">
        <h2>
            <?= $subject ?>
        </h2>
        <p>
            <?= $message ?>
        </p>
    </div>

    <div id="footer" style="padding: 14px 10px; text-align: center; margin-top: 10px;
                border-top: 1px solid var(--bs-border-color, #e2e8f0); background: #FAFAFA;">
        <a href="<?= $settings['company_link'] ?>" style="text-decoration: none;" target="_blank">
            <?= e($settings['company_name']) ?>
        </a>
        <div style="color: #64748b; font-size: 12px; margin-top: 6px;">
            &copy; <?= date('Y') ?> <a href="<?= $settings['company_link'] ?>" style="text-decoration: none; color: inherit;" target="_blank">
                <?= e($settings['company_name']) ?>
            </a>
        </div>
    </div>
</div>

</body>
</html>
