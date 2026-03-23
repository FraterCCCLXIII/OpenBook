-- OpenBook-native Stripe webhook idempotency table.

CREATE TABLE `openbook_stripe_events` (
    `id` VARCHAR(255) NOT NULL,
    `event_type` VARCHAR(128) NULL,
    `received_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
