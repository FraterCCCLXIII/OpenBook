-- Align ea_users with Prisma User model (profile / contact fields).
ALTER TABLE `ea_users` ADD COLUMN `phone_number` VARCHAR(128) NULL;
ALTER TABLE `ea_users` ADD COLUMN `address` VARCHAR(256) NULL;
ALTER TABLE `ea_users` ADD COLUMN `city` VARCHAR(256) NULL;
ALTER TABLE `ea_users` ADD COLUMN `state` VARCHAR(128) NULL;
ALTER TABLE `ea_users` ADD COLUMN `zip_code` VARCHAR(64) NULL;
