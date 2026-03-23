<?php
/**
 * Local variables.
 *
 * @var string $subject
 * @var string $message
 * @var array $appointment
 * @var array $service
 * @var array $customer
 * @var array $settings
 * @var string $payment_link
 */
?>

<html lang="en">
<head>
    <title>
        <?= e($subject) ?> | Easy!Appointments
    </title>
</head>
<body style="font: 13px arial, helvetica, tahoma;">
<div style="width: 650px; border: 1px solid var(--bs-border-color, #e2e8f0); border-radius: 16px; margin: 30px auto; overflow: hidden;">
    <div style="padding: 18px 15px; text-align: center;">
        <?php if (!empty($settings['company_logo_email_png'])): ?>
            <img src="<?= e($settings['company_logo_email_png']) ?>" alt="<?= e($settings['company_name']) ?>"
                 style="height: 28px; display: inline-block;">
        <?php else: ?>
            <strong style="color: #0f172a; font-size: 20px; display: inline-block;">
                <?= e($settings['company_name']) ?>
            </strong>
        <?php endif; ?>
    </div>

    <div style="padding: 10px 15px;">
        <h2><?= e($subject) ?></h2>
        <p><?= e($message) ?></p>
        <p>Hello <?= e(trim(($customer['first_name'] ?? '') . ' ' . ($customer['last_name'] ?? ''))) ?>,</p>
        <p>Please complete your payment for your upcoming appointment using the secure link below.</p>

        <table>
            <tr>
                <td style="padding: 3px; font-weight: bold;">Service</td>
                <td style="padding: 3px;"><?= e($service['name'] ?? '') ?></td>
            </tr>
            <tr>
                <td style="padding: 3px; font-weight: bold;">Start</td>
                <td style="padding: 3px;"><?= format_date_time($appointment['start_datetime']) ?></td>
            </tr>
            <tr>
                <td style="padding: 3px; font-weight: bold;">End</td>
                <td style="padding: 3px;"><?= format_date_time($appointment['end_datetime']) ?></td>
            </tr>
            <tr>
                <td style="padding: 3px; font-weight: bold;">Amount</td>
                <td style="padding: 3px;"><?= number_format((float) ($appointment['payment_amount'] ?? 0), 2) ?></td>
            </tr>
        </table>

        <p style="margin-top: 14px;">
            <a href="<?= e($payment_link) ?>" target="_blank"><?= e($payment_link) ?></a>
        </p>
        <p>If you prefer to pay by phone, please contact our office and mention your appointment hash: <?= e($appointment['hash']) ?>.</p>
    </div>

    <div style="padding: 14px 10px; text-align: center; margin-top: 10px; border-top: 1px solid var(--bs-border-color, #e2e8f0); background: #FAFAFA;">
        <a href="<?= e($settings['company_link']) ?>" style="text-decoration: none;" target="_blank">
            <?= e($settings['company_name']) ?>
        </a>
    </div>
</div>
</body>
</html>
