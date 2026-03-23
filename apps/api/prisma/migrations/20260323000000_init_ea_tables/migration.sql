-- OpenBook baseline schema aligned with Easy!Appointments `ea_*` tables.

CREATE TABLE `ea_roles` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(256) NULL,
    `slug` VARCHAR(256) NULL,
    `is_admin` TINYINT NULL,
    `appointments` INTEGER NULL,
    `customers` INTEGER NULL,
    `services` INTEGER NULL,
    `users` INTEGER NULL,
    `system_settings` INTEGER NULL,
    `user_settings` INTEGER NULL,
    `webhooks` INTEGER NULL,
    `blocked_periods` INTEGER NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ea_users` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `first_name` VARCHAR(256) NULL,
    `last_name` VARCHAR(512) NULL,
    `email` VARCHAR(512) NULL,
    `id_roles` BIGINT NOT NULL,
    `timezone` VARCHAR(512) NULL,
    `language` VARCHAR(512) NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ea_user_settings` (
    `id_users` BIGINT NOT NULL,
    `username` VARCHAR(256) NULL,
    `password` VARCHAR(512) NULL,
    `salt` VARCHAR(512) NULL,
    `working_plan` TEXT NULL,
    `working_plan_exceptions` TEXT NULL,
    `notifications` TINYINT NULL,
    `google_sync` TINYINT NULL,
    `google_token` TEXT NULL,
    `google_calendar` VARCHAR(128) NULL,
    `sync_past_days` INTEGER NULL,
    `sync_future_days` INTEGER NULL,
    PRIMARY KEY (`id_users`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ea_customer_auth` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_id` BIGINT NOT NULL,
    `email` VARCHAR(512) NOT NULL,
    `password_hash` VARCHAR(255) NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'active',
    UNIQUE INDEX `ea_customer_auth_customer_id_key`(`customer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ea_settings` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(512) NULL,
    `value` LONGTEXT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ea_service_categories` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(256) NULL,
    `description` TEXT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ea_services` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(256) NULL,
    `duration` INTEGER NULL,
    `price` DECIMAL(10, 2) NULL,
    `currency` VARCHAR(32) NULL,
    `description` TEXT NULL,
    `id_service_categories` BIGINT NULL,
    `availabilities_type` VARCHAR(32) NULL,
    `attendants_number` INTEGER NULL DEFAULT 1,
    `is_private` TINYINT NULL DEFAULT 0,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ea_services_providers` (
    `id_users` BIGINT NOT NULL,
    `id_services` BIGINT NOT NULL,
    PRIMARY KEY (`id_users`, `id_services`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ea_appointments` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `book_datetime` DATETIME(0) NULL,
    `start_datetime` DATETIME(0) NULL,
    `end_datetime` DATETIME(0) NULL,
    `notes` TEXT NULL,
    `hash` TEXT NULL,
    `is_unavailability` TINYINT NOT NULL DEFAULT 0,
    `id_users_provider` BIGINT NULL,
    `id_users_customer` BIGINT NULL,
    `id_services` BIGINT NULL,
    INDEX `ea_appointments_id_users_provider_idx`(`id_users_provider`),
    INDEX `ea_appointments_start_datetime_idx`(`start_datetime`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ea_blocked_periods` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `create_datetime` DATETIME(0) NULL,
    `update_datetime` DATETIME(0) NULL,
    `name` VARCHAR(256) NULL,
    `start_datetime` DATETIME(0) NULL,
    `end_datetime` DATETIME(0) NULL,
    `notes` TEXT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ea_users` ADD CONSTRAINT `ea_users_id_roles_fkey` FOREIGN KEY (`id_roles`) REFERENCES `ea_roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ea_user_settings` ADD CONSTRAINT `ea_user_settings_id_users_fkey` FOREIGN KEY (`id_users`) REFERENCES `ea_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ea_customer_auth` ADD CONSTRAINT `ea_customer_auth_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `ea_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ea_services` ADD CONSTRAINT `ea_services_id_service_categories_fkey` FOREIGN KEY (`id_service_categories`) REFERENCES `ea_service_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `ea_services_providers` ADD CONSTRAINT `ea_services_providers_id_users_fkey` FOREIGN KEY (`id_users`) REFERENCES `ea_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ea_services_providers` ADD CONSTRAINT `ea_services_providers_id_services_fkey` FOREIGN KEY (`id_services`) REFERENCES `ea_services`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ea_appointments` ADD CONSTRAINT `ea_appointments_id_users_provider_fkey` FOREIGN KEY (`id_users_provider`) REFERENCES `ea_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ea_appointments` ADD CONSTRAINT `ea_appointments_id_users_customer_fkey` FOREIGN KEY (`id_users_customer`) REFERENCES `ea_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ea_appointments` ADD CONSTRAINT `ea_appointments_id_services_fkey` FOREIGN KEY (`id_services`) REFERENCES `ea_services`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
