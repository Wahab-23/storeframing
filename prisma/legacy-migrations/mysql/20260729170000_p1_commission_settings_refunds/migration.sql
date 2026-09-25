-- CreateTable
CREATE TABLE `SiteSetting` (
    `id` VARCHAR(191) NOT NULL,
    `siteName` VARCHAR(191) NULL,
    `siteUrl` VARCHAR(191) NULL,
    `defaultTitle` VARCHAR(191) NULL,
    `titleTemplate` VARCHAR(191) NULL,
    `defaultMetaDescription` TEXT NULL,
    `defaultOgImageUrl` VARCHAR(191) NULL,
    `defaultTwitterImageUrl` VARCHAR(191) NULL,
    `robots` VARCHAR(191) NULL,
    `organizationJson` JSON NULL,
    `socialLinksJson` JSON NULL,
    `updatedByUserId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SiteSetting_updatedByUserId_idx`(`updatedByUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `CommissionRule`
    ADD COLUMN `sellerGroupId` VARCHAR(191) NULL AFTER `sellerId`,
    ADD COLUMN `productId` VARCHAR(191) NULL AFTER `categoryId`,
    ADD COLUMN `commissionType` ENUM('PERCENTAGE', 'FIXED_AMOUNT') NULL AFTER `productId`,
    ADD COLUMN `minimumOrderAmount` DECIMAL(18, 2) NULL AFTER `fixedAmount`,
    ADD COLUMN `maximumOrderAmount` DECIMAL(18, 2) NULL AFTER `minimumOrderAmount`,
    ADD COLUMN `startAt` DATETIME(3) NULL AFTER `maximumOrderAmount`,
    ADD COLUMN `endAt` DATETIME(3) NULL AFTER `startAt`;

-- Backfill commission rule types from the legacy percentage/fixed amount columns.
UPDATE `CommissionRule`
SET `commissionType` = CASE
    WHEN `fixedAmount` IS NOT NULL THEN 'FIXED_AMOUNT'
    ELSE 'PERCENTAGE'
END;

-- AlterTable
ALTER TABLE `CommissionRule`
    MODIFY `commissionType` ENUM('PERCENTAGE', 'FIXED_AMOUNT') NOT NULL;

-- AlterTable
ALTER TABLE `Refund`
    MODIFY `returnRequestId` VARCHAR(191) NULL,
    ADD COLUMN `orderId` VARCHAR(191) NULL AFTER `returnRequestId`,
    ADD COLUMN `sellerOrderId` VARCHAR(191) NULL AFTER `orderId`,
    ADD COLUMN `paymentId` VARCHAR(191) NULL AFTER `sellerOrderId`,
    ADD COLUMN `refundType` ENUM('RETURN', 'CANCELLATION', 'DISPUTE', 'GOODWILL', 'SHIPPING', 'MANUAL') NOT NULL DEFAULT 'RETURN' AFTER `amount`,
    ADD COLUMN `refundSource` ENUM('RETURN_REQUEST', 'ORDER', 'PAYMENT', 'ADMIN', 'SYSTEM') NOT NULL DEFAULT 'RETURN_REQUEST' AFTER `refundType`,
    ADD COLUMN `reason` TEXT NULL AFTER `refundSource`;

-- CreateIndex
CREATE INDEX `CommissionRule_sellerGroupId_idx` ON `CommissionRule`(`sellerGroupId`);

-- CreateIndex
CREATE INDEX `CommissionRule_productId_idx` ON `CommissionRule`(`productId`);

-- CreateIndex
CREATE INDEX `Refund_orderId_idx` ON `Refund`(`orderId`);

-- CreateIndex
CREATE INDEX `Refund_sellerOrderId_idx` ON `Refund`(`sellerOrderId`);

-- CreateIndex
CREATE INDEX `Refund_paymentId_idx` ON `Refund`(`paymentId`);

-- AddForeignKey
ALTER TABLE `SiteSetting` ADD CONSTRAINT `SiteSetting_updatedByUserId_fkey` FOREIGN KEY (`updatedByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CommissionRule` ADD CONSTRAINT `CommissionRule_sellerGroupId_fkey` FOREIGN KEY (`sellerGroupId`) REFERENCES `SellerGroup`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CommissionRule` ADD CONSTRAINT `CommissionRule_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Refund` ADD CONSTRAINT `Refund_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Refund` ADD CONSTRAINT `Refund_sellerOrderId_fkey` FOREIGN KEY (`sellerOrderId`) REFERENCES `SellerOrder`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Refund` ADD CONSTRAINT `Refund_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `Payment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
