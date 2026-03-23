-- Add missing ea_* tables: OTP, Forms, Webhooks, Payments, Consents

CREATE TABLE `ea_customer_otp` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(512) NOT NULL,
    `email_hash` VARCHAR(512) NULL,
    `code_hash` VARCHAR(512) NULL,
    `expires_at` DATETIME(0) NULL,
    `attempt_count` INTEGER NOT NULL DEFAULT 0,
    `attempt_window_started_at` DATETIME(0) NULL,
    `send_count` INTEGER NOT NULL DEFAULT 0,
    `send_window_started_at` DATETIME(0) NULL,
    `last_send_at` DATETIME(0) NULL,
    `last_attempt_at` DATETIME(0) NULL,
    `lockout_until` DATETIME(0) NULL,
    `create_datetime` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP,
    `update_datetime` DATETIME(0) NULL,
    INDEX `ea_customer_otp_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ea_forms` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(256) NOT NULL,
    `slug` VARCHAR(256) NOT NULL,
    `description` TEXT NULL,
    `is_active` TINYINT NOT NULL DEFAULT 1,
    `create_datetime` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP,
    `update_datetime` DATETIME(0) NULL,
    UNIQUE INDEX `ea_forms_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ea_form_fields` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_forms` INTEGER NOT NULL,
    `label` VARCHAR(256) NOT NULL,
    `field_type` VARCHAR(32) NOT NULL DEFAULT 'input',
    `options` TEXT NULL,
    `is_required` TINYINT NOT NULL DEFAULT 0,
    `is_active` TINYINT NOT NULL DEFAULT 1,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    INDEX `ea_form_fields_id_forms_idx`(`id_forms`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ea_form_submissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_forms` INTEGER NOT NULL,
    `id_users` BIGINT NOT NULL,
    `submitted_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP,
    `fields_snapshot` LONGTEXT NULL,
    INDEX `ea_form_submissions_id_forms_idx`(`id_forms`),
    INDEX `ea_form_submissions_id_users_idx`(`id_users`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ea_form_assignments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_forms` INTEGER NOT NULL,
    `role_slug` VARCHAR(64) NOT NULL,
    INDEX `ea_form_assignments_id_forms_idx`(`id_forms`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ea_webhooks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(256) NOT NULL,
    `url` VARCHAR(1024) NOT NULL,
    `actions` VARCHAR(512) NULL,
    `secret_token` VARCHAR(256) NULL,
    `is_active` TINYINT NOT NULL DEFAULT 1,
    `is_ssl_verified` TINYINT NOT NULL DEFAULT 1,
    `notes` TEXT NULL,
    `create_datetime` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP,
    `update_datetime` DATETIME(0) NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ea_appointment_payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_appointments` BIGINT NOT NULL,
    `amount` DECIMAL(10, 2) NULL,
    `currency` VARCHAR(8) NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'pending',
    `stripe_event_id` VARCHAR(255) NULL,
    `stripe_payment_intent_id` VARCHAR(255) NULL,
    `stripe_checkout_session_id` VARCHAR(255) NULL,
    `create_datetime` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP,
    `update_datetime` DATETIME(0) NULL,
    INDEX `ea_appointment_payments_id_appointments_idx`(`id_appointments`),
    INDEX `ea_appointment_payments_stripe_event_id_idx`(`stripe_event_id`),
    INDEX `ea_appointment_payments_stripe_payment_intent_id_idx`(`stripe_payment_intent_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ea_consents` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ip` VARCHAR(64) NOT NULL,
    `type` VARCHAR(64) NOT NULL,
    `first_name` VARCHAR(256) NULL,
    `last_name` VARCHAR(256) NULL,
    `email` VARCHAR(512) NULL,
    `create_datetime` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP,
    `update_datetime` DATETIME(0) NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ea_form_fields` ADD CONSTRAINT `ea_form_fields_id_forms_fkey` FOREIGN KEY (`id_forms`) REFERENCES `ea_forms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ea_form_submissions` ADD CONSTRAINT `ea_form_submissions_id_forms_fkey` FOREIGN KEY (`id_forms`) REFERENCES `ea_forms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ea_form_submissions` ADD CONSTRAINT `ea_form_submissions_id_users_fkey` FOREIGN KEY (`id_users`) REFERENCES `ea_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ea_form_assignments` ADD CONSTRAINT `ea_form_assignments_id_forms_fkey` FOREIGN KEY (`id_forms`) REFERENCES `ea_forms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ea_appointment_payments` ADD CONSTRAINT `ea_appointment_payments_id_appointments_fkey` FOREIGN KEY (`id_appointments`) REFERENCES `ea_appointments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
