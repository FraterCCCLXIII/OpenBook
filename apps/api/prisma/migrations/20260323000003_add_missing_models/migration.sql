-- Migration: Add missing PHP-fork models + Consent userId FK
-- Generated for OpenBook TypeScript port

-- GeoNames postal codes
CREATE TABLE IF NOT EXISTS `ea_geonames_postal_codes` (
  `id`           BIGINT       NOT NULL AUTO_INCREMENT,
  `postal_code`  VARCHAR(20)  NOT NULL,
  `country_code` VARCHAR(2)   NOT NULL,
  `place_name`   VARCHAR(256) NULL,
  `admin_name1`  VARCHAR(256) NULL,
  `admin_code1`  VARCHAR(20)  NULL,
  `latitude`     DOUBLE       NULL,
  `longitude`    DOUBLE       NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_postal_country` (`postal_code`, `country_code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Appointment notes
CREATE TABLE IF NOT EXISTS `ea_appointment_notes` (
  `id`              BIGINT    NOT NULL AUTO_INCREMENT,
  `id_appointments` BIGINT    NOT NULL,
  `id_users_author` BIGINT    NULL,
  `note`            TEXT      NULL,
  `create_datetime` DATETIME  NULL DEFAULT CURRENT_TIMESTAMP,
  `update_datetime` DATETIME  NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_appointment_notes_appt` (`id_appointments`),
  CONSTRAINT `fk_appt_notes_appt`
    FOREIGN KEY (`id_appointments`) REFERENCES `ea_appointments` (`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Customer notes
CREATE TABLE IF NOT EXISTS `ea_customer_notes` (
  `id`              BIGINT   NOT NULL AUTO_INCREMENT,
  `id_users`        BIGINT   NOT NULL,
  `notes`           TEXT     NULL,
  `create_datetime` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `update_datetime` DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_customer_notes_user` (`id_users`),
  CONSTRAINT `fk_customer_notes_user`
    FOREIGN KEY (`id_users`) REFERENCES `ea_users` (`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Customer alerts
CREATE TABLE IF NOT EXISTS `ea_customer_alerts` (
  `id`              BIGINT    NOT NULL AUTO_INCREMENT,
  `id_users`        BIGINT    NOT NULL,
  `message`         TEXT      NULL,
  `is_read`         TINYINT   NOT NULL DEFAULT 0,
  `create_datetime` DATETIME  NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_customer_alerts_user` (`id_users`),
  CONSTRAINT `fk_customer_alerts_user`
    FOREIGN KEY (`id_users`) REFERENCES `ea_users` (`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Custom fields
CREATE TABLE IF NOT EXISTS `ea_custom_fields` (
  `id`              INT          NOT NULL AUTO_INCREMENT,
  `name`            VARCHAR(256) NOT NULL,
  `field_type`      VARCHAR(32)  NOT NULL DEFAULT 'input',
  `default_value`   TEXT         NULL,
  `is_required`     TINYINT      NOT NULL DEFAULT 0,
  `is_displayed`    TINYINT      NOT NULL DEFAULT 1,
  `is_active`       TINYINT      NOT NULL DEFAULT 1,
  `sort_order`      INT          NOT NULL DEFAULT 0,
  `create_datetime` DATETIME     NULL DEFAULT CURRENT_TIMESTAMP,
  `update_datetime` DATETIME     NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Customer custom field values
CREATE TABLE IF NOT EXISTS `ea_customer_custom_field_values` (
  `id`               BIGINT   NOT NULL AUTO_INCREMENT,
  `id_users`         BIGINT   NOT NULL,
  `id_custom_fields` INT      NOT NULL,
  `value`            TEXT     NULL,
  `create_datetime`  DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  `update_datetime`  DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_ccfv_user` (`id_users`),
  INDEX `idx_ccfv_field` (`id_custom_fields`),
  CONSTRAINT `fk_ccfv_user`
    FOREIGN KEY (`id_users`) REFERENCES `ea_users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ccfv_field`
    FOREIGN KEY (`id_custom_fields`) REFERENCES `ea_custom_fields` (`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- User files
CREATE TABLE IF NOT EXISTS `ea_user_files` (
  `id`              BIGINT       NOT NULL AUTO_INCREMENT,
  `id_users`        BIGINT       NOT NULL,
  `filename`        VARCHAR(512) NOT NULL,
  `original_name`   VARCHAR(512) NOT NULL,
  `mime_type`       VARCHAR(128) NOT NULL,
  `file_size`       INT          NOT NULL DEFAULT 0,
  `create_datetime` DATETIME     NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_user_files_user` (`id_users`),
  CONSTRAINT `fk_user_files_user`
    FOREIGN KEY (`id_users`) REFERENCES `ea_users` (`id`) ON DELETE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add id_users FK to ea_consents
ALTER TABLE `ea_consents`
  ADD COLUMN IF NOT EXISTS `id_users` BIGINT NULL AFTER `type`,
  ADD INDEX IF NOT EXISTS `idx_consents_user` (`id_users`),
  ADD CONSTRAINT `fk_consents_user`
    FOREIGN KEY (`id_users`) REFERENCES `ea_users` (`id`) ON DELETE SET NULL;
