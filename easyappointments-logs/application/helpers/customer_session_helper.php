<?php defined('BASEPATH') or exit('No direct script access allowed');

/* ----------------------------------------------------------------------------
 * Easy!Appointments - Online Appointment Scheduler
 *
 * @package     EasyAppointments
 * @author      A.Tselegidis <alextselegidis@gmail.com>
 * @copyright   Copyright (c) Alex Tselegidis
 * @license     https://opensource.org/licenses/GPL-3.0 - GPLv3
 * @link        https://easyappointments.org
 * @since       v1.5.0
 * ---------------------------------------------------------------------------- */

if (!function_exists('customer_logged_in')) {
    /**
     * Check if customer is logged in.
     */
    function customer_logged_in(): bool
    {
        return (bool) session('customer_id');
    }
}

if (!function_exists('customer_id')) {
    /**
     * Get current customer ID.
     */
    function customer_id(): ?int
    {
        $value = session('customer_id');

        return $value ? (int) $value : null;
    }
}

if (!function_exists('customer_email')) {
    /**
     * Get current customer email.
     */
    function customer_email(): ?string
    {
        return session('customer_email') ?: null;
    }
}

if (!function_exists('customer_login_mode')) {
    /**
     * Get current customer login mode.
     */
    function customer_login_mode(): string
    {
        $mode = setting('customer_login_mode', 'password');

        return in_array($mode, ['none', 'password', 'otp'], true) ? $mode : 'password';
    }
}
