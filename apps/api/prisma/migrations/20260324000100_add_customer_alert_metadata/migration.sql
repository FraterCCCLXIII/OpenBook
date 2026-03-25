-- Add alert metadata fields
ALTER TABLE `ea_customer_alerts`
  ADD COLUMN `alert_color` VARCHAR(32) NULL AFTER `is_read`,
  ADD COLUMN `author_name` VARCHAR(256) NULL AFTER `alert_color`;
